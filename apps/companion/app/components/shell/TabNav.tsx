"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LeagueCrest from "./LeagueCrest";

// How the app is actually divided, made visible. One component in two shapes: a
// thumb-reachable bar along the bottom of a phone, a masthead row across the top
// of a desktop. The same tabs, the same route ownership, the same markup —
// splitting it into two components would mean two copies of the table below, and
// the copy that is not on the phone is the one that would rot.
//
// It sits before <main> in the DOM so the desktop bar can be sticky at the top
// in normal flow. On a phone it is fixed to the bottom, which takes it out of
// flow, so document order costs nothing there.
//
// Client only because the current section has to be known, and `usePathname` is
// the only way to know it. Nothing else here is interactive — the links are
// links, and the bar renders identically on the server.

/** Each tab owns a set of routes, not just the one it links to: a manager
 *  reading a squad or a past gameweek is still in that section, and a tab bar
 *  that goes blank as soon as you tap into a detail page has stopped saying
 *  where you are. */
const TABS = [
  { href: "/league", label: "League", routes: ["/league"] },
  { href: "/squad", label: "Squads", routes: ["/squad"] },
  { href: "/matchday", label: "Matchday", routes: ["/matchday", "/gw"], onlyDuringGameweek: true },
  { href: "/players", label: "Players", routes: ["/players"] },
];

function owns(routes: string[], pathname: string): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/** `matchday` says whether there is football on. The tab is a section of the app
 *  that only exists while a gameweek is running — between rounds it is a live
 *  view of nothing, and a tab bar that offers it is lying about what is there. */
export default function TabNav({ matchday }: { matchday: boolean }) {
  const pathname = usePathname();
  const tabs = TABS.filter((tab) => matchday || !tab.onlyDuringGameweek);

  return (
    <nav
      aria-label="Sections"
      // Its own safe-area padding rather than the body's: a fixed element is
      // positioned against the viewport, so the home indicator would otherwise
      // sit on top of the labels. Above `md` it is in flow at the top instead,
      // where neither the inset nor the fixed positioning applies.
      className="fixed inset-x-0 bottom-0 z-[50] border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:sticky md:inset-x-auto md:bottom-auto md:top-0 md:border-b md:border-t-0 md:pb-0"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 md:px-4">
        <Link href="/" aria-label="Home" className="hidden shrink-0 py-2 md:block">
          <LeagueCrest variant="mark" height={26} />
        </Link>

        {/* Columns come from the data rather than a literal restating its
            length, so a fifth tab does not silently wrap the bar. Inert above
            `md`, where the list is a flex row. */}
        <ul
          className="grid w-full md:flex md:w-auto md:gap-1"
          style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
        >
          {tabs.map((tab) => {
            const here = owns(tab.routes, pathname);
            return (
              <li key={tab.href} className="contents">
                <Link
                  href={tab.href}
                  aria-current={here ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-1 border-t-2 text-2xs font-semibold uppercase tracking-widest md:border-b-2 md:border-t-0 md:px-4 ${
                    here ? "border-accent text-ink" : "border-transparent text-faint hover:text-muted"
                  }`}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
