import type { RawElementSummary, RawHistoryEntry } from "./fpl/raw";
import type { SeasonTotals } from "./types";

// One footballer's season match by match, off `element-summary`: the only read with expected stats and
// defensive contribution per fixture (the live feed writes the round's total onto both rows of a double).

/** One match he has played, as FPL scores it; `fplPoints` is FPL's and never goes under a column headed FPts. */
export interface GameLogEntry {
  gameweek: number;
  /** Keys the row: a double gameweek puts two matches under one number. */
  fixtureId: number;
  opponentClubId: number;
  home: boolean;
  /** Goals for and against his club, turned round from FPL's home/away pair. */
  scored: number;
  conceded: number;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  yellowCards: number;
  redCards: number;
  saves: number;
  fplPoints: number;
  /** Null when FPL published no figure for this match; a nil is a measurement. */
  defensiveContribution: number | null;
  expectedGoals: number | null;
  expectedAssists: number | null;
  starts: number | null;
  tackles: number | null;
  clearancesBlocksInterceptions: number | null;
  recoveries: number | null;
  expectedGoalsConceded: number | null;
}

/** His season so far, most recent first; FPL's all-zero rows for unplayed matches are dropped. */
export function mapGameLog(summary: RawElementSummary): GameLogEntry[] {
  return (summary.history ?? [])
    .filter(played)
    .map(entry)
    .sort((a, b) => b.gameweek - a.gameweek || b.fixtureId - a.fixtureId);
}

/** A match with a score has kicked off (FPL scores a live one 0-0 from the first whistle); one without has not. */
function played(h: RawHistoryEntry): boolean {
  return h.team_h_score !== null && h.team_a_score !== null;
}

function entry(h: RawHistoryEntry): GameLogEntry {
  return {
    gameweek: h.round,
    fixtureId: h.fixture,
    opponentClubId: h.opponent_team,
    home: h.was_home,
    scored: (h.was_home ? h.team_h_score : h.team_a_score) ?? 0,
    conceded: (h.was_home ? h.team_a_score : h.team_h_score) ?? 0,
    minutes: h.minutes,
    goals: h.goals_scored,
    assists: h.assists,
    // FPL counts clean sheets rather than flagging them; one match kept one or did not.
    cleanSheet: h.clean_sheets > 0,
    yellowCards: h.yellow_cards,
    redCards: h.red_cards,
    saves: h.saves,
    fplPoints: h.total_points,
    defensiveContribution: h.defensive_contribution ?? null,
    expectedGoals: decimal(h.expected_goals),
    expectedAssists: decimal(h.expected_assists),
    starts: h.starts ?? null,
    tackles: h.tackles ?? null,
    clearancesBlocksInterceptions: h.clearances_blocks_interceptions ?? null,
    recoveries: h.recoveries ?? null,
    expectedGoalsConceded: decimal(h.expected_goals_conceded),
  };
}

/** The figures a player's rates are read from, which a window of matches can answer as well as a season. */
export type RateTotals = Pick<
  SeasonTotals,
  | "minutes"
  | "starts"
  | "expectedGoals"
  | "expectedAssists"
  | "tackles"
  | "clearancesBlocksInterceptions"
  | "recoveries"
  | "saves"
  | "expectedGoalsConceded"
>;

/** His matches in the given gameweeks, added up. A measurement FPL did not publish adds nothing. */
export function totalsOver(log: readonly GameLogEntry[], gameweeks: ReadonlySet<number>): RateTotals {
  const totals: RateTotals = {
    minutes: 0,
    starts: 0,
    expectedGoals: 0,
    expectedAssists: 0,
    tackles: 0,
    clearancesBlocksInterceptions: 0,
    recoveries: 0,
    saves: 0,
    expectedGoalsConceded: 0,
  };
  for (const match of log) {
    if (!gameweeks.has(match.gameweek)) continue;
    for (const key of Object.keys(totals) as (keyof RateTotals)[]) totals[key] += match[key] ?? 0;
  }
  return totals;
}

/** FPL's expected-goals decimal strings as numbers; absent or unparseable is null, never nought. */
function decimal(value: string | undefined): number | null {
  if (value === undefined) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}
