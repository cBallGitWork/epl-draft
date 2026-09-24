import { standoutCuts, type StandoutCut, type StandoutShares } from "../components/league/standout";

// Which figures on the pool board are lit: a column's top values, among the rows drawn, while they stay rare.
// The rule and the inks are shared with the match board (`components/league/standout.ts`); the shares are ours.

/** A sixth in yellow, the largest share that still reads as an exception; a twentieth in orange, its best. */
const SHARES: StandoutShares = { good: 1 / 6, best: 1 / 20 };

/** Ten scored figures before a column has a top: under that a sixth is one man, and means nothing. */
const FLOOR = 10;

/** Every lit column's cuts, taken over the figures the caller hands it — the rows on screen. */
export function cutsFor<Column extends { key: string }>(
  columns: readonly Column[],
  values: (column: Column) => Iterable<number | null>,
): Map<string, StandoutCut> {
  return new Map(columns.map((column) => [column.key, standoutCuts([...values(column)], SHARES, { floor: FLOOR })]));
}

/** The least football a man must have played before a rate is drawn for him: one match, in August as in May. */
const RATE_FLOOR = 90;

/** A count per ninety minutes played, or nothing (a dash, sorted last) when there is too little football behind it.
 *  Not rounded here: two men at 0.514 and 0.508 print alike and must still order. */
export function per90(value: number | null, minutes: number | null): number | null {
  if (value === null || minutes === null || minutes < RATE_FLOOR) return null;
  return (value * 90) / minutes;
}
