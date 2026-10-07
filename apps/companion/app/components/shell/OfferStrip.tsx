"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SMALL_CAPS } from "@/app/desk";
import { MAIL, isPaperRoute, owns } from "./sections";

// A trade on the table that the reader is in, across the top of every desk page at every width, until it is answered
// on Fantrax. Yellow because it is his; it stands down on the paper, whose colours are its own, and on Mail.

/** `with` is the manager across the table, or null when the league no longer names him. */
export default function OfferStrip({ with: them, href }: { with: string | null; href: string }) {
  const pathname = usePathname();
  if (isPaperRoute(pathname) || owns([MAIL], pathname)) return null;

  return (
    <Link
      href={href}
      className="flex min-h-11 items-center justify-center gap-2.5 bg-accent px-[var(--page-gutter)] text-bg"
    >
      <span className={`shrink-0 ${SMALL_CAPS}`}>Trade offer</span>
      {them === null ? null : <span className="min-w-0 truncate text-sm font-bold">{them}</span>}
    </Link>
  );
}
