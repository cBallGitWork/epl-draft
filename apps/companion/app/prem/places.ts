import { type Club, type Fixture, leagueTable } from "@epl/core";

/** Each club's place in the Premier League table, by club id: CM's blue block on a score row. Empty before a ball is
 *  kicked, when the table's order is the alphabet. */
export function clubPlaces(fixtures: readonly Fixture[], clubs: readonly Club[]): Map<number, number> {
  const table = leagueTable(fixtures, clubs);
  if (table.every((row) => row.played === 0)) return new Map();
  return new Map(table.map((row, at) => [row.clubId, at + 1]));
}
