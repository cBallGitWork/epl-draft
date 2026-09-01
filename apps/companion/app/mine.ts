// Marking the reader's own team on a list of ten, and putting it first.
//
// One treatment everywhere, because it is a reading aid rather than decoration:
// a manager scanning the standings, the fixtures, the doubts and the front page
// is looking for the same thing on each, and it has to look the same or it stops
// being a shortcut. Five screens had hand-copied the class string, and one of
// them had the tokens in a different order — harmless today, and exactly how a
// treatment starts drifting.

/** The accent edge itself, which is the whole of the mark. */
const EDGE = "border-l-4 border-l-accent";

const YOURS = `border-line ${EDGE}`;
const THEIRS = "border-line";

/** The border classes for a CARD row, given whether it is the reader's. */
export function yoursBorder(yours: boolean): string {
  return yours ? YOURS : THEIRS;
}

/** The same mark on a TABLE row, where the horizontal rules belong to the table
 *  and only the edge is the row's own.
 *
 *  Transparent rather than absent on a row that is not yours: a table draws its
 *  cells against each other, so an edge that appears only on one row would step
 *  that row's figures 4px out of the column. A card has its own box and does not
 *  have that problem, which is why `yoursBorder` leaves the other side bare. */
export function yoursEdge(yours: boolean): string {
  return yours ? EDGE : "border-l-4 border-l-transparent";
}

/** The same mark in INK, for the team's own name.
 *
 *  The edge marks the row; this marks the word, and the two are one treatment —
 *  which is why they live together. Seven screens had hand-copied the pair of
 *  tokens after `yoursBorder`/`yoursEdge` had already ended the copying for the
 *  border half.
 *
 *  Yellow rather than cyan for yours, and the reason is a slot rule rather than
 *  a preference: cyan is "a person" in this palette, and a fantasy team is named
 *  after one without being one. */
export function yoursInk(yours: boolean): string {
  return yours ? "text-accent" : "text-ink";
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
