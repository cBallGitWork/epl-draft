import type { Competition, Draw } from "./competitions";
import type { PeriodResult } from "./fantrax/results";
import type { LeagueTeam, StandingsRow } from "./types";

/** The draw as the season stands. `finished` answers the period a gameweek was
 *  scored in once its football is over, and undefined before: Fantrax answers 0
 *  for a period nobody has played. */
export function drawFrom(
  table: readonly StandingsRow[],
  teams: readonly LeagueTeam[],
  results: readonly PeriodResult[],
  finished: (gameweek: number) => number | undefined,
): Draw {
  const byTable = tableSeeds(table);
  const byPoints = new Map<number, ReadonlyMap<number, LeagueTeam>>();

  const seeds = (competition: Competition): ReadonlyMap<number, LeagueTeam> => {
    const by = competition.seededBy;
    if (by === undefined) return NONE;
    if (by === "table") return byTable;
    const period = finished(by.gameweek);
    if (period === undefined) return NONE;
    if (!byPoints.has(period)) byPoints.set(period, seedsByPoints(teams, results, period));
    return byPoints.get(period) ?? NONE;
  };

  const totals = (gameweek: number) => {
    const period = finished(gameweek);
    if (period === undefined) return undefined;
    return new Map(results.filter((row) => row.period === period).map((row) => [row.teamId, row.points]));
  };

  return { seeds, totals };
}

/** Place → team. A row with no name holds no seed: an empty side would read as a bye. */
export function tableSeeds(table: readonly StandingsRow[]): Map<number, LeagueTeam> {
  return new Map(
    table.filter((row) => row.teamName !== "").map((row) => [row.rank, { teamId: row.teamId, name: row.teamName }]),
  );
}

/** Seed → team off one period's totals, highest first; level teams split on their points to date.
 *  Empty until every team has a total. */
export function seedsByPoints(
  teams: readonly LeagueTeam[],
  results: readonly PeriodResult[],
  period: number,
): Map<number, LeagueTeam> {
  const week = new Map(results.filter((row) => row.period === period).map((row) => [row.teamId, row.points]));
  if (teams.some((team) => week.get(team.teamId) == null)) return new Map();

  const toDate = (team: LeagueTeam) =>
    results
      .filter((row) => row.teamId === team.teamId && row.period <= period)
      .reduce((sum, row) => sum + (row.points ?? 0), 0);
  const order = [...teams].sort(
    (a, b) =>
      (week.get(b.teamId) ?? 0) - (week.get(a.teamId) ?? 0) ||
      toDate(b) - toDate(a) ||
      a.teamId.localeCompare(b.teamId),
  );
  return new Map(order.map((team, at) => [at + 1, team]));
}

const NONE: ReadonlyMap<number, LeagueTeam> = new Map();
