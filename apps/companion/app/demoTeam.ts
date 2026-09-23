/** The team the environment lends a reader with no code (`FANTRAX_DEMO_TEAM_ID`), only when it is
 *  one of the served league's teams. That check is what makes the swap safe: a test league's
 *  demo id names nobody in the real league, so it lends nothing without anyone unsetting it. */
export function lentTeam(teams: readonly { teamId: string }[], demo: string | null): string | null {
  return demo !== null && teams.some((team) => team.teamId === demo) ? demo : null;
}
