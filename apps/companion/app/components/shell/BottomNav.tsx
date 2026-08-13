"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// How the app is actually divided, made visible. Four sections and no menu: the
// reference device is a phone held one-handed, and a tab bar is the only
// navigation on that device that is always within reach of a thumb.
//
// Client only because the current section has to be known, and `usePathname` is
// the only way to know it. Nothing else here is interactive — the links are
// links, and the bar renders identically on the server.

/** Each tab owns a set of routes, not just the one it links to: a manager
 *  reading a squad or a past gameweek is still in that section, and a tab bar
 *  that goes blank as soon as you tap into a detail page has stopped saying
 *  where you are. */
const TABS = [
  { href: "/", label: "Matchday", routes: ["/", "/gw"] },
  { href: "/team", label: "Squads", routes: ["/team"] },
  { href: "/players", label: "Players", routes: ["/players"] },
  { href: "/standings", label: "League", routes: ["/standings", "/matchup"] },
];

function owns(routes: string[], pathname: string): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Sections"
      // Its own safe-area padding rather than the body's: a fixed element is
      // positioned against the viewport, so the home indicator would otherwise
      // sit on top of the labels.
      className="fixed inset-x-0 bottom-0 z-[50] border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-4">
        {TABS.map((tab) => {
          const here = owns(tab.routes, pathname);
          return (
            <li key={tab.href} className="contents">
              <Link
                href={tab.href}
                aria-current={here ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 border-t-2 text-2xs font-semibold uppercase tracking-widest ${
                  here ? "border-accent text-ink" : "border-transparent text-faint"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
