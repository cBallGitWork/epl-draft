import type { Unresolved } from "@epl/core";

// Why a roster slot has no footballer behind it, in words a manager can act on; two dialogs read it.
// Only `unmapped` is settled (Fantrax lists players FPL never has); the other two are work to do.

const REASON: Record<Unresolved, string> = {
  unmapped:
    "Not in FPL — Fantrax carries academy and fringe players the Premier League game does not list.",
  unbridged: "Not mapped yet. He joined the pool since the last bridge run.",
  absent: "FPL has dropped him since our snapshot, so there is nothing to join to.",
};

/** A sentence, for a dialog that has the room for one. */
export function unresolvedReason(unresolved: Unresolved): string {
  return REASON[unresolved];
}
