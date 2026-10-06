"use client";

import { useRouter } from "next/navigation";

/** A phone's way back, the rail's `←` that only a desk has. A page opened cold from a shared link
 *  has no history, so it goes to `fallback` instead. */
export default function BackPlate({ fallback }: { fallback: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Back"
      onClick={() => (history.length > 1 ? router.back() : router.push(fallback))}
      className="cm-bevel flex w-11 shrink-0 items-center justify-center text-lg font-bold lg:hidden"
    >
      <span aria-hidden>←</span>
    </button>
  );
}
