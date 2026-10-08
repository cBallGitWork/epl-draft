"use client";

import Link from "@/app/components/shell/Link";
import type { LiveTie } from "./liveTie";
import { usePathname } from "next/navigation";
import { DASH } from "@epl/core";
import { SMALL_CAPS } from "@/app/desk";
import { LIVE, owns } from "./sections";

// Your tie's score across the top of a desk screen while a ball is in the air. It stands down on a phone,
// where the Live tab carries the figure, and on the front page and Live, which show the tie in full.

export default function LiveStrip({ yours, theirs, opponent, href }: LiveTie) {
  const pathname = usePathname();
  // The front page owns only itself, since every path starts with "/".
  if (pathname === "/" || owns([LIVE], pathname)) return null;

  const behind = yours !== null && theirs !== null && yours < theirs;

  return (
    <Link
      href={href}
      // Sticky and full-bleed: the shell's strip, not the page's.
      className="sticky top-0 z-40 hidden min-h-11 items-center justify-center gap-2.5 bg-league-deep px-[var(--page-gutter)] text-cream lg:flex"
    >
      <span className={`flex items-center gap-1.5 ${SMALL_CAPS}`}>
        <span className="live-dot" />
        Live
      </span>
      <span className="numeric flex items-baseline gap-1.5 text-base font-bold">
        {/* The trailing side dims, so the ground is league-deep: on full league red a dimmed cream is 2.96:1. */}
        <span className={behind ? "opacity-70" : undefined}>{yours ?? DASH}</span>
        <span className="text-2xs opacity-60">v</span>
        <span className={behind ? undefined : "opacity-70"}>{theirs ?? DASH}</span>
      </span>
      <span className="min-w-0 truncate text-2xs opacity-80">{opponent}</span>
    </Link>
  );
}
