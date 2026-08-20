import { notFound } from "next/navigation";
import { type Fixture, fixtureInvolvement, hasGameweek } from "@epl/core";
import GameweekView from "../../components/football/GameweekView";
import { gameweekSnapshot } from "../../football";
import { getLeagueSquads } from "../../squads";
import { myTeamId } from "../../session";

// Any round of the season, addressable. Last week's results on Monday morning is
// the second thing anyone wants after this week's score.

// Must match `PAGE_REVALIDATE` in core config. Next analyses this statically, so
// it cannot be imported — change both together. (PLATFORM_NOTES records why.)
export const revalidate = 30;

export default async function GameweekPage({
  // Next 16 hands route params as a promise.
  params,
}: {
  params: Promise<{ gameweek: string }>;
}) {
  const { gameweek } = await params;
  const requested = Number(gameweek);

  // Reject anything that is not a plain round number before asking FPL for it —
  // "3.5" and "3abc" both coerce to something Number will happily accept.
  if (!Number.isInteger(requested)) notFound();

  // Validated against the season FPL actually published, not a hardcoded 38.
  // Read through the cached wrapper rather than the adapter directly: the cookie
  // below makes this route dynamic, so without it every arrival would refetch a
  // round of February that is the same bytes for everyone who asks.
  const snapshot = await gameweekSnapshot(requested);
  if (!hasGameweek(snapshot, requested)) notFound();

  return <GameweekView snapshot={snapshot} mine={await involvement(snapshot.fixtures)} />;
}

/** The reader's own players, per fixture, or undefined when there is no answer
 *  to give — signed out, no league, undrafted, or Fantrax silent. Every one of
 *  those is ordinary, and each returns the same nothing rather than a panel.
 *
 *  Marked from **today's** squad, including on a round played in October. That
 *  is deliberate and it is the actual Monday question — "which of these results
 *  matter to me" is asked by the man who owns those players now. A squad as it
 *  stood in week six would need `getTeamRosters?period=`, which has never been
 *  proven to serve history (PLATFORM_NOTES, still open).
 *
 *  Squad membership only. Who a manager holds is public all week; how he has
 *  arranged them is not, and nothing here reads a lineup. */
async function involvement(fixtures: readonly Fixture[]) {
  const squads = await getLeagueSquads();
  if ("undrafted" in squads || "unavailable" in squads) return undefined;

  const teamId = await myTeamId(squads.period.teams);
  const team = squads.period.teams.find((t) => t.teamId === teamId);
  return team === undefined ? undefined : fixtureInvolvement(team, fixtures);
}
