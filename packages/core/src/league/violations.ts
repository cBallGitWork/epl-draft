import type { Eligibility } from "./moves";
import { activeAt, isActive } from "./rosterStatus";
import type { RosterLimits, RosterSlot } from "./types";

// What is wrong with a lineup as Fantrax served it: nothing `legalMoves` offers can produce any state below.

/** A rule this lineup is currently breaking. A short XI is not one (legal, merely wasteful); a short position is. */
export type Violation =
  | { kind: "too-many-active"; count: number; cap: number }
  | { kind: "too-many-reserve"; count: number; cap: number }
  | { kind: "position-over-cap"; position: string; count: number; cap: number }
  | { kind: "position-under-min"; position: string; count: number; min: number }
  | { kind: "not-eligible"; fantraxId: string; position: string };

/** Everything wrong with a lineup as it stands, all of them and not the first, or an empty list. */
export function violations(
  slots: readonly RosterSlot[],
  eligibility: Eligibility,
  limits: RosterLimits,
): Violation[] {
  const found: Violation[] = [];
  const active = slots.filter(isActive);

  // A null cap cannot be broken; guard it explicitly, since `x > null` coerces to `x > 0`.
  if (limits.maxActivePlayers !== null && active.length > limits.maxActivePlayers) {
    found.push({ kind: "too-many-active", count: active.length, cap: limits.maxActivePlayers });
  }

  // Everyone not active, as `legalMoves` counts them, so a third status value is not lost.
  const reserves = slots.length - active.length;
  if (limits.maxReservePlayers !== null && reserves > limits.maxReservePlayers) {
    found.push({ kind: "too-many-reserve", count: reserves, cap: limits.maxReservePlayers });
  }

  for (const [position, cap] of Object.entries(limits.maxActiveByPosition)) {
    const count = activeAt(slots, position).length;
    if (count > cap) found.push({ kind: "position-over-cap", position, count, cap });
  }

  // Empty wherever nobody read the setup page's minimums, so no floor is invented.
  for (const [position, min] of Object.entries(limits.minActiveByPosition)) {
    const count = activeAt(slots, position).length;
    if (count < min) found.push({ kind: "position-under-min", position, count, min });
  }

  for (const slot of active) {
    // A slot with no position breaks no published rule.
    if (!slot.position) continue;
    const eligible = eligibility.get(slot.fantraxId);
    // Eligibility we do not hold is not eligibility he lacks: no move could clear that accusation.
    if (eligible === undefined || eligible.length === 0) continue;
    if (!eligible.includes(slot.position)) {
      found.push({ kind: "not-eligible", fantraxId: slot.fantraxId, position: slot.position });
    }
  }

  return found;
}
