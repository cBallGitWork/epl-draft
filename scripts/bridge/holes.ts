import { type Bridge, isAssumed, isUnmapped } from "@epl/core";

// Why a rostered man resolves to no footballer: the ladder `join/roster.ts` climbs for a squad view, against FPL's codes.

/** A hole in a squad view: the bridge never saw him, the matcher guessed nobody, or FPL no longer lists his code. */
export type HoleReason = "unbridged" | "assumed-unmapped" | "absent";

/** Why `fantraxId` is a hole; "audited" for a person's verdict that he has no footballer, which stands; null when he
 *  resolves. `fplCodes` is every code in FPL's bootstrap. */
export function holeIn(fantraxId: string, bridge: Bridge, fplCodes: ReadonlySet<number>): HoleReason | "audited" | null {
  const entry: Bridge[string] | undefined = bridge[fantraxId];
  if (entry === undefined) return "unbridged";
  if (isUnmapped(entry)) return isAssumed(entry) ? "assumed-unmapped" : "audited";
  return fplCodes.has(entry.fplCode) ? null : "absent";
}
