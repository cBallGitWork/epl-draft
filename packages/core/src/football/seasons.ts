import type { RawElementSummary, RawPastSeason } from "./fpl/raw";

// What one footballer has done in the seasons before this one.
//
// Same read as `gameLog.ts` and a different question: that one is this season at
// match scale, this one is his career at season scale. They are separate files
// because a reader looking for "previous seasons" does not look in a file called
// `gameLog`, and because the reason the game log needs `element-summary` at all
// — per-fixture bps and expected goals — has nothing to do with this.
//
// The column set is short on purpose. `raw.ts` records the count: FPL writes
// every key on every row back to 2014/15, so a statistic it did not collect that
// year arrives as a zero rather than as an absence, and there is no way to tell
// the two apart from the row. Everything here is real in every season FPL
// publishes. Minutes stands in for appearances, which it has never published.

/** One completed season, as FPL scored and measured it.
 *
 *  Points are FPL's own. They are not our league's, and must never be printed in
 *  a column headed FPts — the same rule `gameLog.ts` states for a match. */
export interface PastSeason {
  /** FPL's own label, "2024/25" — never computed from a date. */
  season: string;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  goalsConceded: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  bonus: number;
  fplPoints: number;
}

/** His completed seasons, most recent first — the order a career is read in.
 *
 *  A season he did not play is kept. Unlike a game log, where an unplayed match
 *  is a row FPL wrote before kickoff, a zero-minute season is a fact about a man
 *  who was at the club and did not get on.
 *
 *  Sorted on the label rather than reversed: FPL hands these back oldest-first
 *  today (checked 4 Sep 2026), and a `.reverse()` is a silent bet on that never
 *  changing. `2018/19` through `2025/26` order correctly as strings. */
export function mapPastSeasons(summary: RawElementSummary): PastSeason[] {
  return (summary.history_past ?? [])
    .map(season)
    .sort((a, b) => b.season.localeCompare(a.season));
}

function season(raw: RawPastSeason): PastSeason {
  return {
    season: raw.season_name,
    minutes: raw.minutes,
    goals: raw.goals_scored,
    assists: raw.assists,
    cleanSheets: raw.clean_sheets,
    goalsConceded: raw.goals_conceded,
    yellowCards: raw.yellow_cards,
    redCards: raw.red_cards,
    saves: raw.saves,
    bonus: raw.bonus,
    fplPoints: raw.total_points,
  };
}
