import { FANTRAX_LEAGUE_ID, type Assignment, type Club, type Fixture, type FootballSnapshot, type GameweekKickoff, type LeagueInfo } from "@epl/core";
import { binXiDesk } from "./binXi";
import type { DeskContext } from "./dispatch";
import { dodgersDesk } from "./dodgers";
import type { DeskFacts } from "./facts";
import { predictionsDesk } from "./predictions";
import { reportsDesk } from "./reports";
import { sheetsDesk } from "./sheets";
import type { readLedger } from "./persist";
import type { presserDesk } from "./presserWeek";
import { xiColumn, type readXi } from "./xi";

// Everything a desk may read this firing, built once the newsdesk has said there is work to do.

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
  say: (message: string) => void;
}): Promise<DeskContext> {
  const { snapshot, facts, clubs, byCode, info, period, gameweeks, ledger, sheet, xi, season, kickoffs, assignments, now, say } = input;
  return {
    leagueId: FANTRAX_LEAGUE_ID,
    snapshot,
    facts,
    clubs,
    threads: ledger[FANTRAX_LEAGUE_ID]?.threads ?? [],
    info,
    table: facts.table,
    period,
    // Lawro's reads are his own and made only when his column is due.
    predictions: await predictionsDesk({ assignments, info, snapshot, season, kickoffs, table: facts.table, business: facts.business, say }),
    // The team sheets' reads are their own too, and every earlier period's rosters are among them.
    sheets: await sheetsDesk({ assignments, info, snapshot, facts, period, gameweeks, season, clubs, now, say }),
    // A match-day report's reads are its own, made only when one is assigned.
    reports: await reportsDesk({ assignments, snapshot, facts, gameweeks, say }),
    // The Bin XI's reads are its own, made only on the Tuesday it is assigned.
    bin: await binXiDesk({ assignments, info, snapshot, facts, period, gameweeks, season, kickoffs, clubs, threads: ledger[FANTRAX_LEAGUE_ID]?.threads ?? [], say }),
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
    // The Points Dodgers read every finished match's commentary, only when the column is due.
    dodgers: await dodgersDesk({ assignments, snapshot, facts, info, say }),
  };
}
