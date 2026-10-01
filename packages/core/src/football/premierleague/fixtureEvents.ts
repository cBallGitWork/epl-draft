import type { RawPlFixtureEvent } from "./raw";

// The fixture detail's `events` array, as both halves of it are read.
//
// **Its own module because the file it came out of was split, not because the
// three lines below were duplicated anywhere.** `sheetEvents.ts` had grown to
// 379 lines against CODE_RULES §4's hard ceiling of 300, and the natural seam
// is what the events are being read FOR — one man's match on one side, the
// side's goals on the other. Both readings walk the same array in the same
// vocabulary, so the vocabulary sits here rather than being spelled twice or
// exported out of one half into the other.

/** Their own single letters. `G` a goal, `O` an own goal, `P` a penalty, `MP` a
 *  missed penalty, `B` a booking, `S` a substitution, `PS`/`PE` the period
 *  marks.
 *
 *  **`MP` is read and dropped, deliberately.** It is a real type carrying a real
 *  man — one row in gameweeks 1-3 — but a missed penalty is not a mark CM's
 *  ratings board carries, and FPL's own per-fixture sheet already publishes
 *  `penaltiesMissed` for the screens that want it. Named here so the next reader
 *  knows it was counted rather than missed. */
export const GOAL = "G";
export const OWN_GOAL = "O";
export const PENALTY = "P";
export const BOOKING = "B";
export const SUBSTITUTION = "S";

/** The minute a clock label names, with its added time dropped. Null when the
 *  event carries no clock at all, which no `G`/`B`/`S` row did across the 862
 *  events of gameweeks 1-3 — but the field is optional on the wire, and an event
 *  we cannot place in the match is not one we can put beside a name.
 *
 *  **A minute drops its added time**, the same rule `matchGoalMinutes` states: a
 *  goal in the 47th minute of the first half is a 45th-minute goal on any
 *  teleprinter, and `"90+1'00"` is read as 90. */
export function minuteOf(event: RawPlFixtureEvent): number | null {
  return clockMinute(event.clock?.label);
}

/** A printed clock's minute, added time dropped: `"56'00"` and `"56"` are 56, `"90+1"` is 90. */
export function clockMinute(label: string | undefined): number | null {
  if (label === undefined) return null;
  const at = Number.parseInt(label, 10);
  return Number.isNaN(at) ? null : at;
}
