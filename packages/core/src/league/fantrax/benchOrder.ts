import { keyed } from "./stats";

// The reserves Fantrax may bring on at the end of a period, in order, off the roster page: the manager's own numbers in
// `autoSubOrderMap` when he set them, else the deadline's order, by total fantasy points, highest first.

export interface RawTeamRosterInfo {
  miscData?: {
    /** "USER" in the rehearsal league: each manager numbers his own bench. */
    autoSubsOrderingType?: string;
    /** Reserve to his number. Empty on every team probed, so its shape is read defensively. */
    autoSubOrderMap?: Record<string, number | string | undefined>;
  };
  tables?: { header?: { cells?: { key?: string }[] }; rows?: RawRosterRow[] }[];
}

export interface RawRosterRow {
  /** "1" in the eleven, "2" on the bench. A row with no scorer is an empty slot. */
  statusId?: string;
  scorer?: { scorerId?: string; posShortNames?: string };
  cells?: { content?: string }[];
}

export interface BenchOrder {
  /** Reserves by fantraxId, first to come on first. */
  order: string[];
  /** The manager's own numbers, or the deadline's order by total fantasy points. */
  by: "manager" | "points";
}

export function mapBenchOrder(raw: RawTeamRosterInfo): BenchOrder {
  const reserves = reservesOf(raw);
  const numbers = Object.entries(raw.miscData?.autoSubOrderMap ?? {})
    .map(([id, n]) => ({ id, n: Number(n) }))
    .filter((x) => x.n > 0 && reserves.some((r) => r.id === x.id));
  if (numbers.length > 0) return { order: numbers.sort((a, b) => a.n - b.n).map((x) => x.id), by: "manager" };
  return { order: byPoints(reserves), by: "points" };
}

/** The deadline's order for this bench, whatever the manager numbered: total fantasy points, highest first. */
export function benchByPoints(raw: RawTeamRosterInfo): string[] {
  return byPoints(reservesOf(raw));
}

/** A man with no points reading goes after every man with one, a negative total included; ties keep the page's order. */
const byPoints = (reserves: readonly { id: string; fpts: number | null }[]): string[] =>
  [...reserves].sort((a, b) => (b.fpts ?? -Infinity) - (a.fpts ?? -Infinity) || 0).map((r) => r.id);

function reservesOf(raw: RawTeamRosterInfo): { id: string; fpts: number | null }[] {
  return (raw.tables ?? []).flatMap((table) => {
    const at = keyed(table.header?.cells ?? [], "fpts");
    return (table.rows ?? []).flatMap((r) => {
      const id = r.scorer?.scorerId;
      if (r.statusId !== "2" || typeof id !== "string") return [];
      const text = at < 0 ? "" : (r.cells?.[at]?.content ?? "").trim();
      const fpts = text === "" ? NaN : Number(text);
      return [{ id, fpts: Number.isFinite(fpts) ? fpts : null }];
    });
  });
}
