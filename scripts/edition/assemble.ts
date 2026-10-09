import {
  type Assignment,
  type Club,
  type FootballSnapshot,
  type LiveTeamScore,
  type PeriodPairing,
  type RosteredTeam,
  type StoryThread,
  type TieState,
  buildFixturePreviewBrief,
  buildTieCallBrief,
  buildTieReportBrief,
  bothSides,
  londonDayAndTime,
  tieState,
} from "@epl/core";
import { fielded, menIn } from "./lineups";
import type { DeskFacts } from "./facts";

// The wiring between what was gathered and what one scoped brief may know; every join here went through the bridge.

export function fixturePreviewBrief(
  assignment: Assignment,
  snapshot: FootballSnapshot,
  facts: DeskFacts,
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
    kickoff: londonDayAndTime(fixture.kickoff),
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
  facts: DeskFacts,
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

/** One side of a finished tie: his total, and the fielded men who made it, each at the SLOT he was filed in,
 *  which is what Fantrax scores and what `playerPoints` is priced at. */
function sideOf(team: RosteredTeam | undefined, facts: DeskFacts) {
  const scorers = fielded(team)
    .flatMap((man) => {
      const points = facts.playerPoints.get(man.slot.fantraxId);
      // A man Fantrax has not priced is withheld, never a nought.
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
  facts: DeskFacts,
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
