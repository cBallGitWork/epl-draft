"use client";

import Link from "next/link";
import type { LiveTie } from "./liveTie";
import { usePathname } from "next/navigation";
import { DASH } from "@epl/core";

// Your tie, in the chrome, while a ball is in the air.
//
// The one thing a manager wants on a Saturday is a number, and until this
// existed he had to be standing on the right page to see it: the pool, a
// profile, the schedule — all of them silent about the only score he cares
// about. The strip is that number wherever he is.
//
// **It stands down on the two pages that already answer the question in full**:
// the Live tab, and the front page, whose scoreboard promotes the same tie to
// full size while a ball is in the air (`gazette/Scoreboard`'s `Yours` row). A
// strip and a scoreline saying one thing on one screen is two designs for one
// fact, and the narrower would be read first — which is the wrong way round.
// Client-only for exactly this: a server layout cannot know which route
// rendered under it.
//
// Both carry their answer under the same condition that puts this here, so the
// strip is never the only thing missing from a screen.
//
// **And below `lg` it stands down everywhere** (Craig, 5 Sep 2026). The strip
// was 44px across the top of a 390px screen, the first of five bands of chrome
// above the first row of data, and the phone has somewhere better to put the
// same number: the thumb rail's Live tab carries it in its glyph's slot
// (`shell/LiveFigure`), in room the nav already occupies. The desk keeps the
// strip — it has the width, and no tab to put a score in.

const ANSWERED_IN_FULL = ["/", "/matchday"];

export default function LiveStrip({ yours, theirs, opponent, href }: LiveTie) {
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
      // Sticky, so the one number a manager wants on a Saturday follows him down
      // a desk screen. It was in flow above `md` once, where the tab bar was
      // holding the top and two stuck bars would have been a header; the rail
      // holds the side now and the top of the content column is free. Full-bleed
      // on its own ground rather than inside the page frame: it is the shell
      // speaking, not the page.
      className="sticky top-0 z-40 hidden min-h-11 items-center justify-center gap-2.5 bg-league-deep px-[var(--page-gutter)] text-cream lg:flex"
    >
      <span className="flex items-center gap-1.5 text-2xs font-bold uppercase">
        <span className="live-dot" />
        Live
      </span>
      <span className="numeric flex items-baseline gap-1.5 text-base font-bold">
        {/* Only the trailing number dims, which is the grammar every scoreline
            in the app shares. It is why this ground is the league's red taken
            down a step: on the brand red at full strength, cream is 4.94:1 and
            a dimmed cream is 2.96:1 — there is no room to dim at all. */}
        <span className={behind ? "opacity-70" : undefined}>{yours ?? DASH}</span>
        <span className="text-2xs opacity-60">v</span>
        <span className={behind ? undefined : "opacity-70"}>{theirs ?? DASH}</span>
      </span>
      <span className="min-w-0 truncate text-2xs opacity-80">{opponent}</span>
    </Link>
  );
}
