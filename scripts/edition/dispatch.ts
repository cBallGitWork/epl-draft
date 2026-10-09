import {
  fullClubName,
  textOrNull,
  type Assignment,
  type Club,
  type FootballSnapshot,
  type LeagueInfo,
  type PublishedStory,
  type StoryFixture,
  type PresserLine,
  type PresserQuote,
  type StoryThread,
  type ThreadUpdate,
} from "@epl/core";
import { presserEdition, withStillOut } from "./presserWeek";
import { faceOf, type FaceContext } from "./faces";
import type { DeskFacts } from "./facts";
import type { PredictionsDesk } from "./predictions";
import type { SeasonDesk } from "./season";
import type { SheetsDesk } from "./sheets";
import { storyOfColumn } from "./newsroom";
import { COLUMNIST, STORY_BYLINE, editionName } from "./voice/bylines";
import { presserHeadline } from "./voice/pressers";
import type { DraftJob } from "./draftWriter";
import type { ReportsJob } from "./reports";
import type { BinDesk } from "./binXi";

// One assignment in, one prepared desk out: which voice writes it, from which brief, and how the words come back as a
// story. A kind with no desk yet returns null and spends nothing.

export interface DeskContext {
  leagueId: string;
  snapshot: FootballSnapshot;
  facts: DeskFacts;
  /** The league's running storylines, for every scoped brief's memory block. */
  threads: readonly StoryThread[];
  info: LeagueInfo;
  period: number;
  /** The round ahead as Lawro may know it; null unless his column is due this firing. */
  predictions: PredictionsDesk | null;
  /** The season as drafted and played out; null unless his season column is due this firing. */
  season: SeasonDesk | null;
  /** The locked sheets, their history and their brief; null unless team news is due this firing. */
  sheets: SheetsDesk | null;
  /** Each match-day report this firing commissioned, by its London day. */
  reports: ReadonlyMap<string, ReportsJob>;
  /** The Bin XI's side, brief and cargo; null unless it is due this firing. */
  bin: BinDesk | null;
  drafts: ReadonlyMap<"saturday" | "gameweek", DraftJob>;
  /** This week's press-conference signals, for men the league holds; empty until the intel export lands. */
  presserLines: PresserLine[];
  presserQuotes: (PresserQuote & { clubName: string })[];
  /** Who each club plays in the round the pressers preview, by FPL club code. */
  presserTies: Map<number, StoryFixture>;
  /** The round's clubs by FPL CODE, for checking the code a column echoed back against the club it named. */
  presserClubs: ReadonlyMap<number, Club>;
  /** The round the pressers PREVIEW, which between gameweeks is not the snapshot's. */
  presserGameweek: number;
  /** Clubs that held a conference, so one with no news still gets a row. */
  presserSpoke: { clubName: string; manager: string | null; at: string }[];
  /** The predicted elevens, composed from facts with no voice and no brief, and who they start; null when not this
   *  firing's. */
  elevens: { column: Record<string, unknown>; starters: ReadonlySet<number> } | null;
}

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
    presserLines: assignment.kind === "presser" ? edition(ctx, assignment).lines : ctx.presserLines,
    starters: ctx.elevens?.starters,
    players: ctx.snapshot.players,
    drafts: ctx.drafts,
  };
}

export function file(
  assignment: Assignment,
  column: Record<string, unknown>,
  ctx: DeskContext,
  filedAt: string,
): { story: PublishedStory; threads: ThreadUpdate[] } {
  // The Team Sheet's headline is the desk's, so a reader finds team news under one name every week (Craig, 18 Sep 2026).
  const copy =
    assignment.kind === "presser"
      ? {
          ...column,
          headline: presserHeadline(assignment.day ?? ""),
          // The fixture and the still-out list are the desk's, joined on the club code the writer echoed, never recalled by
          // a model. They join at the column's top level: `storyOfColumn` folds `teamNews` into `extras` only afterwards.
          teamNews: withStillOut(
            withTies(column.teamNews, ctx.presserTies, ctx.presserClubs),
            edition(ctx, assignment).lines,
          ),
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
    // The elevens die at the round's first kickoff; everything else leaves by supersession or the cap.
    expiresAt: assignment.kind === "predicted-xi" ? firstKickoff(copy.lineups) : null,
    // The newsdesk's: the elevens lead until their round's lock.
    leadsUntil: assignment.leadsUntil,
    edition: editionName(assignment.kind, filedAt, assignment.day),
    byline: STORY_BYLINE[assignment.kind] ?? "",
    reporter: COLUMNIST[assignment.kind],
    subject: assignment.key,
    // The picture is chosen here from the facts, never from the prose, so a model cannot choose the photograph.
    face: assignment.kind === "bin-xi" ? (ctx.bin?.face ?? null) : faceOf(assignment, faceCtx(ctx, assignment)),
  });
}

/** Each team-news row given its club's fixture from the desk and stripped of any the column wrote; a club code that is
 *  not the named club's draws neither crest nor fixture, as `{club: "Chelsea", code: 4}` once printed Newcastle's. */
function withTies(
  rows: unknown,
  ties: Map<number, StoryFixture>,
  clubs: ReadonlyMap<number, Club>,
): unknown {
  if (!Array.isArray(rows)) return rows;
  return rows.map((row) => {
    const { fixture: theirs, ...rest } = row as { fixture?: unknown; club?: unknown; code?: unknown };
    void theirs;
    const code = typeof rest.code === "number" ? rest.code : null;
    const named = code === null ? undefined : clubs.get(code);
    // The brief's spelling: FPL's own `name` is "Nott'm Forest" and would refuse every Forest row.
    const agrees = named !== undefined && typeof rest.club === "string" && fullClubName(named.name) === rest.club;
    if (!agrees) return { ...rest, code: null };
    const tie = ties.get(code as number);
    return tie === undefined ? rest : { ...rest, fixture: tie };
  });
}

/** When the round the elevens predict begins — the moment a prediction is spent and the real sheets exist. The cargo
 *  is in home-club order, so the earliest is searched for; an unreadable kickoff is skipped. */
export function firstKickoff(lineups: unknown): string | null {
  if (!Array.isArray(lineups)) return null;
  const kickoffs = lineups
    .map((tie) => textOrNull((tie as { kickoff?: unknown } | null)?.kickoff))
    .filter((kickoff): kickoff is string => kickoff !== null && !Number.isNaN(Date.parse(kickoff)));
  return kickoffs.reduce<string | null>((first, at) => (first === null || Date.parse(at) < Date.parse(first) ? at : first), null);
}
