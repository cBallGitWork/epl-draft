import { LEAGUE } from "../league/routes";

// A team's routes, named once, in a module the client rail can import without the league read.

/** The route a team's five screens hang off. */
export const SQUAD = "/squad";

/** One team's squad, at a named round when there is one. */
export function teamHref(teamId: string, gameweek?: number): string {
  return gameweek === undefined ? `${SQUAD}/${teamId}` : `${SQUAD}/${teamId}?gw=${gameweek}`;
}

/** The segment meaning the reader's own team: the URL says whose screen it is, so the rail lights My Team without a
 *  cookie read. Two letters, so never a Fantrax id. */
export const OWN = "me";

/** The reader's own team. */
export const MY_TEAM = `${SQUAD}/${OWN}`;

/** Where a squad's back plate goes with no history: the league table for a rival, none on your own team's tab. */
export function teamBack(slug: string): string | undefined {
  return slug === OWN ? undefined : LEAGUE;
}
