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

/** The routes that build their own query strings, named once.
 *
 *  Both were written out three or four times each — in a `HERE` constant, in a
 *  sort link, in a group link, in a category link — and `SECTIONS` above was
 *  already the place the app declares where a section lives. A route spelled in
 *  five files is a route that can be renamed in four of them.
 *
 *  **Found by KEY and not by index**, which is the change. They were
 *  `SECTIONS[3]` and `SECTIONS[4]`, and inserting News at position 3 on 5 Sep
 *  2026 silently repointed `PLAYERS` at the inbox — every link in the pool would
 *  have gone to the wrong screen, with nothing failing to say so. A position in
 *  an array is not a name, and this table is ordered by what reads well on a
 *  strip. `at()` throws rather than returning undefined, so a key that stops
 *  existing is a build that stops rather than a link that quietly moves. */
function at(key: (typeof SECTIONS)[number]["key"]): string {
  const found = SECTIONS.find((section) => section.key === key);
  if (found === undefined) throw new Error(`no league section keyed ${key}`);
  return found.href;
}

export const TEAM_STATS = at("teamStats");
export const PLAYERS = at("players");

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
  // **`labels="word"`, and it is a measured fix rather than a preference.** At
  // the default 11px the fifth plate ran 34px past a 390 viewport — measured
  // through CDP on `/league/matchups/[teamId]`, the one route that put a wide
  // panel under this strip. `docs/ui/prem.md` records the sibling strip hitting
  // the same wall on the same label: "at 11px 'Team Stats' takes two lines in a
  // 76px plate at 390 while its three neighbours take one". That strip runs
  // four tabs and this one runs five, so it was always going to bite here
  // first.
  return <TabStrip label="League views" tabs={SECTIONS} current={here} labels="word" />;
}
