// Fantrax's own status vocabulary, in the manager's words: the board's chips and every holder's title.

/** Fantrax's status codes in the manager's words; a code not here prints as itself, never a guess. */
export const STATUS: Record<string, string> = {
  FA: "Free agent",
  WW: "Waivers",
  T: "Rostered",
};

/** A status as its chip on the board's row says it: the code the rows print in brackets, and Craig's word for the
 *  one they never print. Anything else is its raw code. */
export const STATUS_CHIP: Record<string, string> = {
  FA: "FA",
  WW: "WW",
  T: "Owned",
};
