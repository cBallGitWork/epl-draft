import {
  type Assignment,
  type Club,
  type EditionKind,
  type FootballSnapshot,
  type LeagueInfo,
  type PublishedStory,
  type StandingsRow,
  type PresserLine,
  type PresserQuote,
  type StoryThread,
  type ThreadUpdate,
  normalizePublished,
} from "@epl/core";
import { presserEdition } from "./presserWeek";
import { faceOf, type FaceContext } from "./faces";
import { fullClubName } from "@epl/core";
import type { RoundFacts } from "./facts";
import { storyOfColumn, storyOfEdition } from "./newsroom";
import { STORY_BYLINE, editionName } from "./voice/bylines";
import { presserHeadline } from "./voice/pressers";

// One assignment in, one prepared desk out: which voice writes it, from which
// brief, and how the words come back as a story. A kind with no desk yet
// returns null and spends nothing — the newsdesk may know about a kind before
// the paper can write it.

export interface DeskContext {
  leagueId: string;
  snapshot: FootballSnapshot;
  facts: RoundFacts;
  clubs: Map<number, Club>;
  /** The league's running storylines, for every scoped brief's memory block. */
  threads: readonly StoryThread[];
  info: LeagueInfo;
  /** Fantrax's table, for the rankings to argue with. */
  table: readonly StandingsRow[];
  period: number;
  /** The round's first kickoff — a preview's expiry. */
  kickoff: string | null;
  /** How the last preview's calls went, report-time only. */
  marked: { right: number; called: number } | null;
  /** This week's press-conference signals, for men the league holds. Empty until
   *  the intel export lands, which files no Team Sheet and spends nothing. */
  presserLines: PresserLine[];
  presserQuotes: (PresserQuote & { clubName: string })[];
  /** Who each club plays in the round the pressers preview, by FPL club code. */
  presserTies: Map<number, { opponent: string; home: boolean; kickoff: string }>;
  /** The round's clubs by FPL CODE, for checking the code a column echoed back
   *  against the club it named beside it. */
  presserClubs: ReadonlyMap<number, Club>;
  /** The round the pressers PREVIEW, which between gameweeks is not the one the
   *  snapshot is focused on. The brief printed "TEAM NEWS, gameweek 4" beside
   *  gameweek 5's fixtures, off an article titled "Gameweek 5 team news". */
  presserGameweek: number;
  /** Clubs that held a conference, so one with no news still gets a row. */
  presserSpoke: { clubName: string; manager: string | null; at: string }[];
  /** The predicted elevens, composed from facts rather than written — the one
   *  column with no voice and no brief. Null when it is not this firing's. */
  elevens: Record<string, unknown> | null;
}

/** The one kind still written in the old sectioned edition shape. The report
 *  was the other until 3 Sep 2026; a round's football is now covered by a
 *  `tie-report` per tie, which is written in the story shape like everything
 *  else. When the preview follows, this table and `EditionKind` go with it. */
export const ROUND_OF: Partial<Record<Assignment["kind"], EditionKind>> = {
  "round-preview": "preview",
};

/** One edition of the Team Sheet — the day's conferences, and nothing else.
 *  Every consumer reads the same narrowing: the brief, the picture and the lead. */
export function edition(ctx: DeskContext, assignment: Assignment) {
  return presserEdition(assignment.day ?? "", {
    lines: ctx.presserLines,
    quotes: ctx.presserQuotes,
    spoke: ctx.presserSpoke,
  });
}

/** What `faceOf` reads. The presser's men are narrowed to the assignment's own
 *  DAY, or the picture and the lead are chosen from the whole week. */
export function faceCtx(ctx: DeskContext, assignment: Assignment): FaceContext {
  return {
    facts: ctx.facts,
    fixtures: ctx.snapshot.fixtures,
    presserLines: assignment.kind === "presser" ? edition(ctx, assignment).lines : ctx.presserLines,
    players: ctx.snapshot.players,
  };
}

