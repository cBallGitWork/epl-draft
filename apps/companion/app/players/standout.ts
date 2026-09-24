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

/** The least football a man must have played before a rate is drawn for him.
 *
 *  **One match, and it is a fact about football rather than about the season** —
 *  which is what separates it from the minutes FLOORS in `minutes.ts`, every one
 *  of which is derived because it encodes how far through a campaign we are.
 *  Ninety minutes is ninety minutes in August and in May.
 *
 *  It exists because the first cut of the per-90 toggle had no floor and the
 *  board showed it immediately: sorted by points per 90, the top of the table
 *  was a wall of men on **90.00** — one minute on the pitch, one point, rated as
 *  though they had played the whole match every week. Arithmetically true and a
 *  lie about football, which is exactly what the docblock below already said and
 *  had not been made to do. Found by looking at the screen. */
const RATE_FLOOR = 90;

/** A count expressed per ninety minutes played, or nothing when there is not
 *  enough football behind it to divide by.
 *
 *  **A dash and not a nought**, which is the app's absence grammar (DESIGN §7)
 *  doing real work: a man who has played four minutes has no rate, and saying so
 *  is different from saying his rate is zero. It also puts him where he belongs
 *  in the order — `shownRows` sorts absent figures last whichever way a column
 *  runs — so turning the toggle on no longer floats the least-played men in the
 *  pool to the top of it.
 *
 *  Not rounded here. A rate that is rounded before it is compared sorts wrong —
 *  two men at 0.514 and 0.508 both print 0.51 and must still order — so the
 *  rounding is the cell's and the number stays full-precision until then. */
export function per90(value: number | null, minutes: number | null): number | null {
  if (value === null || minutes === null || minutes < RATE_FLOOR) return null;
  return (value * 90) / minutes;
}
