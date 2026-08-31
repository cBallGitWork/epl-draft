import Link from "next/link";

// The League tab holds three views of the same competition, and this is how you
// get between them.
//
// A server component, unlike the section rail: the rail has to work out where it
// is from the URL because any route in the app can render it, but there are
// exactly three pages here and each of them knows which one it is. Passing that
// in costs a prop and saves shipping another component to the phone.
//
// **CM's tabs, which are bevelled and butt against each other.** They were
// rounded pills with a gap between them, which is a modern web tab and reads as
// one wherever it appears. The active one is drawn PRESSED with the accent on
// its label — the same object saying both "this is a control" and "this is the
// one you are on", which is how the game said it and is why there is no separate
// active border to keep the strip from shifting.

/** **Four, which is what the strip holds in `cm9900/24.jpg`** — the game runs
 *  `Table · Results · Fixtures · Schedule` edge to edge, and ours ran three.
 *  Craig, 31 Aug: the blue buttons, and Matchups is already one of them, so it
 *  becomes four.
 *
 *  `Results` is the added one and it is CM's own second tab. It is also the only
 *  candidate that needed no new provider read: `getSeasonResults` is already
 *  cached for the form guide on the table, and the rounds it files against are
 *  `getSchedule`'s. Team Stats was the other name on Craig's list and is
 *  deliberately not here yet — `getStandings` carries `streak` and `wwOrder`
 *  beyond what the table prints and nothing else, so the screen would open on a
 *  near-copy of the table. Deferred until it has a shape (Craig's call, same
 *  day). */
const SECTIONS = [
  { href: "/league", label: "Table", key: "table" },
  { href: "/league/schedule", label: "Schedule", key: "schedule" },
  { href: "/league/results", label: "Results", key: "results" },
  { href: "/league/matchups", label: "Matchups", key: "matchups" },
] as const;

export type LeagueSection = (typeof SECTIONS)[number]["key"];

export default function SectionNav({ current }: { current: LeagueSection }) {
  // The strip fills the row. CM's four tabs run edge to edge across the whole
  // content width (`cm9900/24.jpg`, `25.jpg`) — a tab strip is a bar, and three
  // plates hugging the left are three buttons.
  return (
    <nav aria-label="League views" className="flex">
      {SECTIONS.map((section) => {
        const here = section.key === current;
        return (
          <Link
            key={section.key}
            href={section.href}
            aria-current={here ? "page" : undefined}
            // Red is the brand and the live signal and never a statement about
            // where you are, which is why the accent carries this and the
            // league's own colour does not.
            className="cm-tab flex flex-1 items-center justify-center px-3 text-2xs font-bold uppercase lg:text-sm"
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
