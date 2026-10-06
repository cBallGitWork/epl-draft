"use client";

import { useRouter } from "next/navigation";

/** The phone's back button; a page opened cold from a shared link has no history, so it goes to `fallback`. */
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
