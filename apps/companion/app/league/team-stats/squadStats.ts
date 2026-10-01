import { squadLines, type CategoryLine } from "@epl/core";
import { intelStats } from "../../intel";
import { getLeagueSquads } from "../../squads";
import { SQUAD_COLUMNS } from "./squadColumns";

/** Every squad's season off the stats league, keyed as the board reads lines; empty before the draft or with Fantrax silent. */
export async function getSquadStats(): Promise<Map<string, CategoryLine[]>> {
  const squads = await getLeagueSquads();
  if (!("period" in squads)) return new Map();
  return squadLines(squads.period.teams, intelStats, SQUAD_COLUMNS.map((column) => column.key));
}
