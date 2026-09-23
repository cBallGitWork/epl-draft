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
// **The news screen is the one exception, and it is the reference's** (Craig,
// 5 Sep 2026, reversing his own ruling of that morning). CM's own inbox bar reads
// `Mike Paul News` — the two boxes collapsed into one, on the single screen in
// the library that does it — and ours reads `123 News` for the same reason: the
// news belongs to the manager, and a bar naming the competition made it the
// league's noticeboard rather than his post. So `/news` draws no caption, and
// `NEWS` below is a word the BAR ends with rather than a caption's text.
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

/** Our league's views.
 *
 *  **`players` left on 6 Sep 2026** and took its caption with it: the pool is
 *  its own section now (`players/Shell`), so its name is no longer one of the
 *  league's views to look up. */
export const LEAGUE_CAPTION: Record<LeagueSection, string> = {
  table: "League Table",
  schedule: "Schedule",
  results: "Results",
  teamStats: "Team Stats",
  // Not a tab (`SectionNav` records why), but a section a route can BE on.
  matchups: "Matchups",
};

/** The scouting section's own bar.
 *
 *  **A subject, not a view** — which is why it is a bare name here rather than an
 *  entry in a caption table. `SCOUT_CAPTION` below is the view.
 *
 *  **`Find`, which is Championship Manager's own word for this slot** — the rail
 *  in `cm9900/12.jpg`, `11.jpg` and `25.jpg` reads `Continue Game · <manager> ·
 *  Competitions · Nations & Clubs · Find · Game Options`, and Find is the entry
 *  for looking a player up. Craig, 10 Sep 2026: *"replace with something more
 *  CM"*.
 *
 *  It was "Scout" until then, and this docblock already argued the case against
 *  itself: it cited CM's `Find` as the reason "Scout" was better than "Players",
 *  which is a verb standing in for a verb the reference already had. Using the
 *  game's own word is shorter, and the reference library's rule is that a CM
 *  claim cites a numbered shot rather than a memory of one.
 *
 *  The constant keeps its name. `SCOUT` is what the section is called in this
 *  codebase — `scouting.ts`, DESIGN §9's "scouting table" — and renaming an
 *  export to match a label is how a label change becomes a hundred-file diff. */
export const SCOUT = "Find";

/** The scouting section's one view. The pool overrides it with the category the
 *  board is ranked by, exactly as `cm9900/16.jpg` captions its stat list. */
export const SCOUT_CAPTION = "Player Stats";

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

/** The manager's inbox — the word his own bar ends with (`123 Mail`; CM's reads `Mike Paul News`), and the
 *  whole bar for a reader with no team.
 *
 *  Named here rather than written at its three call sites — the page, its loading
 *  frame, and the signed-out title — for this file's own reason: a screen's name
 *  is never a literal at a call site, or one of the three renames itself while
 *  the other two do not. It stopped being a CAPTION on 5 Sep 2026; it did not
 *  stop being a name. */
export const NEWS = "Mail";

/** The page behind the phone's last tab. */
export const MORE_TITLE = "More";
