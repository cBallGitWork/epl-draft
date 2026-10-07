import type { LeagueTeam } from "@epl/core";
import { DASH } from "@epl/core";

// Team ids to team names for the pages that print a column (a column returns ids); a team we cannot name is `—`.

export function named(teams: readonly LeagueTeam[]): (teamId: string) => string {
  const names = new Map(teams.map((team) => [team.teamId, team.name]));
  return (teamId) => names.get(teamId) ?? DASH;
}
