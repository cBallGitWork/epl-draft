import type { LeagueSection } from "./league/SectionNav";
import type { PremSection } from "./prem/PremNav";

// What the yellow caption on each screen says.
//
// Craig, 5 Sep 2026: *"news needs the proper CM title like the rest of the app
// (make this a rule/get all the titles into a shared variable for the UI)."*
// This is the variable; DESIGN §2 is the rule.
//
// **The rule, said once: a screen has a SUBJECT and a VIEW, and they are two
// boxes.** Championship Manager never mixes them. `cm9900/24.jpg` heads the bar
// `English Premier Division` and captions the panel `League Table`; `25.jpg`
// heads it `Everton` and captions the panel below. The bar is what the screen is
// ABOUT — a competition, a club, a manager, a footballer — and the yellow
// caption is which of that subject's views you are looking at.
//
// The news screen broke it: it put `TEST2 NEWS` on the bar and had no caption,
// which is the two boxes collapsed into one. CM's own news bar reads `Mike Paul
// News` and does the same thing, and it is the one place in the library that
// does — the app's rule wins over one screen of the game's.
//
// **Why a table and not a string at each call site**, counted 5 Sep 2026 before
// extracting (CODE_RULES §1 wants the number): `League Table` was written at 7
// sites, `Matchups` and `Results` at 6, `Schedule`, `Team Stats` and `Fixtures`
// at 5. Every screen writes it two or three times over — the page, its loading
// skeleton, and each early-return branch for a Fantrax that would not answer —
// and one of those going stale is a screen that renames itself while it loads.
//
// **Keyed on the section a shell ALREADY knows it is**, which is what stops this
// being a second bag of strings to keep in step with the nav. `LeagueShell` and
// `PremShell` take `current` and look the caption up themselves, so a page no
// longer passes a title at all and the two can never disagree.
//
// **A caption is not a tab label**, which is why this is a separate table from
// `SECTIONS` and `TABS` rather than a field on them: the tab reads `Table` and
// the caption reads `League Table`. A strip is short because it is a row of
// plates; a caption is the screen's name.

/** Our league's views. */
export const LEAGUE_CAPTION: Record<LeagueSection, string> = {
  table: "League Table",
  schedule: "Schedule",
  results: "Results",
  players: "Player Stats",
  teamStats: "Team Stats",
  // Not a tab (`SectionNav` records why), but a section a route can BE on.
  matchups: "Matchups",
};

/** The head-to-head, which is a route under Matchups rather than a section of
 *  its own — so it needs a caption the section's own name would get wrong. */
export const HEAD_TO_HEAD = "Head-to-head";

/** The real competition's views. */
export const PREM_CAPTION: Record<PremSection, string> = {
  table: "League Table",
  results: "Results",
  fixtures: "Fixtures",
  teamStats: "Team Stats",
};

/** The manager's inbox. Its own section, so it has no shell to look it up —
 *  named here anyway, because the point of this file is that a caption is never
 *  a literal at a call site. */
export const NEWS = "News";
