import type { Fixture, FootballPlayer, PlayerOwner } from "@epl/core";
import { fixtureInvolvement, isActive, owners } from "@epl/core";
import { getLeagueSquads } from "./squads";
import type { ReadableSquads } from "./squads";
import { myTeamId } from "./session";

// What our league has to say about a round of football: which of these matches
// the reader has somebody in, who holds each footballer in them, and — kept
// apart — which of his men are still to come.
//
// Three screens asked it and each discovered the reader for itself: read the
// squads, verify the cookie, find his team, join. That is three places for the
// same two mistakes — keying the markers off a lineup instead of a squad, and
// forgetting that every one of the four ways this can come back empty is
// ordinary rather than a fault.
//
// **Two squads on purpose, and the distinction is the whole file.** `mine` and
// `owners` key off SQUAD MEMBERSHIP, which is public all week and is the right
// answer to "is this match mine". `afternoon` keys off his LINEUP, because a
// reserve does not score — and a lineup is only ever read here for the reader's
// own team, which is never withheld from him. Nothing in this file can say
// anything about a rival's arrangement.

/** Absent means "no answer to give", and the four ways to get there — signed
 *  out, no league, undrafted, Fantrax silent — are all ordinary. Every consumer
 *  renders the plain football when they are absent, which is what keeps "this
 *  works with no Fantrax at all" true. */
export interface Marks {
  /** His whole squad, per fixture. What marks a row as his. */
  mine?: Map<number, FootballPlayer[]>;
  /** Every rostered footballer against the squad holding him, by FPL code. */
  owners?: Map<number, PlayerOwner>;
  /** His ACTIVE players only, per fixture — the afternoon still ahead of him. */
  afternoon?: Map<number, FootballPlayer[]>;
}

/** For a page that already holds the league. */
export async function marksFor(
  squads: ReadableSquads,
  fixtures: readonly Fixture[],
): Promise<Marks> {
  const teamId = await myTeamId(squads.period.teams);
  const team = squads.period.teams.find((t) => t.teamId === teamId);
  if (team === undefined) return { owners: owners(squads.period.teams) };

  return {
    mine: fixtureInvolvement(team, fixtures),
    owners: owners(squads.period.teams),
    afternoon: fixtureInvolvement(
      { ...team, players: team.players.filter((p) => isActive(p.slot)) },
      fixtures,
    ),
  };
}

/** For a page that does not, and would otherwise read the league twice.
 *
 *  A signed-out reader still gets `owners`: whose player that was is not a
 *  question about him. */
export async function marks(fixtures: readonly Fixture[]): Promise<Marks> {
  const squads = await getLeagueSquads();
  return "period" in squads ? marksFor(squads, fixtures) : {};
}
