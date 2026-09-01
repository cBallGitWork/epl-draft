import type { PlayerStatLine } from "./fantrax/playerStats";
import type { PlayerCategory } from "./playerCategories";

// Ranking the pool by one raw stat — CM's stat board, on 646 players.

/** One line of the player board. */
export interface PlayerBoardRow {
  rank: number;
  line: PlayerStatLine;
  value: number | null;
}

/** How many rows a board shows.
 *
 *  **Fifty, because it scrolls** (Craig, 1 Sep 2026: "add the grey scrolling
 *  arrow to the right. we can then make it top 50?"). The two are one decision:
 *  twenty was the right cut for a box that showed all of them at once, and a box
 *  with a scrollbar on it can hold more than it shows. CM's own lists are
 *  exactly this — fourteen visible, a scrollbar saying there are more.
 *
 *  Not the whole 646. A leaderboard answers "who leads", and past fifty the
 *  question has stopped being that; the directory below it is where the whole
 *  pool lives, with search and filters that a scroll box cannot offer. */
export const BOARD_ROWS = 50;

/** The pool ranked by one category, best first.
 *
 *  **Absence sorts last and is never nought.** A player the read carried no
 *  figure for has not scored none of them, and in a `lowIsGood` category
 *  treating him as zero would crown the man we know least about. That matters
 *  more here than on the team board: a keeper has no `GAO` at all, so a third
 *  of the pool is legitimately absent from half the categories.
 *
 *  **Ties share a rank and the next one skips**, as a league table counts —
 *  and on raw counts ties are the normal case rather than the edge. Twenty
 *  players on one goal are all equal, and inventing an order between them from
 *  whatever the payload happened to say would be a ranking we made up. */
export function rankPlayers(
  lines: readonly PlayerStatLine[],
  category: PlayerCategory,
  limit: number = BOARD_ROWS,
): PlayerBoardRow[] {
  // `also` second and never summed: a player is in exactly one half of the
  // pool, so at most one of the two spellings is on his row. `??` rather than
  // `+` is the difference between reading one fact under two names and
  // double-counting it.
  const of = (line: PlayerStatLine): number | null =>
    line.stats[category.key] ?? (category.also ? line.stats[category.also] ?? null : null);

  const scored = lines.filter((line) => of(line) !== null);
  const sorted = [...scored].sort((a, b) => {
    const left = of(a) ?? 0;
    const right = of(b) ?? 0;
    return category.lowIsGood === true ? left - right : right - left;
  });

  const board: PlayerBoardRow[] = [];
  let rank = 0;
  let previous: number | null | undefined;

  for (const [at, line] of sorted.entries()) {
    const value = of(line);
    if (previous === undefined || value !== previous) rank = at + 1;
    previous = value;
    board.push({ rank, line, value });
    // Cut AFTER the rank is assigned, so the twentieth row carries its true
    // place rather than a number counted from the top of a truncated list.
    if (board.length >= limit) break;
  }

  return board;
}
