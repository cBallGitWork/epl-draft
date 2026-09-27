// Where the league's matchups live, so every link to one is built the same way.

/** Every pairing this round. */
export const MATCHUPS = "/league/matchups";

/** One team's matchup, at a named round and on a named view when there are ones. */
export function matchupHref(teamId: string, gameweek?: number, view?: string): string {
  const query = new URLSearchParams();
  if (gameweek !== undefined) query.set("gw", String(gameweek));
  if (view !== undefined) query.set("view", view);
  const search = query.toString();
  return search === "" ? `${MATCHUPS}/${teamId}` : `${MATCHUPS}/${teamId}?${search}`;
}
