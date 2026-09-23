// Where the league's matchups live, so every link to one is built the same way.

/** Every pairing this round. */
export const MATCHUPS = "/league/matchups";

/** One team's matchup, at a named round when there is one. */
export function matchupHref(teamId: string, gameweek?: number): string {
  return gameweek === undefined ? `${MATCHUPS}/${teamId}` : `${MATCHUPS}/${teamId}?gw=${gameweek}`;
}
