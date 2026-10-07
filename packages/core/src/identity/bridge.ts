import type { NameAgreement } from "./similarity";

// The persisted Fantrax→FPL mapping, and re-running its build without undoing what a person decided.
// Only FPL's season-stable `code` is written: `id` is per-season, recycled every summer, and never persisted.

/** A Fantrax player we are confident is a particular FPL player. */
export interface MappedEntry {
  /** FPL's season-stable player code. */
  fplCode: number;
  /** Which rung of the ladder produced this, so an audit sees whether a row was certain or merely plausible. */
  matchedBy: "exact" | "alias" | "fuzzy" | "manual";
  /** 100 for exact and alias matches; the token-set score for fuzzy ones. */
  confidence: number;
  /** Fuzzy rows only: whether the two names merely differ in length or contradict; containment scores 100 either way. */
  agreement?: NameAgreement;
  /** Set when a person confirmed it; the script never revises an audited entry. */
  auditedAt?: string;
}

/** A Fantrax player with no FPL counterpart: final when a person says so, re-derived every run when the script
 *  assumed it, since FPL adds players all window. */
export interface UnmappedEntry {
  status: "unmapped";
  /** Which rung produced this, as `matchedBy` does; "manual" is a person's word, and no score threshold may write it. */
  unmappedBy: "no-fpl-match" | "manual";
  /** The best token-set score in the club's pool; absent when the pool was empty, which is not zero. At most
   *  `ABSENCE_MAX_SCORE` on a row the script wrote, so a rising one says somebody close has arrived. */
  bestScore?: number;
  /** Free prose, and only ever a person's. */
  note?: string;
  /** Set when a person confirmed it, separately from `unmappedBy`: confirming the script's conclusion makes it final. */
  auditedAt?: string;
}

export type BridgeEntry = MappedEntry | UnmappedEntry;

/** fantraxId → what we know about them. */
export type Bridge = Record<string, BridgeEntry>;

export function isUnmapped(entry: BridgeEntry): entry is UnmappedEntry {
  return "status" in entry && entry.status === "unmapped";
}

/** A Fantrax player's FPL code, or null for a man FPL has no row for or the bridge has not seen. */
export function fplCodeOf(bridge: Bridge, fantraxId: string): number | null {
  const entry: BridgeEntry | undefined = bridge[fantraxId];
  return entry === undefined || isUnmapped(entry) ? null : entry.fplCode;
}

/** A row the script wrote from its own evidence and may revise: the only revisable state in the file. */
export function isAssumed(entry: BridgeEntry): boolean {
  return isUnmapped(entry) && entry.unmappedBy === "no-fpl-match" && entry.auditedAt === undefined;
}

/** Fold what a run settled into the bridge: a match or a person's decision is never revised, and an assumption
 *  survives only by being made again, so `settled` must be a whole run's output, never a slice. */
export function mergeBridge(existing: Bridge, settled: Record<string, BridgeEntry>): Bridge {
  const merged: Bridge = {};

  for (const [fantraxId, entry] of Object.entries(existing)) {
    if (!isAssumed(entry)) merged[fantraxId] = entry;
  }
  for (const [fantraxId, entry] of Object.entries(settled)) {
    if (!(fantraxId in merged)) merged[fantraxId] = entry;
  }

  return merged;
}

/** The fantraxIds this run must leave alone: everything but an assumption, which goes back through the matcher. */
export function settledIds(bridge: Bridge): Set<string> {
  const settled = new Set<string>();
  for (const [fantraxId, entry] of Object.entries(bridge)) {
    if (!isAssumed(entry)) settled.add(fantraxId);
  }
  return settled;
}

/** FPL codes already spoken for, so a re-run never hands a settled man's code to a second claimant. */
export function claimedCodes(bridge: Bridge): Set<number> {
  const claimed = new Set<number>();
  for (const entry of Object.values(bridge)) {
    if (!isUnmapped(entry)) claimed.add(entry.fplCode);
  }
  return claimed;
}
