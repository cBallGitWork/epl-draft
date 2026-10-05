import file from "../../../data/leagues/short-names.json";

// The name a screen prints for a fantasy team. Keyed by team id, so a rename on Fantrax leaves the
// full name showing rather than a stale short one; `team` in the file is for the reader only.
const SHORT: Record<string, { short: string }> = file.shortNames;

/** The short name where the league has one, else the name Fantrax sent. */
export function shortName(teamId: string, full: string): string {
  return SHORT[teamId]?.short || full;
}

/** Every `name` in a list of teams, shortened. */
export function shortTeams<T extends { teamId: string; name: string }>(teams: T[]): T[] {
  return teams.map((team) => ({ ...team, name: shortName(team.teamId, team.name) }));
}

/** Every `teamName` in a list of rows, shortened. */
export function shortTeamNames<T extends { teamId: string; teamName: string }>(rows: T[]): T[] {
  return rows.map((row) => ({ ...row, teamName: shortName(row.teamId, row.teamName) }));
}
