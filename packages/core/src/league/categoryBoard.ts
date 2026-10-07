import type { CategoryLine } from "./fantrax/seasonStats";
import type { Measure, StatCategory } from "./categories";

// A group of categories, every team, one figure per cell: one measure for the whole board, never two per cell.

/** One line of the board, ready to print. */
export interface BoardRow {
  /** The rank in the category the board is ordered by, computed here. */
  rank: number;
  teamId: string;
  /** One figure per category, in the order handed in; null where this team has no line, never nought. */
  figures: (number | null)[];
}

/** Every team across one group of categories, ordered by one of them, best first.
 *  Absence sorts last, never as nought (which would top a `lowIsGood` category); ties share a rank. */
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
  // Read again, not found by index: `by` may sit outside the group.
  const ordering = read(by);

  // Points always rank high to low: `lowIsGood` is about the figure, and Fantrax's points are already signed.
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
    // A new rank only when the figure moves; `at + 1` makes the rank after a tie skip, as a table counts.
    if (previous === undefined || figure !== previous) rank = at + 1;
    previous = figure;
    board.push({ rank, teamId, figures: columns.map((column) => column.get(teamId) ?? null) });
  }

  return board;
}
