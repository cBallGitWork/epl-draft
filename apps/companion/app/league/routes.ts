// The League section's routes, named once; every link to one is built from these.

/** The league table, the section's front page. */
export const LEAGUE = "/league";

/** Every pairing this round. */
export const MATCHUPS = `${LEAGUE}/matchups`;

/** One team's matchup, at a named round and on a named view when there are ones; `vs` picks a double header's tie. */
export function matchupHref(teamId: string, gameweek?: number, view?: string, vs?: string): string {
  const query = new URLSearchParams();
  if (gameweek !== undefined) query.set("gw", String(gameweek));
  if (view !== undefined) query.set("view", view);
  if (vs !== undefined) query.set("vs", vs);
  const search = query.toString();
  return search === "" ? `${MATCHUPS}/${teamId}` : `${MATCHUPS}/${teamId}?${search}`;
}

/** A tie's board opened on one of its sides, naming the other so a double header's second tie opens on itself. */
export function tieHref(opensOn: string, gameweek: number | undefined, home: string | undefined, away: string | undefined): string {
  return matchupHref(opensOn, gameweek, undefined, opensOn === home ? away : home);
}
