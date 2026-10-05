import type { ProjectedPlayer } from "../../football/intel/projections";
import type { LeagueProjectionRow } from "../../join/leagueProjectionFile";

// One squad man's season as the simulation reads it: his expected points per period at every slot he may fill, in the
// league's own scoring (the draft pack), and how far a week may stray from that (the sister model's band). Pure.

export interface SeasonMan {
  fantraxId: string;
  code: number;
  name: string;
  /** His expected points at each eligible slot, by period. */
  periods: ReadonlyMap<number, Readonly<Record<string, number>>>;
  /** One standard deviation of a week's points as a share of its mean. */
  spread: number;
  /** His season at his best slot, every period added. */
  season: number;
}

/** `gameweeks` is the pack's window, `periods` each league period's gameweeks, `z` the band's half-width in deviations. */
export function seasonMan(
  row: LeagueProjectionRow,
  band: ProjectedPlayer | undefined,
  window: readonly number[],
  periods: ReadonlyMap<number, readonly number[]>,
  z: number,
): SeasonMan {
  // Past the pack's window a man's gameweek is his average gameweek inside it.
  const perGameweek = (slot: string, gameweek: number): number => {
    const run = row.positions[slot]?.perGw ?? [];
    const at = window.indexOf(gameweek);
    if (at !== -1) return run[at] ?? 0;
    const read = run.filter((points): points is number => points !== null);
    return read.length === 0 ? 0 : read.reduce((sum, points) => sum + points, 0) / read.length;
  };
  const slots = row.eligible.filter((slot) => row.positions[slot] !== undefined);
  const byPeriod = new Map(
    [...periods].map(([period, gameweeks]) => [period, Object.fromEntries(slots.map((slot) => [slot, gameweeks.reduce((sum, gw) => sum + perGameweek(slot, gw), 0)]))]),
  );
  const season = Math.max(0, ...slots.map((slot) => [...byPeriod.values()].reduce((sum, period) => sum + (period[slot] ?? 0), 0)));
  return { fantraxId: row.fantraxId, code: row.fplCode, name: row.name, periods: byPeriod, spread: spreadOf(band, z), season };
}

/** The band's upper half over its mean, averaged across the weeks it reads: the lower half is floored at nought. */
function spreadOf(band: ProjectedPlayer | undefined, z: number): number {
  const shares = (band?.gameweeks ?? []).flatMap((week) =>
    week.points !== null && week.high !== null && week.points > 0 ? [(week.high - week.points) / week.points / z] : [],
  );
  return shares.length === 0 ? 0 : shares.reduce((sum, share) => sum + share, 0) / shares.length;
}
