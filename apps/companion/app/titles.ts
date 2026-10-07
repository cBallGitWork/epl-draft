import type { LeagueSection } from "./league/SectionNav";
import type { PremSection } from "./prem/PremNav";

// Every screen's name, keyed on the section its shell already knows: never a literal at a call site (DESIGN §2).
// A caption is not a tab label (`Table` against `League Table`), so this is its own table.

/** Our league's views. */
export const LEAGUE_CAPTION: Record<LeagueSection, string> = {
  table: "League Table",
  schedule: "Schedule",
  results: "Results",
  teamStats: "Team Stats",
  cups: "Cups",
  scoring: "Scoring",
  // Not a tab (`SectionNav` records why), but a section a route can BE on.
  matchups: "Matchups",
};

/** The fantasy deep dive's bar; the rail says the same word. */
export const SCOUT = "Data";

/** The head-to-head, a route under Matchups rather than a section of its own. */
export const HEAD_TO_HEAD = "Head-to-head";

/** The real competition's views. */
export const PREM_CAPTION: Record<PremSection, string> = {
  table: "League Table",
  results: "Results",
  fixtures: "Fixtures",
  teamStats: "Team Stats",
  data: "Player Stats",
};

/** The word the inbox's bar ends with (`123 Mail`), and the whole bar for a reader with no team. */
export const NEWS = "Mail";

/** The page behind the phone's last tab. */
export const MORE_TITLE = "More";
