// The order Fantrax brings a team's reserves on at the end of a period, from its roster page (probed 29 Sep 2026):
// `autoSubOrderMap` when the manager has numbered his bench, else the order the page lists the reserves in.

export interface RawTeamRosterInfo {
  miscData?: {
    /** "USER" in the rehearsal league: each manager numbers his own bench. */
    autoSubsOrderingType?: string;
    /** Reserve to his number. Empty on every team probed, so its shape is read defensively. */
    autoSubOrderMap?: Record<string, number | string | undefined>;
  };
  tables?: { rows?: RawRosterRow[] }[];
}

export interface RawRosterRow {
  /** "1" in the eleven, "2" on the bench. A row with no scorer is an empty slot. */
  statusId?: string;
  scorer?: { scorerId?: string; posShortNames?: string };
}

export interface BenchOrder {
  /** Reserves by fantraxId, first to come on first. */
  order: string[];
  /** Whether the manager set the order, or it is the page's listing. */
  numbered: boolean;
}

export function mapBenchOrder(raw: RawTeamRosterInfo): BenchOrder {
  const listed = (raw.tables ?? []).flatMap((t) => t.rows ?? []).filter((r) => r.statusId === "2" && typeof r.scorer?.scorerId === "string").map((r) => r.scorer!.scorerId!);
  const numbers = Object.entries(raw.miscData?.autoSubOrderMap ?? {})
    .map(([id, n]) => ({ id, n: Number(n) }))
    .filter((x) => Number.isFinite(x.n) && listed.includes(x.id));
  if (numbers.length === 0) return { order: listed, numbered: false };
  const numbered = numbers.sort((a, b) => a.n - b.n).map((x) => x.id);
  return { order: [...numbered, ...listed.filter((id) => !numbered.includes(id))], numbered: true };
}
