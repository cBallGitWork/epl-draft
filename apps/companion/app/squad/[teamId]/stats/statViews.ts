import { PLAYER_CATEGORIES, carries, type PlayerStatLine } from "@epl/core";

// What the stats board can show, and the arithmetic behind each column: data and pure functions, no JSX.

/** The views: every category the league scores, then the same counts by group. */
export const VIEWS = [
  { key: "fantasy", label: "Scoring" },
  { key: "attacking", label: "Attacking" },
  { key: "defensive", label: "Defensive" },
  { key: "discipline", label: "Discipline" },
] as const;

export type ViewKey = (typeof VIEWS)[number]["key"];

/** Fantrax spells the same defensive fact `GA` for a keeper and `GAO` for an
 *  outfielder, so a category may name a second column to try. Read as a
 *  fallback, never summed: a man is in exactly one half of the read, so at most
 *  one of the two is ever on his row. */
function figure(line: PlayerStatLine, key: string, also: string | undefined) {
  return line.stats[key] ?? (also === undefined ? null : line.stats[also] ?? null);
}

/** One column on the board: its head, what it means, and how to read it off a row, so the heads, cells, key, cuts
 *  and sort read one list. */
export type Measure = {
  key: string;
  head: string;
  label: string;
  read: (line: PlayerStatLine) => number | null;
  /** A column whose top is the bad end, lit red rather than yellow and orange. */
  worse?: boolean;
};

/** A view's columns in order. No total: the categories are raw counts, so a sum would add cards and goals conceded.
 *  A category the league's read has no column for is left off; an empty `scored` keeps them all. */
export function measuresFor(view: ViewKey, scored: ReadonlySet<string>): readonly Measure[] {
  const categories = PLAYER_CATEGORIES.filter(
    (category) => (view === "fantasy" || category.group === view) && carries(scored, category.key, category.also),
  );
  return categories.map((category) => ({
    key: category.key,
    head: category.key,
    label: category.label,
    worse: category.lowIsGood === true,
    read: (line: PlayerStatLine) => figure(line, category.key, category.also),
  }));
}

/** Every sortable column, keyed; not the visible list, so a sort outlives a switch of view. */
const SORTABLE = new Map(measuresFor("fantasy", new Set()).map((measure) => [measure.key, measure]));

/** One reading, by column key — the sort comparator's way in, and the same
 *  function the cell that prints it uses. */
export function readingOf(line: PlayerStatLine, key: string): number | null {
  return SORTABLE.get(key)?.read(line) ?? null;
}
