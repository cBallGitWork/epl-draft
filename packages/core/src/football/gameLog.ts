import type { RawElementSummary, RawHistoryEntry } from "./fpl/raw";
import type { SeasonTotals } from "./types";

// What one footballer has actually done, match by match.
//
// The snapshot cannot answer this. It holds one round, and the four numbers a
// scout wants most — bps, expected goals, expected assists, defensive
// contribution — are the four FPL leaves out of its live `explain` block, so
// `mapLiveStats` takes them off the gameweek aggregate and writes the same
// round total onto every fixture row a player has. On a double gameweek that
// figure is not a per-match number at all.
//
// `element-summary` publishes them per fixture, correctly, for every match of
// the season. This is the only read in the football layer that does.

/** One match he has been through, as FPL scores and measures it.
 *
 *  Points are FPL's own, under FPL's rules. They are not our league's and must
 *  never be printed in a column headed FPts, which is Fantrax's word for
 *  Fantrax's scoring of a slot we chose. */
export interface GameLogEntry {
  gameweek: number;
  /** Keys the row: a double gameweek puts two matches under one number. */
  fixtureId: number;
  opponentClubId: number;
  home: boolean;
  /** Goals for and against HIS club, turned round from FPL's home/away pair so
   *  a reader never has to work out which end he was at. */
  scored: number;
  conceded: number;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  yellowCards: number;
  redCards: number;
  saves: number;
  bonus: number;
  bps: number;
  fplPoints: number;
  /** Null when FPL published no figure for this match, which is not the same as
   *  a nil: a nil is a measurement and this is its absence. */
  defensiveContribution: number | null;
  expectedGoals: number | null;
  expectedAssists: number | null;
  starts: number | null;
  tackles: number | null;
  clearancesBlocksInterceptions: number | null;
  recoveries: number | null;
  expectedGoalsConceded: number | null;
}

/** His season so far, most recent first — the order a log is read in.
 *
 *  Matches nobody has played are dropped. FPL carries a row for them from the
 *  moment a round opens, all zeroes, and it is indistinguishable from an unused
 *  substitute's row except that the fixture has no score yet. Keeping them would
 *  put a line reading "0 minutes, 0 points" under a match that kicks off on
 *  Sunday, which is the confident wrong number in its purest form. What is
 *  coming is a fixture question and `nextFixtures` answers it. */
export function mapGameLog(summary: RawElementSummary): GameLogEntry[] {
  return (summary.history ?? [])
    .filter(played)
    .map(entry)
    .sort((a, b) => b.gameweek - a.gameweek || b.fixtureId - a.fixtureId);
}

/** A match with a score is a match that has been played, including one still
 *  being played — FPL scores those 0-0 from the first whistle. A match with none
 *  has not kicked off, whatever the rest of the row says. */
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
    // FPL counts clean sheets rather than flagging them, because its aggregate
    // rows add several matches up. One match kept one or it did not.
    cleanSheet: h.clean_sheets > 0,
    yellowCards: h.yellow_cards,
    redCards: h.red_cards,
    saves: h.saves,
    bonus: h.bonus,
    bps: h.bps,
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
  | "bps"
  | "bonus"
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
    bps: 0,
    bonus: 0,
  };
  for (const match of log) {
    if (!gameweeks.has(match.gameweek)) continue;
    for (const key of Object.keys(totals) as (keyof RateTotals)[]) totals[key] += match[key] ?? 0;
  }
  return totals;
}

/** FPL sends the expected-goals family as decimal strings. An absent field is
 *  null rather than nought; so is one that will not parse, because a string FPL
 *  changed the shape of is news, not a zero. */
function decimal(value: string | undefined): number | null {
  if (value === undefined) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}
