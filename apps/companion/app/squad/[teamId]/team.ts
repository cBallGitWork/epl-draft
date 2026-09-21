import { notFound, redirect } from "next/navigation";
import type { RosteredTeam } from "@epl/core";
import { getLeagueSquads, readableOr404 } from "../../squads";
import { planningRound } from "../../round";
import { myTeamId } from "../../session";
import { OWN, SQUAD } from "../routes";

// Which team a `/squad/[teamId]` screen is about.
//
// Five routes now open on the same question — who is this, and does he exist —
// and answering it five times is five chances to answer it differently. The
// squad tab itself does not use this: it needs the whole `ReadableSquads` for
// the gate, the join and the scoreboard, so it keeps its own read and this
// would only be a second one. The four content tabs need the name and the id
// and nothing else.
//
// What the two refusals mean is `readableOr404`'s now — this file argued it in
// prose while four files made the decision by hand. What is left here are the
// two answers that are this route's own: an unknown id is an ordinary 404, and
// `me` for a reader who is not signed in goes to the index, where the code goes
// in.

export interface TeamIdentity {
  teamId: string;
  teamName: string;
  /** What the URL called him, which is his id for nine teams in ten and `me` on
   *  the reader's own front door.
   *
   *  The tab strip builds its five hrefs from this rather than from `teamId`, so
   *  a manager who came in through My Team stays inside that section as he moves
   *  across Transfers, Match, Fixtures and Stats. Following the id instead would
   *  drop him onto the same screens under a pathname the rail no longer
   *  recognises — navigation going blank one tap in, which is the failure
   *  `sections.ts` gives its `routes` field to avoid. */
  slug: string;
}

export async function teamOr404(slug: string): Promise<TeamIdentity> {
  return (await leagueTeams(slug)).team;
}

/** A team as its own screens want it: the id for the reads, the name for the
 *  bar, and the slug the URL used for the tabs.
 *
 *  Extracted at three — `leagueTeams` below and the two tabs that keep their own
 *  roster read build the same three fields off the same rostered team. */
export function identify(team: { teamId: string; teamName: string }, slug: string): TeamIdentity {
  return { teamId: team.teamId, teamName: team.teamName, slug };
}

/** Which team a URL segment means, and whether it is the reader's own.
 *
 *  Extracted at three: `leagueTeams` below, the squad tab and the match tab each
 *  read their own roster and each had to answer this for itself. The two that
 *  ask for `mine` want it against the same list they resolved from, which is why
 *  it comes back with the id rather than being asked for again.
 *
 *  Resolved against the ROSTERED teams, which is `myTeamId`'s own guarantee: a
 *  cookie signed for the rehearsal league simply stops naming anybody on swap
 *  day, and its holder is sent to the index to sign in again rather than 404ing
 *  on a team that does exist somewhere else. */
export async function whoseTeam(
  slug: string,
  teams: readonly { teamId: string }[],
): Promise<{ teamId: string; mine: boolean }> {
  const own = await myTeamId(teams);
  const teamId = slug === OWN ? own : slug;
  if (teamId === null) redirect(SQUAD);
  return { teamId, mine: own === teamId };
}

/** The same read, plus every OTHER team's name by id.
 *
 *  The transfers ledger needs both: whose screen this is, and who he traded
 *  with. Two calls would be two reads of the same cached payload — and the names
 *  are already sitting in it, so the second one is free. */
export async function leagueTeams(
  slug: string,
): Promise<{ team: TeamIdentity; names: Record<string, string>; squad: RosteredTeam }> {
  const squads = readableOr404(await getLeagueSquads(await planningRound()), SQUAD);

  const { teamId } = await whoseTeam(slug, squads.period.teams);

  const team = squads.period.teams.find((t) => t.teamId === teamId);
  if (!team) notFound();

  // A record rather than a `Map`: this crosses to a client component and the
  // boundary serialises through JSON, where a `Map` arrives as `{}`.
  const names: Record<string, string> = {};
  for (const entry of squads.period.teams) names[entry.teamId] = entry.teamName;

  return { team: identify(team, slug), names, squad: team };
}
