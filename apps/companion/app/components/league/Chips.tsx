import { NOTABLE_SAVES } from "@epl/core";

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
//
// The fixture list's drop-down was the third rendering and had already drifted
// from these two: same six events, a different order, `2G` where these say
// `G×2`, and a palette of its own — the exact thing the paragraph above was
// written to prevent, happening one file over.
//
// It takes the countable events rather than a named type, so the squad's summed
// `Contribution` and a single match's `MatchContribution` both satisfy it. The
// two genuinely differ: only a squad view knows whether a man kept a clean sheet
// across both his matches, and only a per-match row carries FPL's bonus.

/** **Every tone carries `cm-chip` and its own ink as a variable**, which is what
 *  keeps a chip legible on a greyed row. `.cm-out *` is unlayered and beats a
 *  Tailwind utility, so `text-bg` alone loses the moment a row dims — see the
 *  `.cm-out .cm-chip` rule in `desk.css` for the measurement that found it. The
 *  variable exists because the four tones do not share one ink. */
const TONES = {
  goal: "cm-chip [--cm-chip-ink:var(--color-bg)] bg-accent text-bg",
  assist: "cm-chip [--cm-chip-ink:var(--color-bg)] bg-info text-bg",
  // Both grounds these land on are dark now — the pitch band under a player who
  // has played, and a row in the list — so the quiet chip can be quiet again.
  // It was solid grey for a while, when the pitch band was cream and 15% white
  // over cream turned a booking into a blank box.
  note: "cm-chip [--cm-chip-ink:var(--color-cream)] bg-cream/20 text-cream",
  bad: "cm-chip [--cm-chip-ink:var(--color-bg)] bg-bad text-bg",
} as const;

/** The countable events, and only what a chip is drawn from. Structural rather
 *  than nominal so both shapes fit without either learning about the other. */
export interface Countable {
  goals: number;
  assists: number;
  saves: number;
  yellowCards: number;
  redCards: number;
  /** Absent on a single match: a clean sheet is a statement about every match a
   *  man played in the round, which one fixture's row cannot make. */
  cleanSheet?: boolean;
  /** Absent on a squad view: `getTeamRosters` carries no bonus, and FPL's is a
   *  per-match award. */
  bonus?: number;
}

export interface Chip {
  label: string;
  /** Ground and ink. Size and padding are the caller's. */
  className: string;
}

/** Most consequential first.
 *
 *  The order is the order a manager would rank them in. A sending-off is the
 *  worst thing that can happen to a fantasy team, then a goal, then an assist; a
 *  clean sheet, a busy afternoon in goal, bonus and a booking come after. A
 *  player who has done more than two of these has plainly had a day, and the two
 *  that show are the two that decided it. */
export function chipsFor(done: Countable): Chip[] {
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
  if ((done.bonus ?? 0) > 0) chips.push({ label: `${done.bonus}b`, className: TONES.note });
  if (done.redCards === 0 && done.yellowCards > 0) {
    chips.push({ label: "YC", className: TONES.note });
  }
  return chips;
}
