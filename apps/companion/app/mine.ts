// Marking the reader's own team on a list of sixteen, and putting it first.
//
// One treatment everywhere, because it is a reading aid rather than decoration:
// a manager scanning the standings, the fixtures, the doubts and the front page
// is looking for the same thing on each, and it has to look the same or it stops
// being a shortcut. Five screens had hand-copied the class string, and one of
// them had the tokens in a different order — harmless today, and exactly how a
// treatment starts drifting.

const YOURS = "border-line border-l-4 border-l-accent";
const THEIRS = "border-line";

/** The border classes for a row, given whether it is the reader's. */
export function yoursBorder(yours: boolean): string {
  return yours ? YOURS : THEIRS;
}

/** The same list, with the reader's own at the top.
 *
 *  The other half of the same reading aid, and it had reached three copies: the
 *  paper's doubts column, the matchups board and the schedule's team picker each
 *  sorted `Number(b === mine) - Number(a === mine)` for themselves. They sort
 *  different shapes — a note, a pairing, a team — so what they share is the
 *  question, which is why that is the argument.
 *
 *  Stable within each half, so a caller's own ordering survives underneath: the
 *  team picker stays alphabetical, the board stays in Fantrax's order. A reader
 *  who is not signed in owns nothing and gets the list untouched. */
export function yoursFirst<T>(items: readonly T[], isYours: (item: T) => boolean): T[] {
  return [...items].sort((a, b) => Number(isYours(b)) - Number(isYours(a)));
}
