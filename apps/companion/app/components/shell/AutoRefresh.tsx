"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { nextPoll } from "./cadence";
import { POLL } from "../../config";

// Asks the server for a fresh render on a timer; `revalidate` never pushes to an open page.
// The rate is set here from `liveIn`, not on the server, so a tab opened before kickoff wakes at kickoff.

export default function AutoRefresh({ liveIn }: { liveIn: number | null }) {
  const router = useRouter();

  useEffect(() => {
    const arrived = performance.now();
    let timer: ReturnType<typeof setTimeout>;

    // A hidden tab is skipped: refreshing it costs battery and upstream quota.
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

    // Returning to the tab refreshes at once rather than waiting out the interval.
    document.addEventListener("visibilitychange", refresh);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, liveIn]);

  return null;
}
