import {
  type Assignment,
  buildBrief,
  buildPresserBrief,
} from "@epl/core";
import { faceOf } from "./faces";
import {
  fixturePreviewBrief,
  matchReportBrief,
  tieCallBrief,
  tieReportBrief,
} from "./assemble";
import { columnBrief } from "./columns";
import { newsBrief } from "./news";
import { FIXTURE_PREVIEW, MATCH_REPORT, TIE_CALL, TIE_REPORT } from "./voice/matches";
import { DODGERS, ELEVEN, POWER_RANKING, PREDICTIONS, WIRE } from "./voice/columns";
import { NEWS } from "./voice/news";
import { PRESSER } from "./voice/pressers";
import { PREVIEW } from "./voice/rounds";
import { ROUND_OF, edition, faceCtx, type DeskContext } from "./dispatch";

// What a firing commissions: each assignment turned into the voice and brief a writer is handed.

/** How a column comes to exist: a voice and a brief for a writer, or a set of
 *  facts the desk prints itself. */
type Commission =
  | { system: string; brief: string }
  | { printed: Record<string, unknown> };

export function prepare(assignment: Assignment, ctx: DeskContext): Commission | null {
  // The elevens are a list of two hundred and twenty footballers, so they are
  // printed from the export and never written from it.
  if (assignment.kind === "predicted-xi") {
    return ctx.elevens === null ? null : { printed: ctx.elevens };
  }

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
            ? buildPresserBrief({
                gameweek: ctx.presserGameweek,
                ...edition(ctx, assignment),
                lead: faceOf(assignment, faceCtx(ctx, assignment))?.name ?? null,
                threads: ctx.threads,
              })
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
