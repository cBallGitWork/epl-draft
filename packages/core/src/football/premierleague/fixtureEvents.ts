import type { RawPlFixtureEvent } from "./raw";

// The fixture detail's `events` vocabulary and clock reader, shared by `sheetEvents.ts` and `goals.ts`.

/** The feed's own letters. `MP` (missed penalty) is never read: FPL's sheet carries `penaltiesMissed`. */
export const GOAL = "G";
export const OWN_GOAL = "O";
export const PENALTY = "P";
export const BOOKING = "B";
export const SUBSTITUTION = "S";

/** An event's minute with added time dropped (`"90+1'00"` is 90); null when it carries no clock. */
export function minuteOf(event: RawPlFixtureEvent): number | null {
  return clockMinute(event.clock?.label);
}

/** A printed clock's minute, added time dropped: `"56'00"` and `"56"` are 56, `"90+1"` is 90. */
export function clockMinute(label: string | undefined): number | null {
  if (label === undefined) return null;
  const at = Number.parseInt(label, 10);
  return Number.isNaN(at) ? null : at;
}
