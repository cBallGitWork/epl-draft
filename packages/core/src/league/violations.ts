import type { Eligibility } from "./moves";
import { activeAt, isActive } from "./rosterStatus";
import type { RosterLimits, RosterSlot } from "./types";

// What is WRONG with a lineup, as against what may be done to it.
//
// Split from `moves.ts` because the two never meet on the same roster: nothing
// `legalMoves` offers can produce any state below, so everything here arrived
// from Fantrax. A commissioner can narrow a player's eligibility or lower a cap
// under an XI that was legal when it was set — and did, across the league, on
// 12 Aug.

/** A rule this lineup is currently breaking.
 *
 *  A SHORTFALL is deliberately not one. Fantrax publishes `maxActive` per
 *  position and no minimum, so "only two defenders" breaks no rule anyone set —
 *  ten men in an eleven-man XI is legal and merely wasteful, and saying so is the
 *  UI's job, not this type's. */
export type Violation =
  | { kind: "too-many-active"; count: number; cap: number }
  | { kind: "too-many-reserve"; count: number; cap: number }
  | { kind: "position-over-cap"; position: string; count: number; cap: number }
  | { kind: "not-eligible"; fantraxId: string; position: string };

/** Everything wrong with a lineup as it stands, or an empty list.
 *
 *  Reports all of them rather than the first, because they have different
 *  remedies and a manager fixing one at a time cannot see whether he is finished. */
export function violations(
  slots: readonly RosterSlot[],
  eligibility: Eligibility,
  limits: RosterLimits,
): Violation[] {
  const found: Violation[] = [];
  const active = slots.filter(isActive);

  // **A cap of null is a cap nobody can break.** Each of these guards the null
  // explicitly rather than leaning on a comparison, because `x > null` coerces
  // to `x > 0` and reports every squad as illegal — which is the bug this
  // nullability exists to make unwritable.
  if (limits.maxActivePlayers !== null && active.length > limits.maxActivePlayers) {
    found.push({ kind: "too-many-active", count: active.length, cap: limits.maxActivePlayers });
  }

  // Everyone who is not active, matching `legalMoves`: the status vocabulary is
  // Fantrax's, and a third value belongs in this count rather than vanishing from
  // both of them.
  const reserves = slots.length - active.length;
  if (limits.maxReservePlayers !== null && reserves > limits.maxReservePlayers) {
    found.push({ kind: "too-many-reserve", count: reserves, cap: limits.maxReservePlayers });
  }

  for (const [position, cap] of Object.entries(limits.maxActiveByPosition)) {
    const count = activeAt(slots, position).length;
    if (count > cap) found.push({ kind: "position-over-cap", position, count, cap });
  }

  for (const slot of active) {
    // A slot with no position at all breaks no published rule — Fantrax accepts
    // one and `lineup()` gives it a bucket — so there is nothing to report.
    if (!slot.position) continue;
    const eligible = eligibility.get(slot.fantraxId);
    // Eligibility we do not hold is not eligibility he lacks. Accusing a manager
    // of an illegal XI because our data is missing is the same confident wrong
    // answer `eligibleSlots` refuses to give, and here it would be worse: there
    // is no move that clears it.
    if (eligible === undefined || eligible.length === 0) continue;
    if (!eligible.includes(slot.position)) {
      found.push({ kind: "not-eligible", fantraxId: slot.fantraxId, position: slot.position });
    }
  }

  return found;
}
