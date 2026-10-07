import { type Assignment, buildLawroBrief, buildPresserBrief, buildSeasonBrief } from "@epl/core";
import { faceOf } from "./faces";
import {
  fixturePreviewBrief,
  tieCallBrief,
  tieReportBrief,
} from "./assemble";
import { columnBrief } from "./columns";
import { newsBrief } from "./news";
import { FIXTURE_PREVIEW, TIE_CALL, TIE_REPORT } from "./voice/matches";
import { DODGERS, ELEVEN, POWER_RANKING, WIRE } from "./voice/columns";
import { LAWRO } from "./voice/lawro";
import { LAWRO_SEASON } from "./voice/lawroSeason";
import type { PredictionsDesk } from "./predictions";
import type { SeasonDesk } from "./season";
import type { DraftJob } from "./draftWriter";
import type { ReportsJob } from "./reports";
import type { SheetsDesk } from "./sheets";
import { DRAFT_VOICE } from "./voice/draft";
import { REPORTS_VOICE } from "./voice/reports";
import { BIN_XI_VOICE } from "./voice/binXi";
import type { BinDesk } from "./binXi";
import { SHEETS_VOICE } from "./voice/sheets";
import { NEWS } from "./voice/news";
import { PRESSER } from "./voice/pressers";
import { faceCtx, type DeskContext } from "./dispatch";

// What a firing commissions: each assignment turned into the voice and brief a writer is handed.

/** How a column comes to exist: a voice and a brief for a writer, or a set of
 *  facts the desk prints itself. */
type Commission =
  | { system: string; brief: string; lawro?: PredictionsDesk; season?: SeasonDesk; sheets?: SheetsDesk; reports?: ReportsJob; draft?: DraftJob }
  | { system: string; brief: string; bin: BinDesk }
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

  // His power rankings likewise, with the order and every side's facts already made.
  if (assignment.kind === "season-rankings") {
    const desk = ctx.season;
    if (desk === null) return null;
    return { system: LAWRO_SEASON, brief: buildSeasonBrief({ calls: desk.calls, locksAt: desk.locksAt, slotName: desk.slotName }), season: desk };
  }

  // A match-day report is written, checked and read back through its own newsroom, from the day's joined facts.
  if (assignment.kind === "draft-report") {
    const job = assignment.cutoff === undefined ? undefined : ctx.drafts.get(assignment.cutoff);
    return job === undefined ? null : { system: DRAFT_VOICE, brief: "", draft: job };
  }
  if (assignment.kind === "match-report") {
    const job = assignment.day === undefined ? undefined : ctx.reports.get(assignment.day);
    return job === undefined ? null : { system: REPORTS_VOICE, brief: job.brief, reports: job };
  }

  // The Bin XI is written and checked through its own editor, from the side the desk picked.
  if (assignment.kind === "bin-xi") {
    return ctx.bin === null ? null : { system: BIN_XI_VOICE, brief: ctx.bin.brief, bin: ctx.bin };
  }

  // Team news is written a paragraph a side through its own editor, from facts the desk already joined.
  if (assignment.kind === "sheets") {
    return ctx.sheets === null ? null : { system: SHEETS_VOICE, brief: ctx.sheets.brief, sheets: ctx.sheets };
  }

  const scoped =
    assignment.kind === "fixture-preview"
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
                lines: ctx.presserLines,
                quotes: ctx.presserQuotes,
                spoke: ctx.presserSpoke,
                lead: faceOf(assignment, faceCtx(ctx))?.name ?? null,
                threads: ctx.threads,
              })
          : columnBrief(assignment, {
              gameweek: ctx.snapshot.gameweek,
              facts: ctx.facts,
              table: ctx.table,
              dodgers: ctx.dodgers,
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
