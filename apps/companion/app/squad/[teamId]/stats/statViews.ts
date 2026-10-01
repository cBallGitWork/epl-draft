import { PLAYER_CATEGORIES, carries, type PlayerStatLine, type SeasonTotals } from "@epl/core";

// What the stats board can show, and the arithmetic behind each column.
//
// Split out of `StatBoard.tsx` when it crossed CODE_RULES §4's hard 300-line
// ceiling. The seam is real rather than convenient: everything here is data and
// pure functions with no JSX, which is the same `map.ts`-beside-a-view shape
// `packages/core/src/football/` sets.

/** The views: every category the league scores, then the same counts by group, then FPL's. */
export const VIEWS = [
  { key: "fantasy", label: "Scoring" },
  { key: "attacking", label: "Attacking" },
  { key: "defensive", label: "Defensive" },
  { key: "discipline", label: "Discipline" },
  { key: "underlying", label: "Underlying (FPL)" },
] as const;

/** What FPL knows that our league does not score.
 *
 *  **Named as FPL's on the control, which is how DESIGN §7 is satisfied here.**
 *  The rule bites when two sources answer the same question and a reader cannot
 *  tell whose figure he is reading — so goals and assists are absent from this
 *  view entirely, because Fantrax pays for those and is the authority on them.
 *  What is left is the play UNDER the scoring, which our league does not count
 *  at all, and the denominators under everything else.
 *
 *  `xGC` is a defender's and a keeper's column: the goals a side was expected to
 *  concede while he was on the pitch, which is the closest thing FPL publishes
 *  to "was he any good at the back". */
const UNDERLYING = [
  { key: "minutes", head: "Min", label: "Minutes played" },
  { key: "starts", head: "St", label: "Starts — not the same as appearances" },
  { key: "expectedGoals", head: "xG", label: "Expected goals", decimals: true },
  { key: "expectedAssists", head: "xA", label: "Expected assists", decimals: true },
  { key: "expectedGoalsConceded", head: "xGC", label: "Expected goals conceded", decimals: true, worse: true },
  { key: "tackles", head: "Tck", label: "Tackles" },
  { key: "clearancesBlocksInterceptions", head: "CBI", label: "Clearances, blocks and interceptions — FPL publishes the three as one figure" },
  { key: "recoveries", head: "Rec", label: "Ball recoveries" },
  { key: "saves", head: "Sv", label: "Saves" },
  { key: "bps", head: "BPS", label: "FPL's bonus points system score" },
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
 *  and sort read one list. `totals` is his FPL season, `undefined` where the bridge has not settled him. */
export type Measure = {
  key: string;
  head: string;
  label: string;
  read: (line: PlayerStatLine, totals: SeasonTotals | undefined) => number | null;
  /** FPL publishes the expected family to two places and a count to none. */
  decimals?: boolean;
  /** A column whose top is the bad end, lit red rather than yellow and orange. */
  worse?: boolean;
};

/** A view's columns in order. No total: the categories are raw counts, so a sum would add cards and goals conceded.
 *  A category the league's read has no column for is left off; an empty `scored` keeps them all. */
export function measuresFor(view: ViewKey, scored: ReadonlySet<string>): readonly Measure[] {
  if (view === "underlying")
    return UNDERLYING.map((column) => ({
      key: column.key,
      head: column.head,
      label: column.label,
      decimals: "decimals" in column && column.decimals,
      worse: "worse" in column && column.worse,
      read: (_line: PlayerStatLine, totals: SeasonTotals | undefined) =>
        totals?.[column.key] ?? null,
    }));

  const categories = PLAYER_CATEGORIES.filter(
    (category) => (view === "fantasy" || category.group === view) && carries(scored, category.key, category.also),
  );
  const measures: Measure[] = categories.map((category) => ({
    key: category.key,
    head: category.key,
    label: category.label,
    worse: category.lowIsGood === true,
    read: (line: PlayerStatLine) => figure(line, category.key, category.also),
  }));
  return measures;
}

/** Every sortable column, keyed; not the visible list, so a sort outlives a switch of view. */
const SORTABLE = new Map(
  [...measuresFor("fantasy", new Set()), ...measuresFor("underlying", new Set())].map((measure) => [measure.key, measure]),
);

/** One reading, by column key — the sort comparator's way in, and the same
 *  function the cell that prints it uses. */
export function readingOf(
  line: PlayerStatLine,
  totals: SeasonTotals | undefined,
  key: string,
): number | null {
  return SORTABLE.get(key)?.read(line, totals) ?? null;
}
