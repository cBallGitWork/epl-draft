// Fantrax and FPL disagree on two club codes; without this, Brentford and Forest players land in the wrong pool.

const FANTRAX_TO_FPL: Record<string, string> = {
  BRF: "BRE", // Brentford
  NOT: "NFO", // Nott'm Forest
};

/** Fantrax's club code as FPL spells it; an unknown code, likely a promoted side, passes through unchanged. */
export function toFplClubCode(fantraxCode: string): string {
  return FANTRAX_TO_FPL[fantraxCode] ?? fantraxCode;
}

const FPL_TO_FANTRAX = Object.fromEntries(Object.entries(FANTRAX_TO_FPL).map(([fantrax, fpl]) => [fpl, fantrax]));

/** The same respelling the other way, for a link from a football screen into the Fantrax-keyed board. */
export function toFantraxClubCode(fplCode: string): string {
  return FPL_TO_FANTRAX[fplCode] ?? fplCode;
}
