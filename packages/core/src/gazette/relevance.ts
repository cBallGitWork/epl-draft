import { byKickoff } from "../football/selectors";
import type { Club, Fixture } from "../football/types";
import { isResolved, type RosteredTeam } from "../join/roster";
import { isActive } from "../league/rosterStatus";
import type { PeriodPairing } from "../league/selectors";

// What makes a Premier League fixture our story: the rostered men in it and the live ties it can still swing.

/** One live pairing's presence in one fixture. */
export interface TieStake {
  homeTeamId: string;
  awayTeamId: string;
  /** Active rostered men each side of the PAIRING has in this fixture. */
  homeMen: number;
  awayMen: number;
}

export interface FixtureStake {
  /** `"{homeCode}v{awayCode}"` in season-stable club codes: the key the ledger persists. */
  key: string;
  /** FPL's per-season id, for joining back to this snapshot only; never persisted. */
  fixtureId: number;
  kickoff: string | null;
  finished: boolean;
  /** Active rostered men across the whole league with a club in this fixture. */
  men: number;
  /** Pairings with men in this fixture, both-sides pairings first. */
  ties: TieStake[];
}

/** Every fixture of the gameweek, weighed: men on both sides of a tie first, then headcount, then kickoff. */
export function fixtureStakes(
  fixtures: readonly Fixture[],
  teams: readonly RosteredTeam[],
  pairings: readonly PeriodPairing[],
  clubs: Map<number, Club>,
): FixtureStake[] {
  // clubId → (teamId → active men at that club).
  const menAt = new Map<number, Map<string, number>>();
  for (const team of teams) {
    for (const rostered of team.players) {
      if (!isResolved(rostered) || !isActive(rostered.slot)) continue;
      const byTeam = menAt.get(rostered.player.clubId) ?? new Map<string, number>();
      byTeam.set(team.teamId, (byTeam.get(team.teamId) ?? 0) + 1);
      menAt.set(rostered.player.clubId, byTeam);
    }
  }

  const stakes = fixtures.map((fixture) => {
    const home = menAt.get(fixture.homeClubId) ?? new Map<string, number>();
    const away = menAt.get(fixture.awayClubId) ?? new Map<string, number>();
    const of = (teamId: string) => (home.get(teamId) ?? 0) + (away.get(teamId) ?? 0);

    const ties = pairings
      .map((pairing) => ({
        homeTeamId: pairing.home.teamId,
        awayTeamId: pairing.away.teamId,
        homeMen: of(pairing.home.teamId),
        awayMen: of(pairing.away.teamId),
      }))
      .filter((tie) => tie.homeMen > 0 || tie.awayMen > 0)
      .sort((a, b) => Number(bothSides(b)) - Number(bothSides(a)));

    return {
      // Club codes, never the per-season fixture id; an unknown club keys `x{id}`, never a shared `0`.
      key: `${clubs.get(fixture.homeClubId)?.code ?? `x${fixture.homeClubId}`}v${clubs.get(fixture.awayClubId)?.code ?? `x${fixture.awayClubId}`}`,
      fixtureId: fixture.id,
      kickoff: fixture.kickoff,
      finished: fixture.status === "finished",
      men: [...home.values(), ...away.values()].reduce((sum, count) => sum + count, 0),
      ties,
    };
  });

  return stakes.sort(
    (a, b) =>
      Number(tieCritical(b)) - Number(tieCritical(a)) ||
      b.men - a.men ||
      byKickoff(a, b),
  );
}

/** Whether a live pairing has men on both its sides in this fixture. */
export function bothSides(tie: TieStake): boolean {
  return tie.homeMen > 0 && tie.awayMen > 0;
}

function tieCritical(stake: FixtureStake): boolean {
  return stake.ties.some(bothSides);
}
