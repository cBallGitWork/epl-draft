import {
  LEAGUE_TIMEZONE,
  type Assignment,
  type Club,
  type Fixture,
  type FootballSnapshot,
  type LiveTeamScore,
  type PeriodPairing,
  type RosteredTeam,
  type StoryThread,
  type TieState,
  buildFixturePreviewBrief,
  buildMatchReportBrief,
  buildTieCallBrief,
  buildTieReportBrief,
  bothSides,
  isActive,
  isResolved,
  tieState,
} from "@epl/core";
import type { RoundFacts } from "./facts";

// The wiring between what was gathered and what one scoped brief may know —
// the "script does the wiring" clause made literal. Everything joined here
// went through the bridge in `resolveRosters`; nothing matches a name.

/** A rostered man with a club in the given fixture, active slots only — a
 *  reserve cannot score, so he carries no stake. */
function menIn(fixture: Fixture, team: RosteredTeam) {
  return team.players
    .filter(isResolved)
    .filter((man) => isActive(man.slot))
    .filter(
      (man) => man.player.clubId === fixture.homeClubId || man.player.clubId === fixture.awayClubId,
    );
}

export function matchReportBrief(
  assignment: Assignment,
  snapshot: FootballSnapshot,
  facts: RoundFacts,
  clubs: Map<number, Club>,
  threads: readonly StoryThread[],
): string | null {
  const fixture = snapshot.fixtures.find((each) => each.id === assignment.fixtureId);
  if (fixture === undefined) return null;

  const owners = facts.teams
    .map((team) => ({
      owner: team.teamName,
      // A finished fixture has a stat row for every player in the league — a
      // man without one has nothing to report, so he is withheld rather than
      // invented as a row of noughts.
      players: menIn(fixture, team).flatMap((man) => {
        const stats = man.stats.find((row) => row.fixtureId === fixture.id);
        return stats === undefined
          ? []
          : [
              {
                name: man.player.name,
                position: man.slot.position,
                stats,
                points: facts.playerPoints.get(man.slot.fantraxId) ?? null,
              },
            ];
      }),
    }))
    .filter((squad) => squad.players.length > 0)
    .sort((a, b) => b.players.length - a.players.length);
  if (owners.length === 0) return null;

  const involved = new Set(facts.teams.filter((team) => menIn(fixture, team).length > 0).map((t) => t.teamId));
  const ties = facts.pairings
    .filter((pairing) => involved.has(pairing.home.teamId) || involved.has(pairing.away.teamId))
    .map((pairing) => ({
      homeName: pairing.home.name,
      awayName: pairing.away.name,
      homePoints: facts.scores.get(pairing.home.teamId)?.points ?? null,
      awayPoints: facts.scores.get(pairing.away.teamId)?.points ?? null,
      state: stateOf(pairing, facts.scores),
    }));

  return buildMatchReportBrief({
    gameweek: snapshot.gameweek,
    home: clubs.get(fixture.homeClubId)?.name ?? "Home",
    away: clubs.get(fixture.awayClubId)?.name ?? "Away",
    homeScore: fixture.homeScore,
    awayScore: fixture.awayScore,
    owners,
    ties,
    threads,
  });
}

