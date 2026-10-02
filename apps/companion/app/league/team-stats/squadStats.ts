import { squadLines, type CategoryLine } from "@epl/core";
import { intelStats } from "../../intel";
import { getLeagueSquads } from "../../squads";
import { SQUAD_COLUMNS } from "./squadColumns";

/** Every squad's season off the stats league, keyed as the board reads lines; empty before the draft or with Fantrax silent. */
export async function getSquadStats(): Promise<Map<string, CategoryLine[]>> {
  const squads = await getLeagueSquads();
  if (!("period" in squads)) return new Map();
  // An undrafted league answers every team with an empty roster: no squads, not a board of dashes.
  const held = squads.period.teams.filter((team) => team.players.length > 0);
  return squadLines(held, intelStats, SQUAD_COLUMNS.map((column) => column.key));
}
