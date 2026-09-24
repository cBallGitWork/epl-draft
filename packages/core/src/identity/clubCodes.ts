// Fantrax and FPL agree on eighteen of the twenty club codes and disagree on two.
// Verified against both providers' live responses on 5 Aug 2026.
//
// Small enough to look trivial, important enough to be its own file: without it,
// every Brentford and Nott'm Forest player lands in the wrong candidate pool and
// either fails to match or matches someone else's squad.

const FANTRAX_TO_FPL: Record<string, string> = {
  BRF: "BRE", // Brentford
  NOT: "NFO", // Nott'm Forest
};

/** Fantrax's club code as FPL spells it. Unknown codes pass through unchanged —
 *  a code we have not seen is more likely a new promoted side than a mistake,
 *  and the matcher treats a miss as unmapped rather than guessing anyway. */
export function toFplClubCode(fantraxCode: string): string {
  return FANTRAX_TO_FPL[fantraxCode] ?? fantraxCode;
}

const FPL_TO_FANTRAX = Object.fromEntries(Object.entries(FANTRAX_TO_FPL).map(([fantrax, fpl]) => [fpl, fantrax]));

/** The same respelling the other way, for a link from a football screen into the Fantrax-keyed board. */
export function toFantraxClubCode(fplCode: string): string {
  return FPL_TO_FANTRAX[fplCode] ?? fplCode;
}
