import { positionDepth } from "../join/lineup";
import { isResolved } from "../join/roster";
import type { RosteredPlayer, RosteredTeam } from "../join/roster";
import type { PlayerMatchStats } from "../football/types";
import { isActive } from "../league/rosterStatus";
import type { RosterLimits } from "../league/types";
import type { Pick, TeamLine, TeamOfTheWeek } from "./types";

// The best eleven anyone owned this week, and who owns them.
//
// The joke the league actually tells is not "Haaland scored twice" — everyone
// saw that. It is *whose* Haaland he was, and which manager left him out. So
// every pick names its owner, and the section is worthless without that.
//
// The shape comes from the league's own position caps, not from a formation we
// like: `getLeagueInfo` says one keeper, five defenders, five midfielders and
// three forwards may be active, and a commissioner who changes that changes this
// team's shape with it. The total is whatever the caps allow to take the field —
// eleven under our settings, and read rather than assumed.

/** Pick the week's eleven from every squad in the league.
 *
 *  Ranked by the countable football, not by fantasy points: Fantrax's per-player
 *  numbers are on a different read, and a team of the week that waits for a
 *  second network call is a team of the week that does not run. Goals outrank
 *  assists outrank clean sheets, which is how anybody would argue it in a pub. */
export function teamOfTheWeek(
  teams: readonly RosteredTeam[],
  limits: RosterLimits,
): TeamOfTheWeek {
  const candidates: Pick[] = [];

  for (const team of teams) {
    for (const rostered of team.players) {
      const pick = considered(rostered, team);
      if (pick !== null) candidates.push(pick);
    }
  }

  candidates.sort((a, b) => b.score - a.score || b.minutes - a.minutes);

  const taken: Pick[] = [];
  const perPosition = new Map<string, number>();

  for (const pick of candidates) {
    // The total is not the sum of the caps: our league allows five defenders and
    // five midfielders but only eleven on the field.
    if (taken.length >= limits.maxActivePlayers) break;
    const cap = limits.maxActiveByPosition[pick.position];
    // A position the league sets no cap for cannot be filled from here: we would
    // be inventing a rule about how many of them may play.
    if (cap === undefined) continue;
    const used = perPosition.get(pick.position) ?? 0;
    if (used >= cap) continue;

    taken.push(pick);
    perPosition.set(pick.position, used + 1);
  }

  const lines = linesOf(taken, limits);
  return { picks: taken, lines, shape: lines.map((line) => line.picks.length).join("-") };
}

/** A player worth considering, or null.
 *
 *  Only players who were actually on the field: a squad member who did not play
 *  cannot be in a team of the week, and a reserve who scored is somebody's
 *  misfortune rather than a selection. */
function considered(rostered: RosteredPlayer, team: RosteredTeam): Pick | null {
  if (!isResolved(rostered)) return null;
  if (rostered.slot.position === null) return null;

  const minutes = total(rostered.stats, (stat) => stat.minutes);
  if (minutes === 0) return null;

  const goals = total(rostered.stats, (stat) => stat.goals);
  const assists = total(rostered.stats, (stat) => stat.assists);
  // Over the matches he was on the pitch for, on the same rule as `contribution`:
  // FPL carries a zero row for a fixture that has not kicked off, and on a double
  // that row would take Saturday's clean sheet off him until Tuesday.
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
    // How anybody would argue it: goals first, then assists, then keeping one
    // out. A red card takes a player out of the argument entirely.
    score: goals * 100 + assists * 60 + (cleanSheet ? 30 : 0) + saves * 5 - conceded * 8 - redCards * 200,
  };
}

function total(stats: readonly PlayerMatchStats[], pick: (stat: PlayerMatchStats) => number): number {
  return stats.reduce((sum, stat) => sum + pick(stat), 0);
}

/** The selection in its lines, back to front.
 *
 *  Ordered by `positionDepth` rather than by the payload's key order, which is
 *  alphabetical — "D-F-G-M" is not a formation anybody has ever said aloud, and
 *  a pitch drawn in it would put the keeper third.
 *
 *  Empty lines are dropped: a league that allows a position nobody was picked at
 *  has no line there, and a shape reading "1-4-0-5" is not one anybody says. */
function linesOf(picks: readonly Pick[], limits: RosterLimits): TeamLine[] {
  return Object.keys(limits.maxActiveByPosition)
    .sort((a, b) => positionDepth(a) - positionDepth(b))
    .map((position) => ({ position, picks: picks.filter((pick) => pick.position === position) }))
    .filter((line) => line.picks.length > 0);
}
