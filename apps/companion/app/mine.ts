// Marking the reader's own team on a list, and putting it first: one treatment on every screen.

/** The accent edge itself, which is the whole of the mark. */
const EDGE = "border-l-4 border-l-accent";

const YOURS = `border-line ${EDGE}`;
const THEIRS = "border-line";

/** The border classes for a CARD row, given whether it is the reader's. */
export function yoursBorder(yours: boolean): string {
  return yours ? YOURS : THEIRS;
}

/** The same mark on a TABLE row; transparent on the others, so no row steps 4px out of the column. */
export function yoursEdge(yours: boolean): string {
  return yours ? EDGE : "border-l-4 border-l-transparent";
}

/** The edge alone on a colour plate, where the accent cannot be ink; nothing on the others. */
export function yoursMark(yours: boolean): string {
  return yours ? EDGE : "";
}

/** The same mark in ink, for the team's own name: the accent, which means yours. */
export function yoursInk(yours: boolean): string {
  return yours ? "text-accent" : "text-ink";
}

/** The same list with the reader's own at the top; stable, so the caller's order survives beneath it. */
export function yoursFirst<T>(items: readonly T[], isYours: (item: T) => boolean): T[] {
  return [...items].sort((a, b) => Number(isYours(b)) - Number(isYours(a)));
}
