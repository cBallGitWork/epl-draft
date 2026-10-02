import { stat, type StatsRow } from "../football/intel/stats";
import type { StatKey } from "../football/intel/statKeys";
import type { CategoryLine } from "../league/fantrax/seasonStats";
import { isResolved, type RosteredTeam } from "./roster";

// What the men each team holds now have done all season, off the stats league's counts by FPL code.

/** Each team's men's counts added up per key, in the board's line shape; null for a team none of whose men has one. */
export function squadLines(
  teams: readonly RosteredTeam[],
  stats: ReadonlyMap<number, StatsRow>,
  keys: readonly StatKey[],
): Map<string, CategoryLine[]> {
  return new Map(
    keys.map((key) => [key, teams.map((team) => ({ teamId: team.teamId, points: null, value: total(team, stats, key) }))]),
  );
}

function total(team: RosteredTeam, stats: ReadonlyMap<number, StatsRow>, key: StatKey): number | null {
  let sum: number | null = null;
  for (const held of team.players) {
    if (!isResolved(held)) continue;
    const count = stat(stats.get(held.player.code), key);
    if (count !== null) sum = (sum ?? 0) + count;
  }
  return sum;
}
