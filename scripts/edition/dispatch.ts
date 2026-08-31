import {
  type Assignment,
  type Club,
  type EditionKind,
  type FootballSnapshot,
  type LeagueInfo,
  type PublishedStory,
  type StandingsRow,
  type StoryThread,
  type ThreadUpdate,
  buildBrief,
  normalizePublished,
  stories,
} from "@epl/core";
import { fixturePreviewBrief, matchReportBrief, tieCallBrief } from "./assemble";
import { columnBrief } from "./columns";
import { newsBrief } from "./news";
import type { RoundFacts } from "./facts";
import { storyOfColumn, storyOfEdition } from "./newsroom";
import { STORY_BYLINE, editionName } from "./voice/bylines";
import { FIXTURE_PREVIEW, MATCH_REPORT, TIE_CALL } from "./voice/matches";
import { DODGERS, ELEVEN, POWER_RANKING, PREDICTIONS, WIRE } from "./voice/columns";
import { PRESSER, STUDIO } from "./voice/sketches";
import { NEWS } from "./voice/news";
import { PREVIEW, REPORT } from "./voice/rounds";

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
}

const ROUND_OF: Partial<Record<Assignment["kind"], EditionKind>> = {
  "round-report": "report",
  "round-preview": "preview",
};

export function prepare(assignment: Assignment, ctx: DeskContext): { system: string; brief: string } | null {
  const round = ROUND_OF[assignment.kind];
  if (round !== undefined) {
    return {
      system: round === "report" ? REPORT : PREVIEW,
      brief: buildBrief({
        kind: round,
        gameweek: ctx.snapshot.gameweek,
        period: ctx.period,
        teams: ctx.info.teams.map((team) => ({ teamId: team.teamId, name: team.name })),
        pairings: ctx.facts.pairings,
        scores: ctx.facts.scores,
        projected: ctx.facts.projected,
        stories:
          round === "report" && ctx.facts.eleven !== null
            ? stories(
                ctx.facts.pairings,
                ctx.facts.scores,
                ctx.facts.fielded ? ctx.facts.eleven : null,
                ctx.facts.business,
                ctx.period,
              )
            : [],
        eleven: ctx.facts.eleven,
        fielded: ctx.facts.fielded,
        deals: ctx.facts.business,
        doubts: ctx.facts.doubts,
        pedigree: ctx.facts.pedigree,
        marked: round === "report" ? ctx.marked : null,
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
          : assignment.kind === "news"
            ? newsBrief(assignment, ctx.facts, ctx.threads)
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
  predictions: PREDICTIONS,
  eleven: ELEVEN,
  "power-ranking": POWER_RANKING,
  dodgers: DODGERS,
  wire: WIRE,
  news: NEWS,
  presser: PRESSER,
  studio: STUDIO,
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

  return storyOfColumn(column, {
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
  });
}
