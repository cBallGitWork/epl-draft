import { LEAGUE } from "../league/routes";

// A team's routes, named once and in one place.
//
// `prem/routes.ts`'s reason applies here unchanged, and the second half of it is
// why this is a module rather than a constant on `team.ts`: that file imports
// `next/navigation` and the Fantrax read, and `components/shell/sections.ts` is
// imported by `Rail` and `ThumbRail`, both client-side. Reaching for the
// segment there would ship a league read to the browser to spell two characters.

/** The route a team's five screens hang off. */
export const SQUAD = "/squad";

/** One team's squad, at a named round when there is one. */
export function teamHref(teamId: string, gameweek?: number): string {
  return gameweek === undefined ? `${SQUAD}/${teamId}` : `${SQUAD}/${teamId}?gw=${gameweek}`;
}

/** The segment that means "whoever is holding the phone".
 *
 *  A URL rather than a redirect, and that is the whole of the front door: the
 *  rail cannot know which team is yours — it is a client component and the id is
 *  in a signed HTTP-only cookie — so a section pointing at `/squad/<your id>`
 *  would have to be resolved in the layout, which means `cookies()` above every
 *  route in the app and the paper going dynamic to light a nav plate.
 *
 *  This costs nothing instead: the pathname says whose screen it is, so `owns()`
 *  answers from the URL exactly as it does for every other section, and a rival's
 *  squad does not light a plate that says My Team.
 *
 *  Safe against a collision because Fantrax's team ids are sixteen characters of
 *  base-36 and this is two letters — `/squad/me` can never be a team. */
export const OWN = "me";

/** The reader's own team. */
export const MY_TEAM = `${SQUAD}/${OWN}`;

/** Where a squad's back plate goes with no history: the league table for a rival, none on your own team's tab. */
export function teamBack(slug: string): string | undefined {
  return slug === OWN ? undefined : LEAGUE;
}
