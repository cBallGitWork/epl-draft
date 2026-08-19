import type { NameAgreement } from "./similarity";

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
  /** Fuzzy rows only: whether the two full names merely differ in length or
   *  contradict each other. `confidence` cannot say — containment scores 100
   *  either way — so this is what an audit sorts on. */
  agreement?: NameAgreement;
  /** Set when a human confirmed it. Audited entries are never revised by the
   *  script — a person looked, and the script did not. */
  auditedAt?: string;
}

/** A Fantrax player with no FPL counterpart.
 *
 *  Fantrax's pool carries academy and fringe players FPL has never listed, so
 *  this is a correct answer rather than a failure, and recording it is what stops
 *  them being re-proposed on every run.
 *
 *  It is two different claims and the file has to keep them apart. A person who
 *  looked and found nobody is final. The script finding nobody is a statement
 *  about the FPL list it read that day, and FPL adds players all window — three
 *  of the first residue we recorded were in FPL a week later. So a row the script
 *  assumed is re-derived on every run, and a row a person stands behind never is. */
export interface UnmappedEntry {
  status: "unmapped";
  /** Which rung produced this, exactly as `matchedBy` does for a match. The
   *  script has only one thing it can say; "manual" is a person's word, and no
   *  score threshold may ever write it. */
  unmappedBy: "no-fpl-match" | "manual";
  /** The best token-set score anyone in the club's pool reached, as `confidence`
   *  is for a match. Absent when the pool was empty, which is not the same as
   *  scoring zero. Bounded above by `ABSENCE_MAX_SCORE` on a row the script
   *  wrote — a nearer miss than that is a person's question, not an absence — so
   *  a rising one across runs is the tell that somebody close has arrived. */
  bestScore?: number;
  /** Free prose, and only ever a person's: the script cannot tell an academy
   *  seventeen-year-old from a senior FPL has dropped, and the two have opposite
   *  futures. */
  note?: string;
  /** Set when a human confirmed it, exactly as on `MappedEntry`, and a separate
   *  question from `unmappedBy`. A person may confirm what the script concluded;
   *  doing so is what makes the row final. */
  auditedAt?: string;
}

export type BridgeEntry = MappedEntry | UnmappedEntry;

/** fantraxId → what we know about them. */
export type Bridge = Record<string, BridgeEntry>;

export function isUnmapped(entry: BridgeEntry): entry is UnmappedEntry {
  return "status" in entry && entry.status === "unmapped";
}

/** A row the script wrote from its own evidence and may therefore revise.
 *
 *  The only revisable state in the file. Everything else — every match, and every
 *  unmapped row a person wrote or confirmed — is final. */
export function isAssumed(entry: BridgeEntry): boolean {
  return isUnmapped(entry) && entry.unmappedBy === "no-fpl-match" && entry.auditedAt === undefined;
}

/** Fold what a run settled into the existing bridge.
 *
 *  A decision a person made or confirmed, and a code the script has already
 *  awarded, are never revised: the commissioner mutates the pool constantly so
 *  this script runs again and again, and a re-run that quietly overwrote last
 *  month's audited decision would make the file untrustworthy exactly where it
 *  matters most.
 *
 *  Its own assumptions are the exception, and deliberately so. "Nobody in FPL
 *  looks like him" is only ever true of the list that run read; when FPL lists
 *  him a fortnight later the next run finds him and the row corrects itself
 *  without anyone editing the file.
 *
 *  So an assumption survives only by being made again, and `settled` must be a
 *  whole run's output rather than a slice of one. Dropping the unrepeated ones is
 *  what keeps the file from claiming "no FPL counterpart" about a player this run
 *  has just sent to the review file instead. */
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

/** The fantraxIds this run must leave alone, mapped or unmapped.
 *
 *  Not simply everything in the file: an assumption is recorded, but it is not
 *  settled. Those ids go back through the matcher every run, which is the only
 *  thing that ever promotes an academy player FPL lists in January. They are kept
 *  out of the review file by `assumeUnmapped`, not by being skipped here. */
export function settledIds(bridge: Bridge): Set<string> {
  const settled = new Set<string>();
  for (const [fantraxId, entry] of Object.entries(bridge)) {
    if (!isAssumed(entry)) settled.add(fantraxId);
  }
  return settled;
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
