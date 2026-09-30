import { PLAYER_CATEGORIES, type PlayerStatLine, type SeasonTotals } from "@epl/core";

// What the stats board can show, and the arithmetic behind each column.
//
// Split out of `StatBoard.tsx` when it crossed CODE_RULES §4's hard 300-line
// ceiling. The seam is real rather than convenient: everything here is data and
// pure functions with no JSX, which is the same `map.ts`-beside-a-view shape
// `packages/core/src/football/` sets.

/** The views, and what each one answers.
 *
 *  **Fantasy leads** because it is the question this league is actually playing:
 *  what our scoring paid each man. The other three are the raw counts behind it,
 *  grouped the way `league/categories.ts` already groups a team's — the same
 *  four kinds of thing a squad does, minus appearances, which has no per-player
 *  column in this read. */
export const VIEWS = [
  { key: "fantasy", label: "Fantasy points" },
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

/** His total, as our league scores it — the sum of every category on his row.
 *
 *  **Not the pool's `FPts`.** That column prices a man at his DEFAULT position
 *  and never at the slot his manager filed him in (CLAUDE.md, and 48 of 607 are
 *  eligible at two) — Saka is paid at forward rates there and at midfield rates
 *  by the league. A total added from the counts is ours rather than Fantrax's,
 *  so DESIGN §7 requires it be labelled as ours: the column is headed `Pts` and
 *  never `FPts`, which is Fantrax's own name for a different number. */
function totalOf(line: PlayerStatLine): number | null {
  const figures = PLAYER_CATEGORIES.map((category) =>
    figure(line, category.key, category.also),
  ).filter((value): value is number => value !== null);
  return figures.length === 0 ? null : figures.reduce((sum, value) => sum + value, 0);
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
  /** The column the view is FOR, drawn bold. Only the total claims it. */
  loud?: boolean;
  /** A column whose top is the bad end, lit red rather than yellow and orange. */
  worse?: boolean;
};

/** Our own total, a column like the rest so no site draws it as a special case. */
const TOTAL: Measure = {
  key: "pts",
  head: "Pts",
  label: "Our total of his scoring categories",
  loud: true,
  read: (line) => totalOf(line),
};

/** The columns a view puts on screen, in the order it puts them.
 *
 *  Fantasy is every category the league scores plus the total; the other two
 *  category views are that list filtered to one group and carry no total,
 *  because a total of three of eleven categories is not a total of anything.
 *  Underlying is FPL's, and shares no column with any of them. */
export function measuresFor(view: ViewKey): readonly Measure[] {
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

  const categories =
    view === "fantasy"
      ? PLAYER_CATEGORIES
      : PLAYER_CATEGORIES.filter((category) => category.group === view);
  const measures: Measure[] = categories.map((category) => ({
    key: category.key,
    head: category.key,
    label: category.label,
    worse: category.lowIsGood === true,
    read: (line: PlayerStatLine) => figure(line, category.key, category.also),
  }));
  return view === "fantasy" ? [...measures, TOTAL] : measures;
}

/** Every column the board can sort by, keyed. Built from the two views that
 *  between them name all of them — `fantasy` is every category plus the total,
 *  and the group views are subsets of it.
 *
 *  **Deliberately not the visible list.** Sorting outlives its column: order the
 *  squad by goals and switch to the defensive group, and the order stands, which
 *  is what it did before this list existed. A comparator that could only see
 *  what is on screen would drop silently back to roster order on the switch. */
const SORTABLE = new Map(
  [...measuresFor("fantasy"), ...measuresFor("underlying")].map((measure) => [measure.key, measure]),
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
