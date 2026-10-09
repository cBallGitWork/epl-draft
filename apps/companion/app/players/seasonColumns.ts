import { DASH, stat, type StatKey, type StatsRow } from "@epl/core";
import type { PoolColumn } from "./columns";

// The stats league's season counts as board columns (Craig, 9 Oct 2026: "shots, chances created … big chances …
// crosses"). The served league carries none, so they ride in the stats bag under their own keys, never as a `stat`.

interface SeasonStat {
  /** The address bar's key. */
  key: string;
  from: StatKey;
  label: string;
  title: string;
  mark?: PoolColumn["mark"];
}

/** The seven, headed in the house's words; one list for the board and a player's Data page. */
export const SEASON_STATS: readonly SeasonStat[] = [
  { key: "sh", from: "shots", label: "Sh", title: "Shots" },
  { key: "sot", from: "shotsOnTarget", label: "SoT", title: "Shots on target" },
  { key: "kp", from: "keyPasses", label: "KP", title: "Chances created" },
  { key: "bcc", from: "bigChancesCreated", label: "BCC", title: "Big chances created" },
  { key: "bcm", from: "bigChancesMissed", label: "BCM", title: "Big chances missed", mark: "low" },
  { key: "cr", from: "crosses", label: "Crs", title: "Crosses" },
  { key: "ac", from: "accurateCrosses", label: "AC", title: "Accurate crosses" },
];

const bagKey = (key: StatKey) => `season ${key}`;

/** The file's own minutes, so a rate never divides its counts by a served read a match ahead of it. */
const SEASON_MINUTES = bagKey("minutes");

export const SEASON_COLUMNS: PoolColumn[] = SEASON_STATS.map((entry) => ({
  key: entry.key,
  label: entry.label,
  title: entry.title,
  kind: "number",
  group: "attacking",
  mark: entry.mark ?? "high",
  rate: true,
  minutes: SEASON_MINUTES,
  ascending: false,
  value: (_row, stats) => stats?.[bagKey(entry.from)] ?? null,
}));

/** His season as his Data page prints it, in the board's order: a dash for any figure the file does not hold. */
export function seasonLine(row: StatsRow | undefined): (SeasonStat & { figure: string })[] {
  return SEASON_STATS.map((entry) => ({ ...entry, figure: String(stat(row, entry.from) ?? DASH) }));
}

/** His season keyed for the stats bag; nothing for a man the file does not hold, so every cell dashes. */
export function seasonStats(row: StatsRow | undefined): Record<string, number | null> {
  if (row === undefined) return {};
  const keys: StatKey[] = [...SEASON_STATS.map((entry) => entry.from), "minutes"];
  return Object.fromEntries(keys.map((key) => [bagKey(key), stat(row, key)]));
}
