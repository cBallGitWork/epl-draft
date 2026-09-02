import { notFound, redirect } from "next/navigation";
import { getLeagueSquads } from "../../squads";
import { planningRound } from "../../round";

// Which team a `/squad/[teamId]` screen is about.
//
// Five routes now open on the same question — who is this, and does he exist —
// and answering it five times is five chances to answer it differently. The
// squad tab itself does not use this: it needs the whole `ReadableSquads` for
// the gate, the join and the scoreboard, so it keeps its own read and this
// would only be a second one. The four content tabs need the name and the id
// and nothing else.
//
// The three outcomes are the squad tab's, deliberately: `undrafted` is a 404
// because there is no such screen yet, `unavailable` redirects to the index
// where the outage is described rather than hidden behind a status code, and an
// unknown id is an ordinary 404.

export interface TeamIdentity {
  teamId: string;
  teamName: string;
}

export async function teamOr404(teamId: string): Promise<TeamIdentity> {
  return (await leagueTeams(teamId)).team;
}

/** The same read, plus every OTHER team's name by id.
 *
 *  The transfers ledger needs both: whose screen this is, and who he traded
 *  with. Two calls would be two reads of the same cached payload — and the names
 *  are already sitting in it, so the second one is free. */
export async function leagueTeams(
  teamId: string,
): Promise<{ team: TeamIdentity; names: Record<string, string> }> {
  const squads = await getLeagueSquads(await planningRound());
  if ("undrafted" in squads) notFound();
  if ("unavailable" in squads) redirect("/squad");

  const team = squads.period.teams.find((t) => t.teamId === teamId);
  if (!team) notFound();

  // A record rather than a `Map`: this crosses to a client component and the
  // boundary serialises through JSON, where a `Map` arrives as `{}`.
  const names: Record<string, string> = {};
  for (const entry of squads.period.teams) names[entry.teamId] = entry.teamName;

  return { team: { teamId: team.teamId, teamName: team.teamName }, names };
}
