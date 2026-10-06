// What a tap on a card on the planner's pitch does, given who is already picked.

export type PitchTap = "pick" | "drop" | "swap" | "reorder" | "none";

/** `swap`: the tapped man can change places with the picked one; `reorder`: both are subs, so their bench order swaps. */
export function pitchTap(picked: string | null, tapped: string, can: { swap: boolean; reorder: boolean }): PitchTap {
  if (picked === null) return "pick";
  if (picked === tapped) return "drop";
  if (can.swap) return "swap";
  return can.reorder ? "reorder" : "none";
}
