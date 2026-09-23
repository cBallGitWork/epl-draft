"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { POLL } from "@epl/core";
import { nextPoll } from "./cadence";

// The page is server-rendered and `revalidate` only bounds how stale the cache
// may get — it does not push anything to a phone already showing the score. Left
// alone, a device open on the sofa displays a frozen scoreline under a pulsing
// LIVE dot for the whole second half.
//
// This asks the server for a fresh render on a timer, and adds no data-fetching
// library to do what one timer does. The rate is decided here from `liveIn`, not
// on the server, so a tab opened before kickoff wakes at kickoff.

export default function AutoRefresh({ liveIn }: { liveIn: number | null }) {
  const router = useRouter();

  useEffect(() => {
    const arrived = performance.now();
    let timer: ReturnType<typeof setTimeout>;

    // A backgrounded tab is nobody watching. Refreshing it burns the phone's
    // battery and our upstream quota to redraw pixels no one can see.
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };

    const schedule = () => {
      const elapsed = (performance.now() - arrived) / 1000;
      timer = setTimeout(() => {
        refresh();
        schedule();
      }, nextPoll(liveIn, elapsed, POLL) * 1000);
    };
    schedule();

    // Coming back to the tab should show the current score immediately rather
    // than whatever it froze on, and then up to a full interval of nothing.
    document.addEventListener("visibilitychange", refresh);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, liveIn]);

  return null;
}
