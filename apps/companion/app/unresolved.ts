import type { Unresolved } from "@epl/core";

// Why a roster slot has no footballer behind it, in words a manager can act on.
//
// **Two renderings now, and it was three.** The third was a three-word band
// under the planner's own sticker, and that card went on 21 Sep 2026 when the
// planner moved to `PitchMarker` — which draws an empty slot rather than naming
// the reason, the same as every other pitch in the app. §1 says two is a
// coincidence; this stays shared rather than being copied back into the two
// dialogs, because it was never two files that happened to look alike. The count
// is written down so the next pass does not have to re-derive it.
//
// The three are kept apart because they are three different things and only one
// of them is fine: `unmapped` is a settled outcome — Fantrax carries academy and
// fringe names the Premier League game has never listed — while the other two
// are work somebody has to do.

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
