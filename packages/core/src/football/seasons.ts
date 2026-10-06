import type { RawElementSummary, RawPastSeason } from "./fpl/raw";

// One footballer's completed seasons, off `element-summary`'s `history_past`.
// Only columns real in every season: FPL writes a stat it did not collect that year as a zero, not an absence.

/** One completed season as FPL scored it; `fplPoints` is FPL's and never goes under a column headed FPts. */
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
  fplPoints: number;
}

/** His completed seasons, most recent first, a zero-minute season kept; sorted on the label, never FPL's order reversed. */
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
    fplPoints: raw.total_points,
  };
}
