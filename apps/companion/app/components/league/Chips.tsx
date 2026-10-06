import { NOTABLE_SAVES } from "@epl/core";

// What a player has done, ranked, as coloured tokens: one ranking and one palette for every sticker, row and
// drop-down. How many to show is the caller's, since a sticker has about 56px and a list row a column.

/** Each tone sets its ink as `--cm-chip-ink` too: `.cm-out *` beats a utility, so `text-bg` alone
 *  vanishes on a greyed row (see `.cm-out .cm-chip` in `desk.css`). */
const TONES = {
  goal: "cm-chip [--cm-chip-ink:var(--color-bg)] bg-accent text-bg",
  assist: "cm-chip [--cm-chip-ink:var(--color-bg)] bg-info text-bg",
  // Translucent, so only on a dark ground: over cream a booking turns into a blank box.
  note: "cm-chip [--cm-chip-ink:var(--color-cream)] bg-cream/20 text-cream",
  bad: "cm-chip [--cm-chip-ink:var(--color-bg)] bg-bad text-bg",
} as const;

/** The events a chip is drawn from; structural, so both callers' shapes fit. */
export interface Countable {
  goals: number;
  assists: number;
  saves: number;
  yellowCards: number;
  redCards: number;
  /** Absent on a single match: a clean sheet covers every match he played in the gameweek. */
  cleanSheet?: boolean;
}

export interface Chip {
  label: string;
  /** Ground and ink. Size and padding are the caller's. */
  className: string;
}

/** Most consequential first: a sending-off, a goal, an assist, a clean sheet, a busy afternoon in goal, a booking. */
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
  if (done.redCards === 0 && done.yellowCards > 0) {
    chips.push({ label: "YC", className: TONES.note });
  }
  return chips;
}
