import { FANTRAX_LEAGUE_ID, type Assignment, type Club, type Fixture, type FootballSnapshot, type GameweekKickoff, type LeagueInfo } from "@epl/core";
import { binXiDesk } from "./binXi";
import type { DeskContext } from "./dispatch";
import { dodgersDesk } from "./dodgers";
import type { DeskFacts } from "./facts";
import type { Say } from "./newsroom";
import { predictionsDesk } from "./predictions";
import { seasonDesk } from "./season";
import { draftsDesk } from "./drafts";
import { reportsDesk } from "./reports";
import { sheetsDesk } from "./sheets";
import type { readLedger } from "./persist";
import type { presserDesk } from "./presserWeek";
import { xiColumn, type readXi } from "./xi";

// Everything a desk may read this firing, built once the newsdesk has said there is work to do. Each desk's reads run in
// turn (Fantrax throttles bursts) and are caught on their own: a failed desk is empty, so its kind refuses and its key
// stays unspent, and `lost` names it so the firing ends red after filing the rest.

/** One desk's reads; a throw is said, named in `lost` and answered with the desk's empty value. */
async function readDesk<T>(kind: Assignment["kind"], read: () => Promise<T>, empty: T, lost: string[], say: Say): Promise<T> {
  try {
    return await read();
  } catch (error) {
    say(`  ⚠ ${kind}: the desk's reads failed, so it files nothing this firing: ${error instanceof Error ? error.message : String(error)}`);
    lost.push(kind);
    return empty;
  }
}

export async function deskContext(input: {
  snapshot: FootballSnapshot;
  facts: DeskFacts;
  clubs: Map<number, Club>;
  /** Clubs by FPL code, which is what a presser signal carries and what a crest keys off. */
  byCode: Map<number, Club>;
  info: LeagueInfo;
  period: number;
  /** The gameweeks the round's period scores. */
  gameweeks: readonly number[];
  ledger: ReturnType<typeof readLedger>;
  sheet: ReturnType<typeof presserDesk>;
  xi: ReturnType<typeof readXi>;
  season: readonly Fixture[];
  kickoffs: readonly GameweekKickoff[];
  assignments: readonly Assignment[];
  /** The firing's one instant. */
  now: string;
  say: Say;
}): Promise<{ ctx: DeskContext; lost: string[] }> {
  const { snapshot, facts, clubs, byCode, info, period, gameweeks, ledger, sheet, xi, season, kickoffs, assignments, now, say } = input;
  // The period's dates choose its matches: FPL files a replayed postponement under its old gameweek.
  const scoring = info.scoringPeriods.find((each) => each.number === period);
  const threads = ledger[FANTRAX_LEAGUE_ID]?.threads ?? [];
  const lost: string[] = [];
  // Lawro's reads are his own and made only when his column is due.
  const predictions = await readDesk("predictions", () => predictionsDesk({ assignments, info, snapshot, season, kickoffs, table: facts.table, business: facts.business, say }), null, lost, say);
  // His season column's reads too: every squad as drafted, played out over the schedule.
  const seasonColumn = await readDesk("season-rankings", () => seasonDesk({ assignments, info, snapshot, kickoffs, pedigree: facts.pedigree, say }), null, lost, say);
  // The team sheets' reads are their own too, and every earlier period's rosters are among them.
  const sheets = await readDesk("sheets", () => sheetsDesk({ assignments, info, snapshot, facts, period, scoring, season, clubs, now, say }), null, lost, say);
  // A match-day report's reads are its own, made only when one is assigned.
  const reports = await readDesk("match-report", () => reportsDesk({ assignments, snapshot, facts, scoring, say }), new Map(), lost, say);
  // The Bin XI's reads are its own, made only on the Tuesday it is assigned.
  const bin = await readDesk("bin-xi", () => binXiDesk({ assignments, info, snapshot, facts, period, gameweeks, season, kickoffs, clubs, threads, say }), null, lost, say);
  // A draft report's reads likewise: the gameweek's day reads, rosters and results, only when one is assigned.
  const drafts = await readDesk("draft-report", () => draftsDesk({ assignments, gameweek: snapshot.gameweek, say }), new Map(), lost, say);
  // The Points Dodgers read every finished match's commentary, only when the column is due.
  const dodgers = await readDesk("dodgers", () => dodgersDesk({ assignments, snapshot, facts, say }), null, lost, say);
  const ctx: DeskContext = {
    leagueId: FANTRAX_LEAGUE_ID,
    snapshot,
    facts,
    clubs,
    threads,
    info,
    table: facts.table,
    period,
    predictions,
    season: seasonColumn,
    sheets,
    reports,
    bin,
    drafts,
    presserLines: sheet.lines,
    presserQuotes: sheet.quotes,
    presserTies: sheet.ties,
    presserClubs: byCode,
    presserGameweek: sheet.gameweek,
    presserSpoke: sheet.spoke,
    // Composed here, once, rather than per assignment in the loop.
    elevens:
      xi === null || !assignments.some((each) => each.kind === "predicted-xi")
        ? null
        : xiColumn({
            xi,
            gameweek: sheet.gameweek,
            clubs: byCode,
            teams: facts.teams,
            players: snapshot.players,
            season,
          }),
    dodgers,
  };
  return { ctx, lost };
}
