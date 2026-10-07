import { MS_PER_DAY, instantOf } from "../../time";
import type { IntelManifest } from "./types";

// How old each intel file may grow before `intel-check` calls it stale. Pure: the clock is `now`.

/** Days each kind may age, keyed by its directory under `data/intel/`; null where age says nothing. */
export const INTEL_AGE_LIMIT_DAYS = {
  // Re-exported after every gameweek, which ends Sunday or Monday: a week and a day.
  squads: 8,
  "set-pieces": 8,
  matches: 8,
  touches: 8,
  shots: 8,
  strength: 8,
  projections: 8,
  depth: 8,
  lines: 8,
  cups: 8,
  // Rewritten only when what they hold changes, so they outlast a two-week international break.
  xi: 14,
  stats: 14,
  pressers: 14,
  // Written by the weekly run, which stamps every kind it exports whether or not it changed.
  careers: 8,
  "league-projections": 8,
} as const satisfies Record<string, number | null>;

export type IntelKind = keyof typeof INTEL_AGE_LIMIT_DAYS;

export interface IntelFreshness {
  /** Whole days since the export ran; null when it does not say. */
  ageDays: number | null;
  limitDays: number | null;
  stale: boolean;
}

/** Whether a file is past its kind's limit. A finished season's file has none; an unreadable `exportedAt` is stale. */
export function intelFreshness(
  kind: IntelKind,
  manifest: { season: IntelManifest["season"]; exportedAt?: string | null },
  season: string,
  now: Date,
): IntelFreshness {
  const limitDays = manifest.season === season ? INTEL_AGE_LIMIT_DAYS[kind] : null;
  const at = manifest.exportedAt ? instantOf(manifest.exportedAt) : null;
  if (at === null) return { ageDays: null, limitDays, stale: limitDays !== null };
  const age = (now.getTime() - at) / MS_PER_DAY;
  return { ageDays: Math.floor(age), limitDays, stale: limitDays !== null && age > limitDays };
}
