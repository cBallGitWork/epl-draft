import type { LeagueTeam } from "@epl/core";

// Team ids to team names, for the pages that print a column.
//
// **A column returns ids and never names**, because a name typed by a model
// goes stale the day somebody renames their team — so every page that renders
// filed prose does the same join before it can render anything. Three of them
// were doing it character-identically (the article page and both section
// pages) and the front page does it with one extra case, which is what makes
// this a shared helper rather than four coincidences.
//
// The absent answer is the em-dash, per DESIGN §7: a team we cannot name is a
// gap on the page, never a guess.

export function named(teams: readonly LeagueTeam[]): (teamId: string) => string {
  const names = new Map(teams.map((team) => [team.teamId, team.name]));
  return (teamId) => names.get(teamId) ?? "—";
}
