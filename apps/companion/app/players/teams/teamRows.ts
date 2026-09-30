import type { Club, PlClubSeason, SeasonTotals } from "@epl/core";

// Data › Teams: each club's season as the football counts it. Opta's figures off the Premier League,
// FPL's expected figures off the squad; no fantasy points of anybody's.

export interface TeamRow {
  club: Club;
  /** Opta's season for the club; null when the Premier League has none for it. */
  season: PlClubSeason | null;
  /** The squad's FPL season, added up; null when FPL files nobody there. */
  squad: SeasonTotals | null;
}

/** Every club's row, in the clubs' order: the Premier League's joins on FPL's club `code`, FPL's on its `id`. */
export function teamRows(
  clubs: readonly Club[],
  seasons: readonly PlClubSeason[],
  squads: ReadonlyMap<number, SeasonTotals>,
): TeamRow[] {
  const byCode = new Map(seasons.map((season) => [season.clubCode, season]));
  return clubs.map((club) => ({
    club,
    season: byCode.get(club.code) ?? null,
    squad: squads.get(club.id) ?? null,
  }));
}
