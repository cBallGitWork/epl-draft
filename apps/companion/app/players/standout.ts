// Which figures on the board are worth looking at, and which are just numbers.
//
// **The reference is Opta's season-stats grid** (Craig, 10 Sep 2026), which
// shades every numeric cell on a continuous brown-to-purple ramp. That is what
// makes it scannable and it is also the one thing on that screen we cannot copy:
// DESIGN §3 says the ground ramp means "depth, never meaning", and a hue that
// slides through a range is a colour saying twenty things rather than one.
//
// Craig's answer was to keep the idea and drop the ramp — *"magnitude ramp, but
// maybe just highlight the really good values? we also can use better colours
// for us too"* — which is a better rule than the one it replaces. A lit cell
// means exactly one thing: **this figure is at the top of its column**. There is
// no second strength to read, so there is nothing to misread.
//
// The arithmetic is here rather than in the table because it is arithmetic:
// pure, tested, and with no opinion about colour. `PlayerTable` decides what a
// mark LOOKS like; this decides what earns one.

/** The most of a column that may be lit.
 *
 *  **One number and not two, and getting there took a wrong turn worth
 *  recording.** The first cut of this took the top DECILE by rank — the tenth
 *  best figure, and everything at or above it. That is the right idea for a
 *  continuous measure and wrong for almost every column on this board, because
 *  these are small integers: goals after three rounds run 0 to 3, so the tenth
 *  best figure is a 2, and lighting every 2 lights a third of the column.
 *  Bolting a ceiling onto the decile then over-corrected and put `G` and `CS`
 *  dark, which were the two columns the marks were most useful on.
 *
 *  So the rule is stated the way a reader would state it: **light the highest
 *  figures in the column, taking whole values at a time, for as long as that
 *  stays rare.** A column of 0–3 goals lights the 3s and stops. `Min` lights
 *  nothing in August, when thirty men in a hundred have played every minute, and
 *  begins to light as the ever-presents thin out — which is right rather than a
 *  concession: playing every minute is remarkable in April and ordinary now.
 *
 *  Whole values at a time is the part that is not negotiable. Ten of the thirty
 *  men tied on 270 minutes cannot be lit and the other twenty left dark, because
 *  there is no difference between them for a reader to see.
 *
 *  A sixth, because it is the largest share that still reads as an exception:
 *  one figure in six is about four cells on a phone's worth of rows. */
const CEILING = 1 / 6;

/** How many scored figures a column needs before any of them is exceptional.
 *
 *  Without a floor, a column where four men have a number lights one of them and
 *  calls it the top of the column. That is a claim about a population of four,
 *  and the honest answer for a column that thin is to light nothing. Ten is the
 *  smallest population where a sixth is more than one man.
 *
 *  It bites in practice: `PKS` (penalties saved) is a handful of keepers all
 *  season, and before this floor existed the board lit whichever one of them had
 *  saved a single spot kick, in the same colour it uses for Haaland's goals. */
const FLOOR = 10;

/** The value a figure must reach to be lit, or null when the column has no
 *  exceptions to mark.
 *
 *  **Direction-agnostic on purpose.** This always finds the top of the column;
 *  whether the top is the good end is the COLUMN's business, not this
 *  function's — `YC` and `G` are the same arithmetic and opposite meanings, and
 *  keeping the meaning out of here is what lets one cut serve both.
 *
 *  Two things disqualify a column, and each is a real state of this pool:
 *
 *  · **Fewer than `FLOOR` scored figures** — the keeper-only columns, most of
 *    the season.
 *  · **A top value that is not rare** — `GP` after three rounds is 3 for
 *    everyone who has played, so the highest value IS the whole column. A column
 *    where everybody agrees has no standouts, and it needs no separate guard:
 *    the share test refuses it on its own.
 *
 *  Noughts are dropped before any of it, and that is a decision rather than
 *  hygiene. `G` reads nought for 490 of 652, and counting them would make the
 *  population the pool rather than the scorers — a distribution whose top sixth
 *  is "anyone who has scored twice", which is a statement about squad size and
 *  not about football. */
export function cutFor(values: Iterable<number | null>): number | null {
  const scored: number[] = [];
  for (const value of values) {
    if (value !== null && Number.isFinite(value) && value > 0) scored.push(value);
  }
  if (scored.length < FLOOR) return null;

  scored.sort((a, b) => b - a);
  const room = scored.length * CEILING;

  // Walk down the distinct values, keeping the last one whose whole band still
  // fits. `taken` counts every figure at or above the value being considered,
  // so a band is only ever accepted entire.
  let cut: number | null = null;
  let taken = 0;
  for (let index = 0; index < scored.length; index += 1) {
    taken += 1;
    const last = index === scored.length - 1;
    if (last || scored[index + 1] !== scored[index]) {
      if (taken > room) break;
      cut = scored[index];
    }
  }
  return cut;
}

/** Whether one figure has earned its mark. Null cut means the column lights
 *  nothing, which is the ordinary case for more of them than not. */
export function isStandout(value: number | null, cut: number | null): boolean {
  return cut !== null && value !== null && value >= cut;
}

/** Every column's cut, worked out once for a board.
 *
 *  **Generic over the column, deliberately.** This file knows nothing about
 *  `PoolColumn` or `PoolRow` and should not: what it needs is a key to file the
 *  answer under and a way to ask for the figures, and keeping it at that is what
 *  makes the whole module testable without a Fantrax payload.
 *
 *  **The population is the rows on SCREEN, and that is the caller's decision to
 *  make correctly.** Taken over all six hundred matching rows, the top decile is
 *  sixty-five men and a board sorted by points would light almost every cell on
 *  its first page. Taken over the hundred actually drawn, a mark means "the top
 *  of this column, among what is in front of you" — which re-reads every time a
 *  filter changes, and is the only reading that stays true as it does. */
export function cutsFor<Column extends { key: string }>(
  columns: readonly Column[],
  values: (column: Column) => Iterable<number | null>,
): Map<string, number | null> {
  return new Map(columns.map((column) => [column.key, cutFor(values(column))]));
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
