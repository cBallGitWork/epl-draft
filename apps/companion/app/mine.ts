// Marking the reader's own team on a list of sixteen.
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