export function file(
  assignment: Assignment,
  column: Record<string, unknown>,
  ctx: DeskContext,
  filedAt: string,
): { story: PublishedStory; threads: ThreadUpdate[] } {
  const round = ROUND_OF[assignment.kind];
  if (round !== undefined) {
    const published = normalizePublished({
      ...column,
      kind: round,
      leagueId: ctx.leagueId,
      period: ctx.period,
      gameweek: ctx.snapshot.gameweek,
      filedAt,
      byline: STORY_BYLINE[assignment.kind] ?? "",
    });
    if (published === null) throw new Error("The column did not come back in a shape the page can print.");
    // The round shape carries no threads; its sagas arrive when its prompts
    // move to the story shape.
    return {
      story: storyOfEdition(published, assignment.key, ctx.kickoff, editionName(assignment.kind, filedAt)),
      threads: [],
    };
  }

  // **The Team Sheet's headline is the desk's, not the writer's.** A reader
  // looking for team news should find the words, not a pun he has to decode —
  // and a thread that runs every week under a different name reads as a
  // different article each time. Craig, 18 Sep 2026.
  // The day is the last segment of the key — `presser:gw4:2026-09-17`.
  const copy =
    assignment.kind === "presser"
      ? {
          ...column,
          headline: presserHeadline(assignment.day ?? ""),
          // The fixture is the DESK's, joined on the club code the writer echoed
          // back. Asking the column for it would be asking a model to recall a
          // fixture list, which is the one thing `strangers()` exists to stop.
          //
          // `teamNews` sits at the column's TOP LEVEL — `storyOfColumn` folds it
          // into `extras` afterwards — so this joins there and not on `extras`,
          // which is undefined at this point and silently kept the fixture off
          // every row.
          teamNews: withTies(column.teamNews, ctx.presserTies, ctx.presserClubs),
        }
      : column;

  return storyOfColumn(copy, {
    slug: assignment.slug,
    kind: assignment.kind,
    leagueId: ctx.leagueId,
    // A look-ahead story carries the round it previews, or it sorts with last week's.
    period: assignment.round?.period ?? ctx.period,
    gameweek: assignment.round?.gameweek ?? ctx.snapshot.gameweek,
    filedAt,
    // A preview piece dies at its kickoff; everything else leaves by
    // supersession or the cap.
    expiresAt:
      assignment.kind === "fixture-preview"
        ? (ctx.snapshot.fixtures.find((each) => each.id === assignment.fixtureId)?.kickoff ?? null)
        : assignment.kind === "predicted-xi"
          ? firstKickoff(copy.lineups)
          : null,
    edition: editionName(assignment.kind, filedAt),
    byline: STORY_BYLINE[assignment.kind] ?? "",
    subject: assignment.key,
    // The picture, chosen HERE from the facts and not from the prose. A model
    // that named the man would be a model choosing the photograph, which is the
    // one thing `strangers()` exists to catch it doing.
    face: faceOf(assignment, faceCtx(ctx, assignment)),
  });
}

/** Each team-news row given the fixture its club plays — and stripped of
 *  anything about that fixture the COLUMN wrote.
 *
 *  Two things the model may not be trusted with, both of which it can produce
 *  in a shape `normalizeExtras` accepts:
 *
 *  **A fixture.** The row was returned untouched when the desk had no tie for
 *  it, so a fixture the writer invented survived and printed. That path is
 *  reachable whenever `fetchFixtures` fails or FPL has not published the round.
 *
 *  **A club code that does not belong to the club it named.** The code draws
 *  the crest and joins the fixture, and `{club: "Chelsea", code: 4}` printed
 *  Newcastle's crest and Newcastle's opponent under a Chelsea heading. This is
 *  the check `presserLines` already makes one layer down, where a signal whose
 *  player-club and export-club disagree is refused. */
function withTies(
  rows: unknown,
  ties: Map<number, { opponent: string; home: boolean; kickoff: string }>,
  clubs: ReadonlyMap<number, Club>,
): unknown {
  if (!Array.isArray(rows)) return rows;
  return rows.map((row) => {
    const { fixture: theirs, ...rest } = row as { fixture?: unknown; club?: unknown; code?: unknown };
    void theirs;
    const code = typeof rest.code === "number" ? rest.code : null;
    // The club it NAMED must be the club that code belongs to, or the code is
    // not usable for a crest or a fixture and the row prints without either.
    const named = code === null ? undefined : clubs.get(code);
    const agrees =
      named !== undefined &&
      typeof rest.club === "string" &&
      // `fullClubName`, because that is the spelling the BRIEF gave it — FPL's
      // own `name` is "Nott'm Forest" and comparing against that would refuse
      // every Forest row and cost it its crest.
      fullClubName(named.name) === rest.club;
    if (!agrees) return { ...rest, code: null };
    const tie = ties.get(code as number);
    return tie === undefined ? rest : { ...rest, fixture: tie };
  });
}

/** When the round the elevens predict begins — the moment a prediction is spent
 *  and the real sheets exist. The cargo is already in kickoff order. */
function firstKickoff(lineups: unknown): string | null {
  if (!Array.isArray(lineups)) return null;
  const kickoff = (lineups[0] as { kickoff?: unknown } | undefined)?.kickoff;
  return typeof kickoff === "string" && kickoff !== "" ? kickoff : null;
}
