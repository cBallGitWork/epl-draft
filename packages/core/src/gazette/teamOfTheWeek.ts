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

/** Pick the week's eleven from every squad in the league, ranked by Fantrax's
 *  points for the period (`points`, by Fantrax id); the football breaks a tie and
 *  ranks alone when Fantrax has priced nobody. */
export function teamOfTheWeek(
  teams: readonly RosteredTeam[],
  limits: RosterLimits,
  points: ReadonlyMap<string, number>,
): TeamOfTheWeek {
  // **No published total is no team**, and not a team of whatever the position
  // caps happen to add up to. `RosterLimits.maxActivePlayers` is null where the
  // league has not stated a cap, and its own docblock makes the decision the
  // caller's: eleven is OUR league's answer, not the game's, and the caps sum to
  // fourteen under our settings, so either number invented here is the exact
  // hardcoding the position check below already refuses. The two other callers
  // — `league/violations` and `league/moves` — both guard the same way.
  if (limits.maxActivePlayers === null) return { picks: [], lines: [], shape: "" };

  const candidates = rosteredPicks(teams, points);

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

/** Every rostered man who actually played this round, strongest first; the eleven is a selection from this. */
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

/** A player worth considering, or null.
 *
 *  Only players who were actually on the field: a squad member who did not play
 *  cannot be in a team of the week, and a reserve who scored is somebody's
 *  misfortune rather than a selection. */
function considered(rostered: RosteredPlayer, team: RosteredTeam, points: ReadonlyMap<string, number>): Pick | null {
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
    points: points.get(rostered.slot.fantraxId) ?? null,
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
