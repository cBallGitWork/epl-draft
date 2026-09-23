// The Premiership section's subject routes, named once and in one place.
//
// **Why they are not in `PremNav`.** That file declares the section's tab strip,
// and `club/[code]/match.ts` had already broken `MATCH` out of it on the stated
// rule that "a route that is not on it does not belong in that file's list".
// `CLUB` and `PLAYER` are not tabs either — they are the section's subjects — so
// they were living in the strip's file against the same rule, and the split left
// two homes for three constants of one kind.
//
// **And the split had a cost beyond tidiness.** `PremNav` is a component module:
// anything importing a route off it pulls the strip and `TabStrip` into its
// graph. `components/shell/sections.ts` needs two of these and is imported by
// `Rail` and `FootRow`, both `"use client"` — so reaching for `CLUB` there would
// have shipped a tab strip to the browser to spell twelve characters. Hence a
// module with no JSX in it, which is the same discipline `sections.ts` keeps and
// for the same reason.
//
// The rule these were written under stands and is why they are still one line
// each: a route spelled in five files is a route that can be renamed in four of
// them.

/** The competition itself — the table. */
export const PREM = "/prem";

/** The route the club pages hang off. */
export const CLUB = "/prem/club";

/** The footballer's own page, keyed on FPL's season-stable code. */
export const PLAYER = "/prem/player";

/** One match, keyed on the fixture id. */
export const MATCH = "/prem/match";
