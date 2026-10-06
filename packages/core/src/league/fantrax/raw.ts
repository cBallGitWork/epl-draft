import type { RawScoringSystem } from "./scoring";

// Fantrax's fxea responses as they arrive, untrusted; the mapper is the only place they meet our types.
// Every field is optional because presence varies between leagues, not only states: one league's getLeagueInfo
// carries `draftType` and `leagueHistoryId` and another's neither, on the same day.

/** Fantrax reports failure in the BODY with HTTP 200. Codes seen: WARNING, INVALID_LEAGUE_ID, NO_TEAMS, NO_LEAGUE;
 *  the vocabulary is undocumented, so they are reported, never branched on. */
export interface RawFantraxError {
  onScreen?: boolean;
  code?: string;
  message?: string;
}

export interface RawErrorBody {
  error: RawFantraxError;
}

/** One `getPlayerIds?sport=EPL` entry, keyed by fantraxId. Sixty are per-club entities, not players: an id with "#",
 *  position Tm/TmOF/TmG. */
export interface RawPoolEntry {
  fantraxId: string;
  name?: string;
  team?: string;
  position?: string;
  rotowireId?: number;
  /** Present only on the synthetic team entities. */
  teamName?: string;
  teamShortName?: string;
  shortName?: string;
}

export type RawPlayerPool = Record<string, RawPoolEntry>;

export interface RawPeriod {
  number?: number;
  startDate?: string;
  endDate?: string;
}

export interface RawRosterInfo {
  maxTotalPlayers?: number;
  maxTotalActivePlayers?: number;
  maxTotalReservePlayers?: number;
  /** Position letter to `{ maxActive }`. */
  positionConstraints?: Record<string, { maxActive?: number }>;
}

/** Our league's view of a player: his eligibility, comma-joined ("F,M"), and whether he is rostered. */
interface RawPlayerInfo {
  eligiblePos?: string;
  status?: string;
}

/** A fantasy team as embedded in `teamInfo` and both sides of a matchup; only the id reaches our matchup type. */
export interface RawTeamInfo {
  id?: string;
  name?: string;
  shortName?: string;
}

interface RawMatchup {
  home?: RawTeamInfo;
  away?: RawTeamInfo;
}

/** `matchups` is a list of periods, each holding that period's pairings. */
export interface RawPeriodMatchups {
  period?: number;
  matchupList?: RawMatchup[];
}

export interface RawLeagueInfo {
  leagueName?: string;
  leagueHistoryId?: string;
  seasonYear?: number;
  startDate?: string;
  endDate?: string;
  draftType?: string;
  rosterInfo?: RawRosterInfo;
  scoringPeriods?: RawPeriod[];
  rosterPeriods?: RawPeriod[];
  playerInfo?: Record<string, RawPlayerInfo>;
  /** Keyed by team id, which the value repeats. Empty until teams join. */
  teamInfo?: Record<string, RawTeamInfo>;
  matchups?: RawPeriodMatchups[];
  /** The league's points configuration, flat prices and banded ranges, mapped by `scoring.ts`. */
  scoringSystem?: RawScoringSystem;
  /** The league's playoff settings; `used: false` is a real answer, distinct from the key being absent. */
  playoffs?: RawPlayoffs;
  poolSettings?: unknown;
  draftSettings?: unknown;
}

export interface RawPlayoffs {
  used?: boolean;
  numPlayoffTeams?: number;
  firstPlayoffPeriod?: number;
  lastRegularSeasonPeriod?: number;
  /** Not read: how Fantrax scores a multi-period playoff round. */
  mergePlayoffPeriods?: boolean;
}

// Before a draft, standings is `[]` and rosters answers NO_TEAMS: every view must survive both.

export interface RawRosterItem {
  /** The fantraxId; absent in at least one degraded payload, so the mapper skips a slot it cannot name. */
  id?: string;
  position?: string;
  /** ACTIVE or RESERVE. Left raw — the vocabulary is Fantrax's. */
  status?: string;
}

interface RawTeamRoster {
  teamName?: string;
  /** Not mapped: our leagues have no salary cap. */
  salaryCap?: number;
  rosterItems?: RawRosterItem[];
}

/** `getTeamRosters` takes an optional `period` and echoes it back. */
export interface RawTeamRosters {
  period?: number;
  rosters?: Record<string, RawTeamRoster>;
}

interface RawStandingsRow {
  teamId?: string;
  teamName?: string;
  rank?: number;
  /** The RECORD as one string ("1-0-0" after a win), not league points. Not split: the fxpa page has the three columns. */
  points?: string;
  totalPointsFor?: number;
  /** Games off the pace: the one column the fxpa page lacks, so the table reads both. */
  gamesBack?: number;
  /** A FRACTION, 0..1 (`1` for 1-0-0). Not mapped: the page's `winpc` is the same number. */
  winPercentage?: number;
}

export type RawStandings = RawStandingsRow[];

export interface RawDraftResults {
  draftPicks?: RawDraftPick[];
  /** `"completed"` once done; until then `draftPicks` is a partial list. */
  draftState?: string;
  draftType?: string;
}

/** One pick. `playerId` is a pool id, joining rosters with no bridge; `pick` is overall, `pickInRound` within the round. */
export interface RawDraftPick {
  round?: number;
  pick?: number;
  pickInRound?: number;
  teamId?: string;
  playerId?: string;
}
