import type { Fixture, FootballPlayer, PlayerOwner } from "@epl/core";
import { fixtureInvolvement, owners } from "@epl/core";
import { getLeagueSquads } from "./squads";
import type { ReadableSquads } from "./squads";
import { myTeamId } from "./session";

// What our league says about a round of football: which matches the reader has a man in, and who holds each
// footballer. Squad membership only; nothing here reads a lineup.

/** Absent means no answer (signed out, no league, undrafted, Fantrax silent), and every consumer draws plain football. */
export interface Marks {
  /** His whole squad, per fixture. What marks a row as his. */
  mine?: Map<number, FootballPlayer[]>;
  /** Every rostered footballer against the squad holding him, by FPL code. */
  owners?: Map<number, PlayerOwner>;
}

/** For a page that already holds the league. */
export async function marksFor(
  squads: ReadableSquads,
  fixtures: readonly Fixture[],
): Promise<Marks> {
  const teamId = await myTeamId(squads.period.teams);
  const team = squads.period.teams.find((t) => t.teamId === teamId);
  if (team === undefined) return { owners: owners(squads.period.teams) };

  return { mine: fixtureInvolvement(team, fixtures), owners: owners(squads.period.teams) };
}

/** For a page that does not; a signed-out reader still gets `owners`. */
export async function marks(fixtures: readonly Fixture[]): Promise<Marks> {
  const squads = await getLeagueSquads();
  return "period" in squads ? marksFor(squads, fixtures) : {};
}
