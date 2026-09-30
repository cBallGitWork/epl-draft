import { STAT_COLUMNS, isUnmapped, type Bridge, type IntelStats, type StatKey, type StatSheet } from "@epl/core";
import { FANTRAX_STAT, IGNORED } from "./columns";

// The stats league's two sheets as one file in football terms: each man keyed on his FPL code
// through the bridge, only the men who have played, columns in the vocabulary's order. Pure.

export interface Built {
  stats: Omit<IntelStats, "manifest">;
  /** Fantrax stat ids neither mapped nor ignored: a category the league has gained. */
  unknown: string[];
  /** Our keys no sheet carried: a category it has lost. */
  missing: StatKey[];
}

export function buildStats(sheets: readonly StatSheet[], bridge: Bridge): Built {
  const unknown = new Set<string>();
  const carried = new Set<StatKey>();
  const byCode = new Map<number, Map<StatKey, number | null>>();
  let unbridged = 0;
  let unbridgedWithMinutes = 0;

  for (const sheet of sheets) {
    const keys = sheet.columns.map((column) => FANTRAX_STAT[column.stat] ?? null);
    for (const [at, column] of sheet.columns.entries()) {
      const key = keys[at];
      if (key !== null) carried.add(key);
      else if (!IGNORED.has(column.stat)) unknown.add(column.stat);
    }

    for (const line of sheet.lines) {
      const figures = new Map<StatKey, number | null>();
      keys.forEach((key, at) => {
        if (key !== null) figures.set(key, line.values[at] ?? null);
      });
      const played = (figures.get("minutes") ?? 0) > 0;
      const entry = bridge[line.fantraxId];
      if (entry === undefined || isUnmapped(entry)) {
        unbridged += 1;
        if (played) unbridgedWithMinutes += 1;
        continue;
      }
      if (played) byCode.set(entry.fplCode, new Map([...(byCode.get(entry.fplCode) ?? []), ...figures]));
    }
  }

  const columns = STAT_COLUMNS.map((column) => column.key).filter((key) => carried.has(key));
  const players = [...byCode.entries()]
    .sort(([a], [b]) => a - b)
    .map(([code, figures]) => ({ code, values: columns.map((key) => figures.get(key) ?? null) }));

  return {
    stats: { season: sheets[0]?.season.name ?? "", columns, players, unbridged, unbridgedWithMinutes },
    unknown: [...unknown],
    missing: STAT_COLUMNS.map((column) => column.key).filter((key) => !carried.has(key)),
  };
}
