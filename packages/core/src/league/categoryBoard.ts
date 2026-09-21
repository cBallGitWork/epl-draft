import type { CategoryLine } from "./fantrax/seasonStats";
import type { Measure, StatCategory } from "./categories";

// A group of categories, every team, one figure per cell.
//
// It was CM's "Average Rating" screen for ten days (Craig, 1 Sep 2026): one
// category, every team in order, and BOTH numbers at the end of each row. It is
// `cm9900/21.jpg` now — the whole group across the top — on Craig's 11 Sep
// reading: "for each section, we can get all the columns in one go, but at the
// top, allow a toggle between fantasy points and actual raw values."
//
// **The measure moved from the row to the top of the board, and that is what
// made room for the columns.** Two numbers per category is readable at one
// category and eight cells of alternating meaning at four; a reader compares a
// column against the column beside it, and a column that is half points and half
// goals is not one. So a cell holds one measure, the board says which once, and
// the group fits.

/** One line of the board, ready to print. */
export interface BoardRow {
  /** Fantrax's own order is meaningless here; this is the rank in the category
   *  the board is ORDERED by, and it is computed rather than read. */
  rank: number;
  teamId: string;
  /** One figure per category, positionally matching the categories handed in.
   *  Null where this team has no line in that category — absence, never a
   *  nought. */
  figures: (number | null)[];
}

/** Every team across one group of categories, ordered by one of them, best
 *  first.
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
  categories: readonly StatCategory[],
  lines: ReadonlyMap<string, readonly CategoryLine[]>,
  by: StatCategory,
  measure: Measure,
): BoardRow[] {
  const of = (line: CategoryLine): number | null =>
    measure === "points" ? line.points : line.value;

  const read = (category: StatCategory): Map<string, number | null> =>
    new Map((lines.get(category.key) ?? []).map((line) => [line.teamId, of(line)]));

  // One column per category, in the order they will be drawn.
  const columns = categories.map(read);
  // The ordering column is read again rather than found among those by index:
  // an index needs a fallback for a category outside the group, and a silent
  // nought there would order the board by a column nobody picked.
  const ordering = read(by);

  // Fantasy points always rank high-to-low. `lowIsGood` describes the FIGURE —
  // conceding fewer goals is better — but the points Fantrax pays for that
  // figure are already signed, so a side that conceded least has the most
  // points. Applying the flag to both would rank the best team last.
  const ascending = measure === "value" && by.lowIsGood === true;

  const teams = [...new Set(columns.flatMap((column) => [...column.keys()]))];

  const sorted = teams.sort((a, b) => {
    const left = ordering.get(a) ?? null;
    const right = ordering.get(b) ?? null;
    if (left === null && right === null) return 0;
    if (left === null) return 1;
    if (right === null) return -1;
    return ascending ? left - right : right - left;
  });

  const board: BoardRow[] = [];
  let rank = 0;
  let previous: number | null | undefined;

  for (const [at, teamId] of sorted.entries()) {
    const figure = ordering.get(teamId) ?? null;
    // A new rank only when the figure moves; otherwise this line shares the
    // rank above it. `at + 1` and not `rank + 1` is what makes the rank after a
    // tie skip, which is how a league table counts.
    if (previous === undefined || figure !== previous) rank = at + 1;
    previous = figure;
    board.push({ rank, teamId, figures: columns.map((column) => column.get(teamId) ?? null) });
  }

  return board;
}
