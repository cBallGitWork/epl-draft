import type { Move } from "@epl/core";

// The move dialog's swaps, grouped and named from the tapped man's side of each pair.

type Swap = Extract<Move, { kind: "swap" }>;

export interface SwapGroup {
  heading: string;
  options: { key: string; label: string; move: Swap }[];
}

/** A man in the side lists who could come on for him; a reserve lists, by position, who would come off. */
export function swapGroups(moves: readonly Move[], subject: string, nameOf: (id: string) => string): SwapGroup[] {
  const swaps = moves.filter((move): move is Swap => move.kind === "swap");
  const comingOn = swaps.filter((move) => move.withId === subject);
  if (comingOn.length > 0) {
    const options = comingOn.map((move) => ({ key: `${move.fantraxId}-${move.to}`, label: `${nameOf(move.fantraxId)} at ${move.to}`, move }));
    return [{ heading: "Who comes on for him?", options }];
  }
  const byPosition = new Map<string, SwapGroup>();
  for (const move of swaps) {
    const group = byPosition.get(move.to) ?? { heading: `Start at ${move.to} — who comes off?`, options: [] };
    group.options.push({ key: move.withId, label: nameOf(move.withId), move });
    byPosition.set(move.to, group);
  }
  return [...byPosition.values()];
}
