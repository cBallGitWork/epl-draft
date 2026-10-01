import type { SlotWorth, Worth } from "./types";

/** What a slot is paid for one kind of return; 0 when the league pays it nothing there. */
export function priceOf(worth: SlotWorth, slot: string, kind: Worth["kind"]): number {
  return worth.returns[slot]?.find((w) => w.kind === kind)?.worth ?? 0;
}
