import { type Contribution, NOTABLE_SAVES } from "@epl/core";

// What a player has done, ranked, as coloured tokens.
//
// Shared by the sticker on the pitch and the row in the list rather than copied
// into both, because neither half of it is a coincidence: the ranking is a
// product decision — which of a man's six possible events matter most when there
// is only room for two — and the colours are a palette. Two copies of either is
// how the fixture-difficulty scale came to be written out twice.
//
// How MANY to show is the caller's, because that depends on how wide the thing
// is. A sticker on the grass has about 56px and a list row has a column.

const TONES = {
  goal: "bg-accent text-bg",
  assist: "bg-info text-bg",
  // Both grounds these land on are dark now — the pitch band under a player who
  // has played, and a row in the list — so the quiet chip can be quiet again.
  // It was solid grey for a while, when the pitch band was cream and 15% white
  // over cream turned a booking into a blank box.
  note: "bg-cream/20 text-cream",
  bad: "bg-bad text-bg",
} as const;

export interface Chip {
  label: string;
  /** Ground and ink. Size and padding are the caller's. */
  className: string;
}

/** Most consequential first.
 *
 *  The order is the order a manager would rank them in. A sending-off is the
 *  worst thing that can happen to a fantasy team, then a goal, then an assist; a
 *  clean sheet, a busy afternoon in goal and a booking come after. A player who
 *  has done more than two of these has plainly had a day, and the two that show
 *  are the two that decided it. */
export function chipsFor(done: Contribution): Chip[] {
  const chips: Chip[] = [];
  if (done.redCards > 0) chips.push({ label: "RC", className: TONES.bad });
  if (done.goals > 0) {
    chips.push({ label: done.goals > 1 ? `G×${done.goals}` : "G", className: TONES.goal });
  }
  if (done.assists > 0) {
    chips.push({ label: done.assists > 1 ? `A×${done.assists}` : "A", className: TONES.assist });
  }
  if (done.cleanSheet) chips.push({ label: "CS", className: TONES.assist });
  if (done.saves >= NOTABLE_SAVES) chips.push({ label: `${done.saves}sv`, className: TONES.note });
  if (done.redCards === 0 && done.yellowCards > 0) {
    chips.push({ label: "YC", className: TONES.note });
  }
  return chips;
}
