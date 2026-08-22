import type { Unresolved } from "@epl/core";

// Why a roster slot has no footballer behind it, in words a manager can act on.
//
// Three renderings of one fact, in two registers — which is what made it a rule
// rather than a coincidence (CODE_RULES §1). The sticker on the grass has 56
// pixels and gets three words; a dialog has a paragraph and gets a sentence
// saying what to do about it. What varies is the room, not the meaning, so both
// live here and neither screen can drift from the other on which of the three
// states it is describing.
//
// The three are kept apart because they are three different things and only one
// of them is fine: `unmapped` is a settled outcome — Fantrax carries academy and
// fringe names the Premier League game has never listed — while the other two
// are work somebody has to do.

const SHORT: Record<Unresolved, string> = {
  unmapped: "not in FPL",
  unbridged: "not mapped yet",
  absent: "dropped by FPL",
};

const REASON: Record<Unresolved, string> = {
  unmapped:
    "Not in FPL — Fantrax carries academy and fringe players the Premier League game does not list.",
  unbridged: "Not mapped yet. He joined the pool since the last bridge run.",
  absent: "FPL has dropped him since our snapshot, so there is nothing to join to.",
};

/** Three words, for a band under a sticker. */
export function unresolvedShort(unresolved: Unresolved): string {
  return SHORT[unresolved];
}

/** A sentence, for a dialog that has the room for one. */
export function unresolvedReason(unresolved: Unresolved): string {
  return REASON[unresolved];
}
