import { notFound, redirect } from "next/navigation";
import type { RosteredTeam } from "@epl/core";
import { getLeagueSquads, readableOr404 } from "../../squads";
import { planningRound } from "../../round";
import { myTeamId } from "../../session";
import { OWN, SQUAD } from "../routes";

// Which team a `/squad/[teamId]` screen is about: an unknown id is a 404, and `me` with no sign-in goes to the index.

export interface TeamIdentity {
  teamId: string;
  teamName: string;
  /** What the URL called him: his id, or `me` on the front door, which the tabs follow so the rail stays lit. */
  slug: string;
}

/** A team as its screens want it: the id for reads, the name for the bar, the slug for the tabs. */
export function identify(team: { teamId: string; teamName: string }, slug: string): TeamIdentity {
  return { teamId: team.teamId, teamName: team.teamName, slug };
}

/** The rostered team a URL segment means, and whether it is the reader's own: `me` with no
 *  sign-in goes to the index, an id nobody holds is a 404. */
export async function whoseTeam<T extends { teamId: string }>(
  slug: string,
  teams: readonly T[],
): Promise<{ team: T; mine: boolean }> {
  const own = await myTeamId(teams);
  const teamId = slug === OWN ? own : slug;
  if (teamId === null) redirect(SQUAD);
  const team = teams.find((t) => t.teamId === teamId);
  if (team === undefined) notFound();
  return { team, mine: own === teamId };
}

/** The same read, plus every team's name by id, for the ledger's trades; the names are already in the payload. */
export async function leagueTeams(
  slug: string,
): Promise<{ team: TeamIdentity; names: Record<string, string>; squad: RosteredTeam }> {
  const squads = readableOr404(await getLeagueSquads(await planningRound()), SQUAD);

  const { team } = await whoseTeam(slug, squads.period.teams);

  // A record, not a Map: it crosses to a client component as JSON.
  const names: Record<string, string> = {};
  for (const entry of squads.period.teams) names[entry.teamId] = entry.teamName;

  return { team: identify(team, slug), names, squad: team };
}
