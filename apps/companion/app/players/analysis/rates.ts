import type { RateTotals } from "@epl/core";
import { per90 } from "../standout";

// What the two men have DONE, as rates — the other half of the attribute grid.
//
// **The grid says where he RANKS; this says what he DOES.** `Measures` renders
// the same underlying quantities as a percentile out of twenty, which answers
// "is he good at this" and cannot answer "how often". A scout reading two
// forwards wants 0.62 against 0.41 as well as 19 against 14, and Understat's own
// comparison — the reference Craig sent — prints exactly this table beside
// exactly that normalised picture. Without the rates the screen ranks men
// against a division it never shows; without the ranks the rates have no scale.
//
// **FPL's numbers only, and deliberately none of the three the competition
// counts.** `SeasonTotals` carries goals, assists and clean sheets with a bound
// written onto the field: they may not appear on a fantasy screen beside a
// Fantrax figure, and its docblock names `/players` as one of the screens that
// is not `/prem`. This route carries no Fantrax figure today, so the collision
// is not live — but the underlying play is both the safer read and the better
// one, it is what Fantrax publishes none of, and a man's own goal count is one
// tap away on his Data tab. Printing it here would be a total in two places,
// which is a reader checking whether they agree.
//
// A rate needs ninety minutes behind it (`per90`'s floor), and under that the
// answer is a dash rather than a nought: he has not played enough football to
// have a rate, which is a different statement from being bad at it.

/** What a ledger reads for one man over the window: FPL's totals, and the export's counts, which are null for a
 *  man the export never bridged (a dash) and nought for one it covers who did nothing. */
export type Played = RateTotals & { touches: number | null; shots: number | null; keyPasses: number | null };

/** One measure, and how to read it off a season. Not a component's business —
 *  this file is pure so the set can be tested without rendering anything. */
export interface Rate {
  /** The label between the two figures. */
  name: string;
  /** Where it came from, for the `title`. DESIGN §7's provenance rule as a
   *  tooltip rather than a printed byline — a screen captioned at every row
   *  reads as a spreadsheet's footnotes rather than as Championship Manager. */
  from: string;
  /** Whether it is a COUNT, and so worth dividing by ninety. Minutes and starts
   *  are the denominators themselves; the board learned that the hard way when
   *  `Min` read 90.00 down the whole column. */
  perNinety: boolean;
  of: (played: Played) => number | null;
}

/** The measures, in the order a scout reads them: how much football, then what
 *  he did with the ball, then what he did without it, then what FPL paid him.
 *
 *  Saves rides along for the keepers and removes itself for everybody else —
 *  see `rateRows`. */
const RATES: readonly Rate[] = [
  { name: "Min", from: "FPL, season total", perNinety: false, of: (s) => s.minutes },
  { name: "Starts", from: "FPL, season total", perNinety: false, of: (s) => s.starts },
  { name: "Touches", from: "SofaScore's touches, per 90", perNinety: true, of: (s) => s.touches },
  { name: "Shots", from: "SofaScore's shots, per 90", perNinety: true, of: (s) => s.shots },
  { name: "Key passes", from: "Understat's passes before a shot, per 90", perNinety: true, of: (s) => s.keyPasses },
  { name: "xG", from: "FPL's expected goals, per 90", perNinety: true, of: (s) => s.expectedGoals },
  { name: "xA", from: "FPL's expected assists, per 90", perNinety: true, of: (s) => s.expectedAssists },
  { name: "Tackles", from: "FPL, per 90", perNinety: true, of: (s) => s.tackles },
  {
    name: "CBI",
    from: "FPL's clearances, blocks and interceptions as one figure, per 90",
    perNinety: true,
    of: (s) => s.clearancesBlocksInterceptions,
  },
  { name: "Recoveries", from: "FPL, per 90", perNinety: true, of: (s) => s.recoveries },
  { name: "Saves", from: "FPL, per 90", perNinety: true, of: (s) => s.saves },
  {
    name: "xGC",
    from: "FPL's expected goals conceded, per 90 — the one measure here a defender wants LOW",
    perNinety: true,
    of: (s) => s.expectedGoalsConceded,
  },
  { name: "BPS", from: "FPL's bonus points system score, per 90", perNinety: true, of: (s) => s.bps },
  { name: "Bonus", from: "FPL, per 90", perNinety: true, of: (s) => s.bonus },
];

/** One measure as both of them have it. */
export interface RateRow {
  name: string;
  from: string;
  /** Whether the two figures are RATES, which is what decides how they print.
   *
   *  It rides on the row rather than being inferred from the value, because
   *  inferring it is wrong about a rate that lands on a whole number: Haaland
   *  has no tackles and exactly two bonus points per ninety, and the first cut
   *  printed those as `0` and `2` down a column of `0.82` and `35.33`. Found by
   *  looking at the screen. */
  perNinety: boolean;
  a: number | null;
  b: number | null;
}

/** Every measure worth printing about these two, in `RATES`' order.
 *
 *  **A row neither of them has anything to say about is dropped**, which is what
 *  keeps Saves off a comparison of two forwards and keeps it on a comparison of
 *  two keepers. Nought is a true answer about a striker's saves and a useless
 *  one: two columns of `0.00` under a label buries the nine rows that separate
 *  them. This is `PlayerStats`' own rule — *"a column of noughts against thirty
 *  names buries the two figures that are not one"* — applied to a table two
 *  wide, where the whole ROW can go rather than each cell.
 *
 *  A man with no football half (the 88 in the pool the bridge has never settled)
 *  arrives as `null` and every figure on his side is a dash. */
export function rateRows(a: Played | null, b: Played | null): RateRow[] {
  const rows: RateRow[] = [];
  for (const rate of RATES) {
    const left = read(rate, a);
    const right = read(rate, b);
    if (silent(left) && silent(right)) continue;
    rows.push({ name: rate.name, from: rate.from, perNinety: rate.perNinety, a: left, b: right });
  }
  return rows;
}

/** One side of one row. Null both for a man we have no season for and for a
 *  rate with too little football under it — the screen says both with a dash,
 *  because in both cases the honest answer is that we cannot state one. */
function read(rate: Rate, played: Played | null): number | null {
  if (played === null) return null;
  const total = rate.of(played);
  if (total === null) return null;
  return rate.perNinety ? per90(total, played.minutes) : total;
}

/** Whether a figure has nothing to say — absent, or a nought that is true and
 *  uninteresting. */
function silent(value: number | null): boolean {
  return value === null || value === 0;
}
