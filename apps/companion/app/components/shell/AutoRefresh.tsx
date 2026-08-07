"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The page is server-rendered and `revalidate` only bounds how stale the cache
// may get — it does not push anything to a phone already showing the score. Left
// alone, a device open on the sofa displays a frozen scoreline under a pulsing
// LIVE dot for the whole second half.
//
// This asks the server for a fresh render on an interval. It is the app's only
// client component on purpose: everything else stays server-rendered, and this
// adds no data-fetching library to do what one timer does.

export default function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      // A backgrounded tab is nobody watching. Refreshing it burns the phone's
      // battery and our upstream quota to redraw pixels no one can see.
      if (document.visibilityState === "visible") router.refresh();
    };

    const timer = setInterval(tick, seconds * 1000);

    // Coming back to the tab should show the current score immediately rather
    // than whatever it froze on, and then up to a full interval of nothing.
    document.addEventListener("visibilitychange", tick);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, seconds]);

  return null;
}
