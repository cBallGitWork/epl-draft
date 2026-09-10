// Fantrax's own status vocabulary, in the manager's words.
//
// A file of its own as of 10 Sep 2026, and the reason is a CYCLE rather than
// tidiness: `PlayerTable` exported it, `BoardBar` needed it for the chip
// labels, and `Cell` needed it for the owner column — so splitting the cell out
// of the table would have had `Cell` importing from the file that imports
// `Cell`. It is a label map and not a component, which is why it had no
// business living in one.

/** Fantrax's status codes in the manager's words. Theirs is the vocabulary, so
 *  anything we have not seen shows as the raw code rather than as a guess — an
 *  undrafted league marks all 697 "WW", and a fourth letter would appear here
 *  before it appeared in this file. */
export const STATUS: Record<string, string> = {
  FA: "Free agent",
  WW: "Waivers",
  T: "Rostered",
};
