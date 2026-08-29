"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Your tie, in the chrome, while a ball is in the air.
//
// The one thing a manager wants on a Saturday is a number, and until this
// existed he had to be standing on the right page to see it: the pool, a
// profile, the schedule — all of them silent about the only score he cares
// about. The strip is that number wherever he is.
//
// **It stands down on the two pages that already answer the question in full**:
// the Live tab, and the front page, whose splash prints the same tie at four
// times the size while football is on. A strip and a scoreline saying one thing
// on one screen is two designs for one fact, and the narrower would be read
// first — which is the wrong way round. Client-only for exactly this: a server
// layout cannot know which route rendered under it.
//
// Both are the pages that carry the live splash, and both carry it under the
// same condition that puts this here, so the strip is never the only thing
// missing from a screen.

const ANSWERED_IN_FULL = ["/", "/matchday"];

export default function LiveStrip({
  yours,
  theirs,
  opponent,
  href,
}: {
  /** Null is a total Fantrax did not give, and it prints as a dash. A live
   *  scoreline is the last place to invent a nought. */
  yours: number | null;
  theirs: number | null;
  opponent: string;
  href: string;
}) {
  const pathname = usePathname();
  // Exact match, or a section of one — but "/" owns only itself, since every
  // path starts with it.
  const answered = ANSWERED_IN_FULL.some(
    (route) => pathname === route || (route !== "/" && pathname.startsWith(`${route}/`)),
  );
  if (answered) return null;

  const behind = yours !== null && theirs !== null && yours < theirs;

  return (
    <Link
      href={href}
      // Sticky on a phone, where the tab bar is at the foot and the top is free;
      // in flow above `md`, where the bar is already holding the top and two
      // stuck bars would be a header. Full-bleed on its own ground rather than
      // inside the page frame: it is the shell speaking, not the page.
      className="sticky top-0 z-40 flex min-h-11 items-center justify-center gap-2.5 bg-league-deep px-[var(--page-gutter)] text-cream md:static"
    >
      <span className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-widest">
        <span className="live-dot" />
        Live
      </span>
      <span className="numeric flex items-baseline gap-1.5 text-base font-bold">
        {/* Only the trailing number dims, which is the grammar every scoreline
            in the app shares. It is why this ground is the league's red taken
            down a step: on the brand red at full strength, cream is 4.94:1 and
            a dimmed cream is 2.96:1 — there is no room to dim at all. */}
        <span className={behind ? "opacity-70" : undefined}>{yours ?? "—"}</span>
        <span className="text-2xs opacity-60">v</span>
        <span className={behind ? undefined : "opacity-70"}>{theirs ?? "—"}</span>
      </span>
      <span className="min-w-0 truncate text-2xs opacity-80">{opponent}</span>
    </Link>
  );
}
