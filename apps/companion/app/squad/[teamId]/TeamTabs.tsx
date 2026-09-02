import Link from "next/link";

// One team's own screens, and how you get between them.
//
// **Championship Manager's club screen, which is five tabs and not one page.**
// `cm9900/25.jpg` runs `Squad · Transfers · Next Match · Fixtures · Finances &
// Info` across the top of Everton, and `cm0102/07.jpg` runs the identical set
// two releases later with `General Info` in the last slot — so this is the
// reference's own spine rather than a shape invented for us. Ours drops the
// finances, which a fantasy team does not have, and spends the slot on Stats.
//
// A server component for `SectionNav`'s reason: each page here knows which one
// it is, so passing that in costs a prop and saves shipping a component to the
// phone to work out what the URL already says.
//
// **The League strip is not replaced, because it was never here.** `/squad` and
// `/squad/[teamId]` render no `SectionNav` at all — the rail is the only thing
// that has ever marked this section, and it goes on doing it: `owns()` prefix-
// matches `/squad/`, so every tab below still lights Squads in the rail.

/** The five, declared once.
 *
 *  `href` is built per team rather than stored, because every one of these is a
 *  route under a team that is only known at render. `key` is what a page passes
 *  back to say which it is, on `SectionNav`'s pattern — a string the type system
 *  checks rather than a pathname compared at runtime. */
const TABS = [
  { segment: "", label: "Squad", key: "squad" },
  { segment: "/transfers", label: "Transfers", key: "transfers" },
  // "Match", not "Next Match". Two words wrap to two lines at 390 while the
  // other four sit on one, and a strip whose plates disagree about their height
  // is not a strip. CM's own tabs are one word wherever it can manage it
  // (`Squad`, `Transfers`, `Fixtures`) and the screen it heads says "Next Match"
  // in the caption box under the strip, where there is room for it.
  { segment: "/next", label: "Match", key: "next" },
  { segment: "/fixtures", label: "Fixtures", key: "fixtures" },
  { segment: "/stats", label: "Stats", key: "stats" },
] as const;

export type TeamTab = (typeof TABS)[number]["key"];

export default function TeamTabs({
  teamId,
  current,
  /** Tabs with nothing behind them for THIS team — a side that has made no
   *  transactions, a period with no pairing. Named by key rather than counted
   *  here, because whether a tab is empty is a question about data and this
   *  file has none.
   *
   *  **Greyed and still a link, never hidden.** `cm0102/07.jpg` draws an
   *  unavailable `Training` in its foot row greyed out and leaves it in place:
   *  a strip that loses a plate has moved every plate after it, and a reader
   *  who tapped Transfers yesterday would find Fixtures where it was. `.cm-out`
   *  is the class the reference library has been describing since it was
   *  catalogued and this is its first call site. */
  empty = [],
}: {
  teamId: string;
  current: TeamTab;
  empty?: readonly TeamTab[];
}) {
  return (
    // The strip fills the row, as `SectionNav`'s does and as CM's does: tabs run
    // edge to edge across the whole content width (`cm9900/25.jpg`), and plates
    // hugging the left are buttons rather than a strip.
    <nav aria-label="Team views" className="flex">
      {TABS.map((tab) => {
        const here = tab.key === current;
        return (
          <Link
            key={tab.key}
            href={`/squad/${teamId}${tab.segment}`}
            aria-current={here ? "page" : undefined}
            className={`cm-tab flex flex-1 items-center justify-center px-2 text-3xs font-bold uppercase lg:text-sm ${
              // Never on the tab you are on: the accent says "selected" and
              // greying the current tab would have the strip make two claims
              // about one plate.
              !here && empty.includes(tab.key) ? "cm-out" : ""
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
