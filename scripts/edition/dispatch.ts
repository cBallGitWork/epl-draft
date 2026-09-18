import {
  type Assignment,
  type Club,
  type EditionKind,
  type FootballSnapshot,
  type LeagueInfo,
  type PublishedStory,
  type StandingsRow,
  type PresserLine,
  type StoryThread,
  type ThreadUpdate,
  buildBrief,
  buildPresserBrief,
  normalizePublished,
} from "@epl/core";
import {
  faceOf,
  fixturePreviewBrief,
  matchReportBrief,
  tieCallBrief,
  tieReportBrief,
} from "./assemble";
import { columnBrief } from "./columns";
import { newsBrief } from "./news";
import type { RoundFacts } from "./facts";
import { storyOfColumn, storyOfEdition } from "./newsroom";
import { STORY_BYLINE, editionName } from "./voice/bylines";
import { FIXTURE_PREVIEW, MATCH_REPORT, TIE_CALL, TIE_REPORT } from "./voice/matches";
import { DODGERS, ELEVEN, POWER_RANKING, PREDICTIONS, WIRE } from "./voice/columns";
import { NEWS } from "./voice/news";
import { PRESSER, presserHeadline } from "./voice/pressers";
import { PREVIEW } from "./voice/rounds";

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
}

/** The one kind still written in the old sectioned edition shape. The report
 *  was the other until 3 Sep 2026; a round's football is now covered by a
 *  `tie-report` per tie, which is written in the story shape like everything
 *  else. When the preview follows, this table and `EditionKind` go with it. */
const ROUND_OF: Partial<Record<Assignment["kind"], EditionKind>> = {
  "round-preview": "preview",
};

export function prepare(assignment: Assignment, ctx: DeskContext): { system: string; brief: string } | null {
  const round = ROUND_OF[assignment.kind];
  if (round !== undefined) {
    return {
      system: PREVIEW,
      brief: buildBrief({
        kind: round,
        gameweek: ctx.snapshot.gameweek,
        period: ctx.period,
        teams: ctx.info.teams.map((team) => ({ teamId: team.teamId, name: team.name })),
        pairings: ctx.facts.pairings,
        projected: ctx.facts.projected,
        eleven: ctx.facts.eleven,
        fielded: ctx.facts.fielded,
        deals: ctx.facts.business,
        doubts: ctx.facts.doubts,
        pedigree: ctx.facts.pedigree,
      }),
    };
  }

  const scoped =
    assignment.kind === "match-report"
      ? matchReportBrief(assignment, ctx.snapshot, ctx.facts, ctx.clubs, ctx.threads)
      : assignment.kind === "fixture-preview"
        ? fixturePreviewBrief(assignment, ctx.snapshot, ctx.facts, ctx.clubs, ctx.threads)
        : assignment.kind === "tie-call"
          ? tieCallBrief(assignment, ctx.snapshot.gameweek, ctx.facts, ctx.threads)
          : assignment.kind === "tie-report"
            ? tieReportBrief(assignment, ctx.snapshot.gameweek, ctx.facts, ctx.threads)
          : assignment.kind === "news"
            ? newsBrief(assignment, ctx.facts, ctx.threads)
          : assignment.kind === "presser"
            ? buildPresserBrief({ gameweek: ctx.snapshot.gameweek, lines: ctx.presserLines, threads: ctx.threads })
          : columnBrief(assignment, {
              gameweek: ctx.snapshot.gameweek,
              facts: ctx.facts,
              table: ctx.table,
              threads: ctx.threads,
              marked: ctx.marked,
              named: (teamId) =>
                ctx.info.teams.find((team) => team.teamId === teamId)?.name ?? teamId,
            });
  if (scoped === null) return null;

  const system = VOICE[assignment.kind];
  if (system === undefined) return null;
  return { system, brief: scoped };
}

/** Which voice writes which kind. A kind with no voice has no desk yet and
 *  files nothing — the newsdesk may learn about a column before the paper can
 *  write it. */
const VOICE: Partial<Record<Assignment["kind"], string>> = {
  "match-report": MATCH_REPORT,
  "fixture-preview": FIXTURE_PREVIEW,
  "tie-call": TIE_CALL,
  "tie-report": TIE_REPORT,
  predictions: PREDICTIONS,
  eleven: ELEVEN,
  "power-ranking": POWER_RANKING,
  dodgers: DODGERS,
  wire: WIRE,
  news: NEWS,
  presser: PRESSER,
};

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
      ? { ...column, headline: presserHeadline(assignment.key.split(":").pop() ?? "") }
      : column;

  return storyOfColumn(copy, {
    slug: assignment.slug,
    kind: assignment.kind,
    leagueId: ctx.leagueId,
    period: ctx.period,
    gameweek: ctx.snapshot.gameweek,
    filedAt,
    // A preview piece dies at its kickoff; everything else leaves by
    // supersession or the cap.
    expiresAt:
      assignment.kind === "fixture-preview"
        ? (ctx.snapshot.fixtures.find((each) => each.id === assignment.fixtureId)?.kickoff ?? null)
        : null,
    edition: editionName(assignment.kind, filedAt),
    byline: STORY_BYLINE[assignment.kind] ?? "",
    subject: assignment.key,
    // The picture, chosen HERE from the facts and not from the prose. A model
    // that named the man would be a model choosing the photograph, which is the
    // one thing `strangers()` exists to catch it doing.
    face: faceOf(assignment, { facts: ctx.facts, fixtures: ctx.snapshot.fixtures }),
  });
}
