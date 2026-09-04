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
] as const;

export type PremSection = (typeof TABS)[number]["key"];

/** The section's own front door, read off `TABS` rather than re-typed. Two
 *  consumers spell it: the default sort, which is the table's address with no
 *  query on it, and a club page's way back out. */
export const TABLE = TABS[0].href;

/** The board's own route, read off `TABS` rather than re-typed: a route spelled
 *  in three files is a route that can be renamed in two of them. */
export const TEAM_STATS = TABS[3].href;

/** The two round lists, read off `TABS` for `TABLE`'s reason. A match page's way
 *  out is whichever one that match is actually on — a finished fixture is not on
 *  the fixtures page and an upcoming one is not among the results — so both are
 *  spelled here rather than a third and fourth time downstairs. */
export const RESULTS = TABS[1].href;
export const FIXTURES = TABS[2].href;

/** The route the club pages hang off, named once. A route spelled in five files
 *  is a route that can be renamed in four of them — `SectionNav` records the
 *  same decision for `/league`'s two query-string routes. */
export const CLUB = "/prem/club";

/** The footballer's own page, keyed on FPL's season-stable code. Named here
 *  beside `CLUB` for the same reason: a squad list, a leaders board and the
 *  player page's own way back all spell it. */
export const PLAYER = "/prem/player";

export default function PremNav({ current }: { current: PremSection }) {
  // `word` and not `phrase`: measured at 390, where a 74px plate sets "Team
  // Stats" on two lines at 11px and on one at 9px. The plates stay level either
  // way — flex stretches them — but a strip with one label wrapped and three not
  // is the unevenness `TeamTabs` records the same choice for.
  return <TabStrip label="Premiership views" tabs={TABS} current={current} labels="word" />;
}
