"use client";

import { useRouter } from "next/navigation";
import { PREM } from "../../routes";

/** A phone's way back out of a match, at the left of the score bar — the rail's `←`, which only a desk has.
 *  A match opened cold from a shared link has no history, so it goes to the competition instead. */
export default function BackPlate() {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Back"
      onClick={() => (history.length > 1 ? router.back() : router.push(PREM))}
      className="cm-bevel flex w-11 shrink-0 items-center justify-center text-lg font-bold lg:hidden"
    >
      <span aria-hidden>←</span>
    </button>
  );
}
