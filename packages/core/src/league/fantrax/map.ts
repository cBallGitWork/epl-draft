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

// Pure raw→domain transforms. No clocks, no network, no environment — everything
// this needs arrives as an argument, which is what makes it testable against
// recorded JSON instead of a live league.

/** Synthetic per-club entries ("Team Outfielder", "Team Goalie") that Fantrax
 *  mixes into the player pool for team-level scoring. Their ids carry a "#" and
 *  their positions are Tm/TmOF/TmG. They are not footballers and must never
 *  reach the identity bridge, where they would match a club name by accident. */
function isTeamEntity(entry: RawPoolEntry): boolean {
  return entry.fantraxId.includes("#");
}

/** "Cresswell, Alfie" → "Alfie Cresswell". Most pool names are in this surname-
 *  first form, but a sizeable minority arrive already in reading order
 *  ("Gabriel Jesus", "Bruno Fernandes"), and those must pass through untouched.
 *  Splitting on the comma is what distinguishes the two — not a heuristic about
 *  how many words a name has. */
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

/** Fantrax joins multiple eligible positions with a comma ("F,M"). Absent or
 *  empty means the commissioner has not assigned one, which is a real state and
 *  maps to an empty list rather than a guess. */
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
    maxTotalPlayers: info?.maxTotalPlayers ?? 0,
    maxActivePlayers: info?.maxTotalActivePlayers ?? 0,
    maxReservePlayers: info?.maxTotalReservePlayers ?? 0,
    maxActiveByPosition,
  };
}

function mapPlayerStates(
  playerInfo: Record<string, { eligiblePos?: string; status?: string }> | undefined,
): LeaguePlayerState[] {
  if (!playerInfo) return [];
  return Object.entries(playerInfo).map(([fantraxId, state]) => ({
    fantraxId,
    eligiblePositions: eligiblePositions(state.eligiblePos),
    status: state.status ?? "",
  }));
}

function mapTeams(teamInfo: Record<string, RawTeamInfo> | undefined): LeagueTeam[] {
  if (!teamInfo) return [];
  const teams: LeagueTeam[] = [];
  for (const [teamId, team] of Object.entries(teamInfo)) {
    // The key is the id and the value repeats it. The key wins: it is what every
    // other payload — rosters, standings, matchups — is keyed by.
    teams.push({ teamId, name: team.name ?? "" });
  }
  return teams;
}

/** Flattened to one row per pairing per period. Fantrax nests them by period; a
 *  view wants "this period's matchups", which a flat list answers with a filter
 *  and a nested one answers with a lookup that can miss. */
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
    seasonYear: raw.seasonYear ?? 0,
    startDate: raw.startDate ?? "",
    endDate: raw.endDate ?? "",
    // Null, not "": the rehearsal league genuinely omits this key, and an empty
    // string would claim Fantrax told us the draft type was nothing (§5).
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

/** The league's playoff, or none.
 *
 *  `used: false` is a real answer and maps to null: a league with no playoff has
 *  no line to draw rather than a line at zero. So does a league that says it has
 *  one and will not say how many places qualify — that is the one number the
 *  table needs, and a cut we cannot size is not a cut we can draw. */
function mapPlayoffs(raw: RawPlayoffs | undefined): LeaguePlayoffs | null {
  if (raw?.used !== true || typeof raw.numPlayoffTeams !== "number") return null;
  return { places: raw.numPlayoffTeams };
}
