import { type Club, type Fixture, leagueTable } from "@epl/core";

/** Each club's place in the Premier League table, by club id: CM's blue block on a score row. */
export function clubPlaces(fixtures: readonly Fixture[], clubs: readonly Club[]): Map<number, number> {
  return new Map(leagueTable(fixtures, clubs).map((row, at) => [row.clubId, at + 1]));
}
