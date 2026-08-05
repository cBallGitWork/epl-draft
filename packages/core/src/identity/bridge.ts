// The persisted Fantrax→FPL mapping and the rules for re-running the build
// without destroying what a human decided.
//
// Only FPL's `code` is ever written here. `id` is FPL's per-season element id and
// is recycled every summer — persisting it would quietly reassign a player's
// history to whoever inherits the number (CODE_RULES §3). The schema below has
// no field it could go in.

/** A Fantrax player we are confident is a particular FPL player. */
export interface MappedEntry {
  /** FPL's season-stable player code. */
  fplCode: number;
  /** Which rung of the ladder produced this. Kept so an audit can see whether a
   *  row was certain or merely plausible. */
  matchedBy: "exact" | "alias" | "fuzzy" | "manual";
  /** 100 for exact and alias matches; the token-set score for fuzzy ones. */
  confidence: number;
  /** Set when a human confirmed it. Audited entries are never revised by the
   *  script — a person looked, and the script did not. */
  auditedAt?: string;
}

/** A Fantrax player who has no FPL counterpart and is not expected to get one.
 *
 *  This is a correct, permanent state rather than a failure: Fantrax carries
 *  academy and fringe players FPL has never listed. Recording it explicitly is
 *  what stops them being re-proposed every single run. */
export interface UnmappedEntry {
  status: "unmapped";
  reason: string;
  auditedAt: string;
}

export type BridgeEntry = MappedEntry | UnmappedEntry;

/** fantraxId → what we know about them. */
export type Bridge = Record<string, BridgeEntry>;

export function isUnmapped(entry: BridgeEntry): entry is UnmappedEntry {
  return "status" in entry && entry.status === "unmapped";
}

/** Fold a fresh run's matches into the existing bridge.
 *
 *  Existing entries always win. The commissioner can add and remove players at
 *  any time, so this script runs again and again over a mutating pool, and a
 *  re-run that silently revised last month's audited decisions would make the
 *  file untrustworthy exactly where it matters most. New ids are the only thing
 *  a run may add. */
export function mergeBridge(existing: Bridge, matches: Record<string, MappedEntry>): Bridge {
  const merged: Bridge = { ...existing };

  for (const [fantraxId, entry] of Object.entries(matches)) {
    if (fantraxId in merged) continue;
    merged[fantraxId] = entry;
  }

  return merged;
}

/** The fantraxIds this bridge has already settled, either way. The matcher skips
 *  them, so each run only considers players it has never seen. */
export function settledIds(bridge: Bridge): Set<string> {
  return new Set(Object.keys(bridge));
}

/** FPL players already spoken for.
 *
 *  A run only sees the players it is matching, so without this a second run
 *  hands out codes the first run already assigned: Jack Clarke is settled and
 *  skipped, and Harry Clarke — now unopposed — takes his code. One footballer,
 *  two claimants, and every stat downstream attributed to the wrong one. */
export function claimedCodes(bridge: Bridge): Set<number> {
  const claimed = new Set<number>();
  for (const entry of Object.values(bridge)) {
    if (!isUnmapped(entry)) claimed.add(entry.fplCode);
  }
  return claimed;
}
