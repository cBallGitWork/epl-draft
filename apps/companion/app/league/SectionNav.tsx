import TabStrip from "../components/shell/TabStrip";

// The League tab's own views, and how you get between them.
//
// A server component, unlike the section rail: the rail has to work out where it
// is from the URL because any route in the app can render it, but each page here
// knows which one it is. Passing that in costs a prop and saves shipping another
// component to the phone.
//
// The plates themselves are `shell/TabStrip` now — this file is the list and the
// argument for it, which is the half worth keeping in the section.

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

/** The two routes that build their own query strings, named once.
 *
 *  Both were written out three or four times each — in a `HERE` constant, in a
 *  sort link, in a group link, in a category link — and `SECTIONS` above was
 *  already the place the app declares where a section lives. A route spelled in
 *  five files is a route that can be renamed in four of them.
 *
 *  Read off `SECTIONS` rather than re-typed, so the tab strip and the links
 *  cannot disagree about where a page is. */
export const TEAM_STATS = SECTIONS[4].href;
export const PLAYERS = SECTIONS[3].href;

/** The five tabs, plus the one section a route can BE on without being in the
 *  strip.
 *
 *  **Matchups is that one.** It has a board and a page per pairing, so it stays
 *  navigable; it is not a tab because Craig named the five that belong there and
 *  this was not one. It had a foot ROW of its own for a day and lost it (Craig,
 *  1 Sep: "ditch matchups row underneath") — one entry is a stray button under a
 *  panel, not a bar. CM's own second row is five wide, and when this is three or
 *  four it earns the row back.
 *
 *  A bare string literal and not a `FOOT` array, which is what this was: the
 *  array had lost its row and then its last importer, so it survived only to
 *  have `typeof` taken of it — an `href` and a `label` nothing read, kept alive
 *  to spell one word. The word is here and the reasoning came with it. */
export type LeagueSection = (typeof SECTIONS)[number]["key"] | "matchups";

export default function SectionNav({ current }: { current: LeagueSection }) {
  // Matchups is a `LeagueSection` and is not in the strip, so on that route no
  // plate is current — the same state `/players` puts the strip in. Narrowed
  // here rather than in `TabStrip`, which should not have to know that this
  // section has entries its own strip does not list.
  const here = SECTIONS.find((section) => section.key === current)?.key ?? null;
  return <TabStrip label="League views" tabs={SECTIONS} current={here} />;
}
