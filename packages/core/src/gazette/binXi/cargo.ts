// What a Bin XI story carries beside its prose: the eleven and the bench as the desk printed them,
// and its key stats, refused field by field at the edge like every other story's cargo.

/** One man as printed: his name, his FPL code for the face, the slot, his club, his Fantrax points. */
export interface StoryBinMan {
  name: string;
  code: number;
  slot: string;
  /** "COV", for the line under the pitch. */
  club: string;
  points: number;
  minutes: number;
}

/** A desk-made line: a label and its figures, never written by the model. */
export interface StoryBinStat {
  label: string;
  value: string;
}

export interface StoryBin {
  shape: string;
  total: number;
  xi: StoryBinMan[];
  bench: StoryBinMan[];
  keyStats: StoryBinStat[];
}

/** An eleven or nothing: a Bin XI with no side is a column about nobody. */
export function normalizeBin(raw: unknown): StoryBin | undefined {
  const bin = raw as Partial<Record<keyof StoryBin, unknown>> | null;
  if (bin === null || typeof bin !== "object") return undefined;
  const xi = men(bin.xi);
  if (xi.length === 0 || typeof bin.shape !== "string" || typeof bin.total !== "number") return undefined;
  return { shape: bin.shape, total: bin.total, xi, bench: men(bin.bench), keyStats: stats(bin.keyStats) };
}

function men(raw: unknown): StoryBinMan[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((man: Partial<StoryBinMan> | null) =>
    typeof man?.name === "string" && man.name.trim() !== "" && Number.isInteger(man.code) && (man.code as number) > 0 &&
    typeof man.slot === "string" && typeof man.club === "string" && typeof man.points === "number" && typeof man.minutes === "number"
      ? [{ name: man.name, code: man.code as number, slot: man.slot, club: man.club, points: man.points, minutes: man.minutes }]
      : [],
  );
}

function stats(raw: unknown): StoryBinStat[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((stat: Partial<StoryBinStat> | null) =>
    typeof stat?.label === "string" && typeof stat.value === "string" && stat.value !== "" ? [{ label: stat.label, value: stat.value }] : [],
  );
}
