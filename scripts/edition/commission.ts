import { type Assignment, buildLawroBrief, buildPresserBrief } from "@epl/core";
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
import { DODGERS, ELEVEN, POWER_RANKING, WIRE } from "./voice/columns";
import { LAWRO } from "./voice/lawro";
import type { PredictionsDesk } from "./predictions";
import { NEWS } from "./voice/news";
import { PRESSER } from "./voice/pressers";
import { edition, faceCtx, type DeskContext } from "./dispatch";

// What a firing commissions: each assignment turned into the voice and brief a writer is handed.

/** How a column comes to exist: a voice and a brief for a writer, or a set of
 *  facts the desk prints itself. */
type Commission =
  | { system: string; brief: string; lawro?: PredictionsDesk }
  | { printed: Record<string, unknown> };

export function prepare(assignment: Assignment, ctx: DeskContext): Commission | null {
  // The elevens are a list of two hundred and twenty footballers, so they are
  // printed from the export and never written from it.
  if (assignment.kind === "predicted-xi") {
    return ctx.elevens === null ? null : { printed: ctx.elevens };
  }

  // Lawro's column goes through his own newsroom, with every call already made.
  if (assignment.kind === "predictions") {
    const desk = ctx.predictions;
    if (desk === null) return null;
    const brief = buildLawroBrief({ ...desk, teams: ctx.info.teams.map(({ teamId, name }) => ({ teamId, name })) });
    return brief === null ? null : { system: LAWRO, brief, lawro: desk };
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
  eleven: ELEVEN,
  "power-ranking": POWER_RANKING,
  dodgers: DODGERS,
  wire: WIRE,
  news: NEWS,
  presser: PRESSER,
};
