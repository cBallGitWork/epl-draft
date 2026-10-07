import type { RosterSlot } from "./types";

// What a roster slot's raw status means, in one place: a third status from Fantrax reads as "not active".

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
