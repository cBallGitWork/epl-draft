import { printedPlaces, type StandingsRow } from "@epl/core";
import type { Unavailable } from "../refusals";

/** Each team's place in the table as CM's blue block prints it (`3rd`, `=1st`), by team id: none when the table
 *  could not be read. */
export function placings(table: readonly StandingsRow[] | Unavailable): Map<string, string> {
  return "unavailable" in table ? new Map() : printedPlaces(table);
}
