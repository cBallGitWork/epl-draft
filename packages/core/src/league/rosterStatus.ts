import type { RosterSlot } from "./types";

// What a roster slot's status means, in one place.
//
// `RosterSlot.status` is carried raw because the vocabulary is Fantrax's, which
// leaves every reader to compare against the same two strings. That was fine at
// two sites and stopped being fine at four, spread across the move model, the
// violation check, the pitch and the planner — so the comparison lives here now
// and the strings appear once (§1).
//
// Deliberately a predicate rather than a boolean field on the type: a third
// status would surface as "not active" here, which is the safe reading, instead
// of being folded into a boolean at the mapper where it would vanish.

/** Fantrax's own words. Anything else is a reserve as far as we are concerned. */
export const ACTIVE = "ACTIVE";
export const RESERVE = "RESERVE";

export function isActive(slot: RosterSlot): boolean {
  return slot.status === ACTIVE;
}

/** Everyone currently playing in one position. */
export function activeAt(slots: readonly RosterSlot[], position: string): RosterSlot[] {
  return slots.filter((slot) => isActive(slot) && slot.position === position);
}
