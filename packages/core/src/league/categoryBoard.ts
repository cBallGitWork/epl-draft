import type { CategoryLine } from "./fantrax/seasonStats";
import type { Measure, StatCategory } from "./categories";

// Ranking a league by one category.
//
// The board is CM's "Average Rating" screen (Craig, 1 Sep 2026): one category,
// every team in order, the figure at the end. What CM never had to decide is
// what a fantasy board ranks BY — the raw figure, or what the figure was worth —
// and that is the second of the two grey boxes.

/** One line of the board, ready to print. */
export interface BoardRow {
  /** Fantrax's own order is meaningless here; this is the rank in THIS
   *  category, and it is computed rather than read. */
  rank: number;
  teamId: string;
  points: number | null;
  value: number | null;
}

/** Every team ranked by one category, best first.
 *
 *  **Absence sorts last, and never as nought.** A team with no reading in a
 *  category has not recorded none of it — the difference matters most in a
 *  `lowIsGood` category, where treating absence as zero would crown the side we
 *  know least about.
 *
 *  **Ties share a rank**, as a league table does: two sides on four clean sheets
 *  are both second, and the next is fourth. Ranking them 2 and 3 by whatever
 *  order the payload arrived in would invent a distinction Fantrax never made. */
export function rankBy(
  lines: readonly CategoryLine[],
  category: StatCategory,
  measure: Measure,
): BoardRow[] {
  const of = (line: CategoryLine): number | null =>
    measure === "points" ? line.points : line.value;

  // Fantasy points always rank high-to-low. `lowIsGood` describes the FIGURE —
  // conceding fewer goals is better — but the points Fantrax pays for that
  // figure are already signed, so a side that conceded least has the most
  // points. Applying the flag to both would rank the best team last.
  const ascending = measure === "value" && category.lowIsGood === true;

  const sorted = [...lines].sort((a, b) => {
    const left = of(a);
    const right = of(b);
    if (left === null && right === null) return 0;
    if (left === null) return 1;
    if (right === null) return -1;
    return ascending ? left - right : right - left;
  });

  const board: BoardRow[] = [];
  let rank = 0;
  let previous: number | null | undefined;

  for (const [at, line] of sorted.entries()) {
    const figure = of(line);
    // A new rank only when the figure moves; otherwise this line shares the
    // rank above it. `at + 1` and not `rank + 1` is what makes the rank after a
    // tie skip, which is how a league table counts.
    if (previous === undefined || figure !== previous) rank = at + 1;
    previous = figure;
    board.push({ rank, teamId: line.teamId, points: line.points, value: line.value });
  }

  return board;
}