export function fixturePreviewBrief(
  assignment: Assignment,
  snapshot: FootballSnapshot,
  facts: RoundFacts,
  clubs: Map<number, Club>,
  threads: readonly StoryThread[],
): string | null {
  const fixture = snapshot.fixtures.find((each) => each.id === assignment.fixtureId);
  if (fixture === undefined || fixture.kickoff === null) return null;

  const names = (teamId: string) => {
    const team = facts.teams.find((each) => each.teamId === teamId);
    return team === undefined ? [] : menIn(fixture, team).map((man) => man.player.name);
  };

  const duels = facts.pairings
    .map((pairing) => ({
      pairing,
      homeMen: names(pairing.home.teamId),
      awayMen: names(pairing.away.teamId),
    }))
    .filter(
      (duel) =>
        bothSides({
          homeTeamId: duel.pairing.home.teamId,
          awayTeamId: duel.pairing.away.teamId,
          homeMen: duel.homeMen.length,
          awayMen: duel.awayMen.length,
        }) && stateOf(duel.pairing, facts.scores) === "open",
    );
  if (duels.length === 0) return null;

  const inDuels = new Set(duels.flatMap((duel) => [duel.pairing.home.teamId, duel.pairing.away.teamId]));
  const watching = facts.teams
    .filter((team) => !inDuels.has(team.teamId))
    .map((team) => ({ owner: team.teamName, men: menIn(fixture, team).map((man) => man.player.name) }))
    .filter((squad) => squad.men.length > 0);

  return buildFixturePreviewBrief({
    gameweek: snapshot.gameweek,
    home: clubs.get(fixture.homeClubId)?.name ?? "Home",
    away: clubs.get(fixture.awayClubId)?.name ?? "Away",
    kickoff: new Intl.DateTimeFormat("en-GB", {
      timeZone: LEAGUE_TIMEZONE,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(fixture.kickoff)),
    duels: duels.map((duel) => ({
      homeName: duel.pairing.home.name,
      awayName: duel.pairing.away.name,
      homePoints: facts.scores.get(duel.pairing.home.teamId)?.points ?? null,
      awayPoints: facts.scores.get(duel.pairing.away.teamId)?.points ?? null,
      homeMen: duel.homeMen,
      awayMen: duel.awayMen,
    })),
    watching,
    threads,
  });
}

export function tieCallBrief(
  assignment: Assignment,
  gameweek: number,
  facts: RoundFacts,
  threads: readonly StoryThread[],
): string | null {
  const pairing = facts.pairings.find(
    (each) =>
      each.home.teamId === assignment.tie?.homeTeamId &&
      each.away.teamId === assignment.tie?.awayTeamId,
  );
  if (pairing === undefined) return null;
  const state = stateOf(pairing, facts.scores);
  if (state === "open") return null;

  return buildTieCallBrief({
    gameweek,
    homeName: pairing.home.name,
    awayName: pairing.away.name,
    homePoints: facts.scores.get(pairing.home.teamId)?.points ?? null,
    awayPoints: facts.scores.get(pairing.away.teamId)?.points ?? null,
    homeToPlay: facts.scores.get(pairing.home.teamId)?.toPlay ?? null,
    awayToPlay: facts.scores.get(pairing.away.teamId)?.toPlay ?? null,
    state,
    threads,
  });
}

/** One side of a finished tie: his total, and the men who made it.
 *
 *  **The slot he was filed in, and never a position off the player.** Fantrax
 *  scores the roster slot — Saka is `F,M`, filed at M, and paid at midfield
 *  rates — so `man.slot.position` is the honest letter here and the pool's
 *  default would be a different, wrong number. `playerPoints` is already priced
 *  the same way: it is what the man was worth to THIS manager.
 *
 *  Active slots only. A reserve cannot score, and a bench listed among the
 *  scorers would have the writer explaining a nought nobody was owed. */
function sideOf(team: RosteredTeam | undefined, facts: RoundFacts) {
  const scorers = (team?.players ?? [])
    .filter(isResolved)
    .filter((man) => isActive(man.slot))
    .flatMap((man) => {
      const points = facts.playerPoints.get(man.slot.fantraxId);
      // Absent rather than nought: a man Fantrax has not priced is withheld,
      // the way every other brief withholds him.
      return points === undefined
        ? []
        : [{ name: man.player.name, position: man.slot.position, points }];
    })
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  return {
    name: team?.teamName ?? "",
    points: facts.scores.get(team?.teamId ?? "")?.points ?? null,
    scorers,
  };
}

export function tieReportBrief(
  assignment: Assignment,
  gameweek: number,
  facts: RoundFacts,
  threads: readonly StoryThread[],
): string | null {
  const pairing = facts.pairings.find(
    (each) =>
      each.home.teamId === assignment.tie?.homeTeamId &&
      each.away.teamId === assignment.tie?.awayTeamId,
  );
  if (pairing === undefined) return null;

  const byId = (teamId: string) => facts.teams.find((team) => team.teamId === teamId);
  const home = { ...sideOf(byId(pairing.home.teamId), facts), name: pairing.home.name };
  const away = { ...sideOf(byId(pairing.away.teamId), facts), name: pairing.away.name };

  return buildTieReportBrief({ gameweek, home, away, threads });
}

function stateOf(pairing: PeriodPairing, scores: Map<string, LiveTeamScore>): TieState {
  return tieState(scores.get(pairing.home.teamId), scores.get(pairing.away.teamId));
}
