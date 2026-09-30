import type { IntelManifest } from "./types";

// Each man's league season in totals, off the sister repo's player log: the sample the attribute
// grid rates. Untrusted like every export: a count that is not a number is null, a row with no
// code is dropped, and running is null for a season that had none.

/** A line's counts, as the export names them. */
export const LINE_COUNTS = [
  "xgot",
  "fouls",
  "recoveries",
  "chancesCreated",
  "crosses",
  "dribbles",
  "aerialsWon",
  "clearances",
  "blocks",
  "interceptions",
  "tackles",
  "boxTouches",
  "touches",
  "finalThirdPasses",
  "passes",
  "passesAttempted",
  "xgBuildup",
  "bps",
  "influence",
  "saves",
  "goalsPrevented",
  "xgc",
  "conceded",
  "outsideBox",
] as const;

export type LineCount = (typeof LINE_COUNTS)[number];

/** His running, over the minutes of the matches that carried it. */
export interface Running {
  minutes: number;
  km: number;
  sprints: number;
  topSpeed: number;
}

export type PlayerLine = {
  code: number;
  minutes: number;
  starts: number;
  /** Minutes of the matches FPL's columns cover; bps, influence, saves, xgc and conceded are per these. */
  fplMinutes: number;
  /** His match ratings in his starts. */
  ratings: number[];
  running: Running | null;
} & Record<LineCount, number | null>;

export interface IntelLines {
  manifest: IntelManifest;
  players: unknown[];
}

/** A man counts as playing a season once he has a third of the most minutes anyone played in it. */
const PLAYED_SHARE = 1 / 3;

const count = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);

/** Each man's line by FPL's season-stable code. */
export function lineIntel(file: IntelLines | null): Map<number, PlayerLine> {
  const byCode = new Map<number, PlayerLine>();
  for (const raw of file?.players ?? []) {
    const row = (raw ?? {}) as Record<string, unknown>;
    const code = count(row.code);
    const minutes = count(row.minutes);
    if (code === null || !Number.isInteger(code) || minutes === null) continue;
    const counts = Object.fromEntries(LINE_COUNTS.map((key) => [key, count(row[key])])) as Record<LineCount, number | null>;
    byCode.set(code, {
      code,
      minutes,
      starts: count(row.starts) ?? 0,
      fplMinutes: count(row.fplMinutes) ?? 0,
      ratings: Array.isArray(row.ratings) ? row.ratings.filter((r): r is number => count(r) !== null) : [],
      running: running(row.running),
      ...counts,
    });
  }
  return byCode;
}

function running(raw: unknown): Running | null {
  const row = (raw ?? {}) as Record<string, unknown>;
  const [minutes, km, sprints, topSpeed] = [row.minutes, row.km, row.sprints, row.topSpeed].map(count);
  return minutes === null || km === null || sprints === null || topSpeed === null ? null : { minutes, km, sprints, topSpeed };
}

/** The minutes a man needs in this season's lines to count as playing it. */
export function playedFloor(lines: Iterable<PlayerLine>): number {
  let most = 0;
  for (const line of lines) most = Math.max(most, line.minutes);
  return most * PLAYED_SHARE;
}
