import TabStrip from "../components/shell/TabStrip";

// The Premiership section's own views, and how you get between them.
//
// **Four, which is the width `cm9900/24.jpg` runs.** The reference shot for this
// whole section is a Premier League table screen, and its strip is `Table ·
// Results · Fixtures · Schedule` with a foot row of five underneath. Ours drops
// Schedule — a fixture list already IS the schedule when the competition is the
// one being played, and CM needed both because its Schedule screen is a
// calendar of the manager's own season — and spends the slot on Team Stats,
// which the game files downstairs.
//
// **There is no foot row yet, and that is a decision rather than an omission.**
// Player Stats belongs there, beside Team Stats, exactly as the game has it. It
// is deferred (Craig, 2 Sep: "leave the player stats bit for now, that's a full
// section on its own"), and a foot row of ONE is the stray button under a panel
// that `league/SectionNav` already recorded him rejecting. The row comes back
// with the second entry in it.
//
// A server component for `SectionNav`'s reason: each page here knows which one
// it is, so passing that in costs a prop and saves shipping a component to the
// phone to work out what the URL already says.

const TABS = [
  { href: "/prem", label: "Table", key: "table" },
  // Results before Fixtures, which is the game's order and the right one: a
  // reader arriving on a Monday wants what happened, and one arriving on a
  // Friday wants what is next. Monday is the commoner arrival.
  { href: "/prem/results", label: "Results", key: "results" },
  { href: "/prem/fixtures", label: "Fixtures", key: "fixtures" },
  { href: "/prem/team-stats", label: "Team Stats", key: "teamStats" },
  // **The pool, which came off the navigation bar on 5 Sep 2026 and had to land
  // somewhere.** `/players` is the PREMIER LEAGUE's players priced by our
  // league's scoring, and you reach a thing through the competition it belongs
  // to — `shell/sections.ts` makes that argument about squads and clubs and it
  // holds here. It is the League strip's `Player Stats` too, so the pool has two
  // ways in rather than the one plate it lost.
  //
  // **It leaves the section, exactly as it does on the League's strip**, so no
  // tab draws as current when you are on it: `PremSection` has no `players` key
  // and a page there is no longer in this section. That is the difference
  // between a tab and a way OUT, and both strips now carry the same one.
  { href: "/players", label: "Players", key: "players" },
] as const;

/** Which tab a page IS. `players` is deliberately not one: that entry leaves the
 *  section (see the note on it), so no page passes it and no tab draws as
 *  current when a reader is on the pool. */
export type PremSection = Exclude<(typeof TABS)[number]["key"], "players">;

/** These routes, found by KEY rather than by position.
 *
 *  They were `TABS[0]`, `TABS[1]`, `TABS[2]` and `TABS[3]`, and the sibling
 *  strip proved that dangerous on 5 Sep 2026: inserting one tab into
 *  `league/SectionNav` silently repointed `PLAYERS` at a different screen, with
 *  nothing failing to say so. A position in an array is not a name, and this
 *  table is ordered by what reads well on a strip — Results before Fixtures, on
 *  an argument about which day a reader arrives.
 *
 *  `at()` throws rather than returning undefined, so a key that stops existing
 *  is a build that stops rather than a link that quietly moves. */
function at(key: (typeof TABS)[number]["key"]): string {
  const found = TABS.find((tab) => tab.key === key);
  if (found === undefined) throw new Error(`no prem tab keyed ${key}`);
  return found.href;
}

/** The section's own front door. Two consumers spell it: the default sort, which
 *  is the table's address with no query on it, and a club page's way back out. */
export const TABLE = at("table");

/** The board's own route: a route spelled in three files is a route that can be
 *  renamed in two of them. */
export const TEAM_STATS = at("teamStats");

/* `RESULTS` and `FIXTURES` were here, named `at("results")` and `at("fixtures")`
   for a consumer the docblock described as "a match page's way out ... whichever
   one that match is actually on". That way out lived in `MatchFoot`, which no
   longer exists, and nothing downstairs ever spelled either route — so they were
   two exported constants with no importer, kept alive by a comment describing a
   screen. Removed 11 Sep 2026. `at()` still derives both from `TABS`, so a
   future way out is one line rather than a new string. */

export default function PremNav({ current }: { current: PremSection }) {
  // `word` and not `phrase`: measured at 390, where a 74px plate sets "Team
  // Stats" on two lines at 11px and on one at 9px. The plates stay level either
  // way — flex stretches them — but a strip with one label wrapped and three not
  // is the unevenness `TeamTabs` records the same choice for.
  return <TabStrip label="Premiership views" tabs={TABS} current={current} labels="word" />;
}
