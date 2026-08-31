import Link from "next/link";

// The League tab's own views, and how you get between them.
//
// A server component, unlike the section rail: the rail has to work out where it
// is from the URL because any route in the app can render it, but each page here
// knows which one it is. Passing that in costs a prop and saves shipping another
// component to the phone.
//
// **CM's tabs, which are bevelled and butt against each other.** They were
// rounded pills with a gap between them, which is a modern web tab and reads as
// one wherever it appears. The active one is drawn PRESSED with the accent on
// its label — the same object saying both "this is a control" and "this is the
// one you are on", which is how the game said it and is why there is no separate
// active border to keep the strip from shifting.

/** **Five blue buttons** (Craig, 31 Aug): Table, Schedule, Results, Player
 *  Stats, Team Stats. `cm9900/24.jpg` runs four and a foot row of five; ours is
 *  five and a foot row of one, and the split between the two rows is Craig's
 *  rather than the game's — CM files Team Stats and Player Stats DOWNSTAIRS and
 *  he wants them up here.
 *
 *  **Matchups left the strip and did not leave the app.** It is the one entry he
 *  did not name and it is a live route with a board and a page per pairing, so
 *  it moved to the foot row rather than out of the navigation — which is CM's
 *  own second row, the one this repo has been noting the absence of since the
 *  reference library was catalogued. Said plainly because it is the one part of
 *  this that was not asked for.
 *
 *  **Player Stats leaves the section on purpose.** It points at `/players`, the
 *  pool, which is a whole screen with its own filters and sort and is already a
 *  rail destination. A second copy under `/league` would be the same table read
 *  twice; the tab is a way in from the league context, and no tab draws as
 *  current there because you are no longer in the section. */
const SECTIONS = [
  { href: "/league", label: "Table", key: "table" },
  { href: "/league/schedule", label: "Schedule", key: "schedule" },
  { href: "/league/results", label: "Results", key: "results" },
  { href: "/players", label: "Player Stats", key: "players" },
  { href: "/league/team-stats", label: "Team Stats", key: "teamStats" },
] as const;

/** Below the panel, not in the strip. One entry today; CM's own is five
 *  (`Team Stats · Player Stats · Referee Stats · Awards ▸ · History ▸`) and two
 *  of those are now upstairs. */
export const FOOT = [{ href: "/league/matchups", label: "Matchups", key: "matchups" }] as const;

export type LeagueSection =
  | (typeof SECTIONS)[number]["key"]
  | (typeof FOOT)[number]["key"];

export default function SectionNav({ current }: { current: LeagueSection }) {
  // The strip fills the row. CM's tabs run edge to edge across the whole content
  // width (`cm9900/24.jpg`, `25.jpg`) — a tab strip is a bar, and plates hugging
  // the left are buttons.
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
