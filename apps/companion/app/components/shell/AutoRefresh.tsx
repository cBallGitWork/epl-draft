"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { nextPoll } from "./cadence";
import { POLL } from "../../config";

// Asks the server for a fresh render on a timer; `revalidate` never pushes to an open page.
// The rate is set here from `liveIn`, not on the server, so a tab opened before kickoff wakes at kickoff.
// It also fetches the rail's tabs ahead (`aheadOf`), so a tap draws at once and is as fresh as this page.

/** The page's data, not just its route, as `<Link prefetch>` would fetch it. */
const FULL = { kind: "full" } as NonNullable<Parameters<ReturnType<typeof useRouter>["prefetch"]>[1]>;

export default function AutoRefresh({
  liveIn,
  ahead,
}: {
  liveIn: number | null;
  /** Fetched on every tick, and once when the app opens. */
  ahead: { each: readonly string[]; once: readonly string[] };
}) {
  const router = useRouter();
  // Strings, so new arrays of the same tabs on every render do not restart the clock.
  const each = ahead.each.join(" ");
  const once = ahead.once.join(" ");
  // `liveIn` counts down to kickoff, so the effect re-runs on each refresh; the heavy tabs are fetched only the first time.
  const fetchedOnce = useRef(false);

  useEffect(() => {
    const arrived = performance.now();
    let timer: ReturnType<typeof setTimeout>;

    const warm = (tabs: string) => {
      for (const href of tabs.split(" ")) if (href !== "" && href !== location.pathname) router.prefetch(href, FULL);
    };
    const opened = () => {
      warm(fetchedOnce.current ? each : `${each} ${once}`);
      fetchedOnce.current = true;
    };

    // A hidden tab is skipped: refreshing it costs battery and upstream quota.
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
      warm(each);
    };

    const schedule = () => {
      const elapsed = (performance.now() - arrived) / 1000;
      timer = setTimeout(() => {
        refresh();
        schedule();
      }, nextPoll(liveIn, elapsed, POLL) * 1000);
    };
    schedule();

    // The first fetch waits for the page's own load, so the tabs never compete with what is on screen.
    if (document.readyState === "complete") opened();
    else window.addEventListener("load", opened, { once: true });

    // Returning to the tab refreshes at once rather than waiting out the interval.
    document.addEventListener("visibilitychange", refresh);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("load", opened);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, liveIn, each, once]);

  return null;
}
