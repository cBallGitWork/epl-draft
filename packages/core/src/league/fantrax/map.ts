import { mapScoringCategories, mapScoringRules } from "./scoring";
import type {
  LeagueInfo,
  LeagueMatchup,
  LeaguePeriod,
  LeaguePlayer,
  LeaguePlayoffs,
  LeaguePlayerState,
  LeagueTeam,
  RosterLimits,
} from "../types";
import type {
  RawLeagueInfo,
  RawPlayoffs,
  RawPeriod,
  RawPeriodMatchups,
  RawPlayerPool,
  RawPoolEntry,
  RawRosterInfo,
  RawTeamInfo,
} from "./raw";

// Pure raw→domain transforms: no clocks, no network, no environment.

/** Fantrax's per-club pool entries (id with "#", Tm/TmOF/TmG): not footballers, and kept off the identity bridge. */
function isTeamEntity(entry: RawPoolEntry): boolean {
  return entry.fantraxId.includes("#");
}

/** "Cresswell, Alfie" → "Alfie Cresswell"; a name without the comma ("Gabriel Jesus") passes through untouched. */
export function readingOrder(name: string): string {
  const comma = name.indexOf(", ");
  if (comma === -1) return name.trim();
  return `${name.slice(comma + 2).trim()} ${name.slice(0, comma).trim()}`.trim();
}

/** The real footballers in Fantrax's global pool, team entities removed. */
export function mapPlayerPool(pool: RawPlayerPool): LeaguePlayer[] {
  const players: LeaguePlayer[] = [];

  for (const entry of Object.values(pool)) {
    if (isTeamEntity(entry)) continue;
    const rawName = entry.name ?? "";
    players.push({
      fantraxId: entry.fantraxId,
      rawName,
      displayName: readingOrder(rawName),
      clubCode: entry.team ?? null,
      position: entry.position ?? null,
      rotowireId: entry.rotowireId ?? null,
    });
  }

  return players;
}

/** Fantrax's comma-joined eligibility ("F,M") as a list; empty when the commissioner has assigned none. */
function eligiblePositions(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function mapPeriods(periods: RawPeriod[] | undefined): LeaguePeriod[] {
  if (!periods) return [];
  const mapped: LeaguePeriod[] = [];
  for (const period of periods) {
    if (period.number == null || !period.startDate || !period.endDate) continue;
    mapped.push({ number: period.number, start: period.startDate, end: period.endDate });
  }
  return mapped.sort((a, b) => a.number - b.number);
}

function mapRosterLimits(info: RawRosterInfo | undefined): RosterLimits {
  const constraints = info?.positionConstraints ?? {};
  const maxActiveByPosition: Record<string, number> = {};
  for (const [position, limit] of Object.entries(constraints)) {
    if (limit?.maxActive != null) maxActiveByPosition[position] = limit.maxActive;
  }

  return {
    // `?? null`, never `?? 0`: an unpublished cap is one nobody can break.
    maxTotalPlayers: info?.maxTotalPlayers ?? null,
    maxActivePlayers: info?.maxTotalActivePlayers ?? null,
    maxReservePlayers: info?.maxTotalReservePlayers ?? null,
    maxActiveByPosition,
    // Always empty: minimums are on Fantrax's setup page only, read by `scripts/roster-limits.ts` and merged in later.
    minActiveByPosition: {},
  };
}

function mapPlayerStates(playerInfo: RawLeagueInfo["playerInfo"]): LeaguePlayerState[] {
  if (!playerInfo) return [];
  return Object.entries(playerInfo).map(([fantraxId, state]) => ({
    fantraxId,
    eligiblePositions: eligiblePositions(state?.eligiblePos),
    status: state?.status ?? "",
  }));
}

function mapTeams(teamInfo: Record<string, RawTeamInfo> | undefined): LeagueTeam[] {
  if (!teamInfo) return [];
  const teams: LeagueTeam[] = [];
  for (const [teamId, team] of Object.entries(teamInfo)) {
    // The key wins over the value's repeated id: every other payload is keyed by it.
    teams.push({ teamId, name: team.name ?? "" });
  }
  return teams;
}

/** Fantrax's per-period matchups flattened to one row per pairing per period. */
function mapMatchups(matchups: RawPeriodMatchups[] | undefined): LeagueMatchup[] {
  if (!matchups) return [];
  const flat: LeagueMatchup[] = [];
  for (const { period, matchupList } of matchups) {
    if (period == null || !matchupList) continue;
    for (const { home, away } of matchupList) {
      if (!home?.id || !away?.id) continue;
      flat.push({ period, homeTeamId: home.id, awayTeamId: away.id });
    }
  }
  return flat;
}

export function mapLeagueInfo(raw: RawLeagueInfo): LeagueInfo {
  return {
    name: raw.leagueName ?? "",
    startDate: raw.startDate ?? "",
    endDate: raw.endDate ?? "",
    // Null, not "": some leagues omit this key.
    draftType: raw.draftType ?? null,
    roster: mapRosterLimits(raw.rosterInfo),
    scoringPeriods: mapPeriods(raw.scoringPeriods),
    rosterPeriods: mapPeriods(raw.rosterPeriods),
    players: mapPlayerStates(raw.playerInfo),
    teams: mapTeams(raw.teamInfo),
    matchups: mapMatchups(raw.matchups),
    scoring: mapScoringRules(raw.scoringSystem),
    scoringCategories: mapScoringCategories(raw.scoringSystem),
    playoffs: mapPlayoffs(raw.playoffs),
  };
}

/** The league's playoff places, or null when `used` is not true or the number of places is unpublished. */
function mapPlayoffs(raw: RawPlayoffs | undefined): LeaguePlayoffs | null {
  if (raw?.used !== true || typeof raw.numPlayoffTeams !== "number") return null;
  return { places: raw.numPlayoffTeams };
}
