import type { StandingsRow } from "@epl/core";
import type { Unavailable } from "../refusals";

/** Each team's place in Fantrax's table, by team id: none when the table could not be read. */
export function placings(table: readonly StandingsRow[] | Unavailable): Map<string, number> {
  return new Map("unavailable" in table ? [] : table.map((row) => [row.teamId, row.rank] as const));
}
