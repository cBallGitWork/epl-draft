import { byKickoff } from "../football/selectors";
import type { Club, Fixture } from "../football/types";
import { isResolved, type RosteredTeam } from "../join/roster";
import { isActive } from "../league/rosterStatus";
import type { PeriodPairing } from "../league/selectors";

// What makes a Premier League fixture OUR story: the rostered men inside it,
// and the live ties it can still swing. A real paper covers the biggest game;
// this paper's biggest game is the one carrying the most draft consequence,
// which is a count, not an opinion.
//
// The join layer's rules apply — rostered men arrive already resolved through
// the bridge, so nothing here matches a name — and the persisted key uses club
// CODES, which are season-stable, never fixture ids, which are not.

/** One live pairing's presence in one fixture. */
export interface TieStake {
  homeTeamId: string;
  awayTeamId: string;
  /** Active rostered men each side of the PAIRING has in this fixture. */
  homeMen: number;
  awayMen: number;
}

export interface FixtureStake {
  /** `"{homeCode}v{awayCode}"`, club codes — the season-stable identity the
   *  ledger persists. */
  key: string;
  /** FPL's per-season id, for joining back to the snapshot THIS session only.
   *  Never persisted. */
  fixtureId: number;
  kickoff: string | null;
  finished: boolean;
  /** Active rostered men across the whole league with a club in this fixture. */
  men: number;
  /** Pairings with men in this fixture, both-sides pairings first. */
  ties: TieStake[];
}

/** Every fixture of the round, weighed. Sorted most-consequential first: a
 *  fixture with men on BOTH sides of a live tie outranks raw headcount,
 *  because it is the one whose ninety minutes can decide a head-to-head on
 *  its own; headcount breaks the tie, kickoff order breaks that. */
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
      // Club CODES, which are season-stable — never the fixture id, which is
      // not (`layer-split.md`'s identity rule reaches persisted keys). A club
      // the snapshot does not carry falls back to its per-season id rather
      // than to a shared nought: two unknown fixtures keyed `0v0` would spend
      // one covered-key between them and the second report would never file.
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

/** Whether a live pairing has men on both of its sides in this fixture — the
 *  flag that makes tonight's game a preview piece. */
export function bothSides(tie: TieStake): boolean {
  return tie.homeMen > 0 && tie.awayMen > 0;
}

function tieCritical(stake: FixtureStake): boolean {
  return stake.ties.some(bothSides);
}
