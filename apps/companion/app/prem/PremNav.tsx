import TabStrip from "../components/shell/TabStrip";

// The Premiership section's own views, after `cm9900/24.jpg`'s strip with Schedule dropped (a fixture list is one).
// Player Stats, deferred on 2 Sep, arrived on 1 Oct 2026 as the Data tab's lists rather than a foot row of one.
// A server component: each page knows which view it is, so the strip ships no script to work it out.

const TABS = [
  { href: "/prem", label: "Table", key: "table" },
  // Results before Fixtures, which is the game's order and the right one: a
  // reader arriving on a Monday wants what happened, and one arriving on a
  // Friday wants what is next. Monday is the commoner arrival.
  { href: "/prem/results", label: "Results", key: "results" },
  { href: "/prem/fixtures", label: "Fixtures", key: "fixtures" },
  { href: "/prem/team-stats", label: "Team Stats", key: "teamStats" },
  // The season's leaders as lists, a view of this section since 1 Oct 2026; it led out to the pool before.
  { href: "/prem/data", label: "Data", key: "data" },
] as const;

/** Which tab a page IS. */
export type PremSection = (typeof TABS)[number]["key"];

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

/** The leaders' lists, which the list picker and each list's Top 50 plate spell. */
export const DATA = at("data");

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
