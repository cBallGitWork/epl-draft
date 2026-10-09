import { byPositionDepth } from "../join/lineup";
import { isResolved } from "../join/roster";
import type { RosteredPlayer, RosteredTeam } from "../join/roster";
import type { PlayerMatchStats } from "../football/types";
import { isActive } from "../league/rosterStatus";
import type { RosterLimits } from "../league/types";
import type { Pick, TeamLine, TeamOfTheWeek } from "./types";

// The best eleven anyone owned this week and who owns each man, shaped by the league's own active caps.

/** Pick the week's eleven from every squad in the league, ranked by Fantrax's
 *  points for the period (`points`, by Fantrax id); the football breaks a tie and
 *  ranks alone when Fantrax has priced nobody. */
export function teamOfTheWeek(
  teams: readonly RosteredTeam[],
  limits: RosterLimits,
  points: ReadonlyMap<string, number>,
): TeamOfTheWeek {
  // No stated active total is no team: the position caps sum past eleven, and any number here would be invented.
  if (limits.maxActivePlayers === null) return { picks: [], lines: [], shape: "" };

  const candidates = rosteredPicks(teams, points);
  const most = limits.maxActivePlayers;

  const chosen = new Set<Pick>();
  const perPosition = new Map<string, number>();
  const take = (pick: Pick, upTo: number) => {
    // The total is its own cap, not the sum of the position caps.
    if (chosen.size >= most || chosen.has(pick)) return;
    const cap = limits.maxActiveByPosition[pick.position];
    // A position with no cap is never filled: how many may play would be invented.
    if (cap === undefined) return;
    const used = perPosition.get(pick.position) ?? 0;
    if (used >= Math.min(cap, upTo)) return;
    chosen.add(pick);
    perPosition.set(pick.position, used + 1);
  };

  // Each line's floor first, so a keeper is never crowded out: the league's minimum, or one where none is published.
  for (const pick of candidates) take(pick, limits.minActiveByPosition[pick.position] ?? 1);
  for (const pick of candidates) take(pick, Infinity);
  const taken = candidates.filter((pick) => chosen.has(pick));

  const lines = linesOf(taken, limits);
  return { picks: taken, lines, shape: lines.map((line) => line.picks.length).join("-") };
}

/** Every rostered man who played this gameweek, strongest first. */
function rosteredPicks(teams: readonly RosteredTeam[], points: ReadonlyMap<string, number>): Pick[] {
  const candidates: Pick[] = [];
  for (const team of teams) {
    for (const rostered of team.players) {
      const pick = considered(rostered, team, points);
      if (pick !== null) candidates.push(pick);
    }
  }
  return candidates.sort(
    (a, b) => (b.points ?? -Infinity) - (a.points ?? -Infinity) || b.score - a.score || b.minutes - a.minutes,
  );
}

/** A resolved, slotted player who was on the field, as a pick; otherwise null. */
function considered(rostered: RosteredPlayer, team: RosteredTeam, points: ReadonlyMap<string, number>): Pick | null {
  if (!isResolved(rostered)) return null;
  if (rostered.slot.position === null) return null;

  const minutes = total(rostered.stats, (stat) => stat.minutes);
  if (minutes === 0) return null;

  const goals = total(rostered.stats, (stat) => stat.goals);
  const assists = total(rostered.stats, (stat) => stat.assists);
  // Only matches he played: FPL's zero row for an unplayed fixture would take a double's clean sheet off him.
  const appearances = rostered.stats.filter((stat) => stat.minutes > 0);
  const cleanSheet = appearances.length > 0 && appearances.every((stat) => stat.cleanSheet);
  const saves = total(rostered.stats, (stat) => stat.saves);
  const conceded = total(rostered.stats, (stat) => stat.goalsConceded);
  const redCards = total(rostered.stats, (stat) => stat.redCards);

  return {
    fantraxId: rostered.slot.fantraxId,
    playerName: rostered.player.name,
    playerCode: rostered.player.code,
    clubId: rostered.player.clubId,
    position: rostered.slot.position,
    ownerTeamId: team.teamId,
    ownerName: team.teamName,
    started: isActive(rostered.slot),
    minutes,
    goals,
    assists,
    cleanSheet,
    saves,
    points: points.get(rostered.slot.fantraxId) ?? null,
    // Goals, then assists, then keeping one out; a red card takes him out of the argument.
    score: goals * 100 + assists * 60 + (cleanSheet ? 30 : 0) + saves * 5 - conceded * 8 - redCards * 200,
  };
}

function total(stats: readonly PlayerMatchStats[], pick: (stat: PlayerMatchStats) => number): number {
  return stats.reduce((sum, stat) => sum + pick(stat), 0);
}

/** The selection in its lines, keeper first by position depth (the payload's keys are alphabetical); empty lines dropped. */
function linesOf(picks: readonly Pick[], limits: RosterLimits): TeamLine[] {
  return Object.keys(limits.maxActiveByPosition)
    .sort(byPositionDepth)
    .map((position) => ({ position, picks: picks.filter((pick) => pick.position === position) }))
    .filter((line) => line.picks.length > 0);
}
