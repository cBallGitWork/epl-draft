// Fantrax's fxea responses exactly as they arrive, inconsistencies included.
// Transcribed from live recordings on 5 Aug 2026; the trimmed copies used by the
// tests are in __fixtures__/, the full ones in data/snapshots/.
//
// Every field is optional or nullable where the provider could plausibly omit it.
// This is scraped data from an undocumented surface — CODE_RULES §5 says treat it
// as untrusted, and the mapper is the only place it meets our own clean types.

/** Fantrax reports failure in the BODY, with HTTP 200. There is no status code to
 *  branch on. Observed codes so far: WARNING, INVALID_LEAGUE_ID, NO_TEAMS,
 *  NO_LEAGUE — the vocabulary is undocumented, so nothing keys off specific
 *  values beyond reporting them. */
export interface RawFantraxError {
  onScreen?: boolean;
  code?: string;
  message?: string;
}

export interface RawErrorBody {
  error: RawFantraxError;
}

/** One entry from `getPlayerIds?sport=EPL`. The response is a dict keyed by
 *  fantraxId, and 60 of its ~758 entries are not players at all: synthetic
 *  per-club entities whose id contains "#" and whose position is Tm/TmOF/TmG. */
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

/** Our league's view of a player: what it currently deems them eligible to play
 *  as, and whether they are rostered. `eligiblePos` is comma-joined ("F,M"). */
export interface RawPlayerInfo {
  eligiblePos?: string;
  status?: string;
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
  /** Empty until teams join. Element shape unobserved — see below. */
  teamInfo?: Record<string, unknown>;
  matchups?: unknown[];
  /** The league's full points configuration. We read Fantrax's computed scores
   *  rather than recomputing them, so this is captured but not modelled. */
  scoringSystem?: unknown;
  poolSettings?: unknown;
  draftSettings?: unknown;
}

// Both reads below stayed `unknown` until the rehearsal league drafted on 6 Aug
// 2026 and returned the first populated payloads either has ever produced. In our
// real league they are still empty — standings is `[]`, rosters answers NO_TEAMS
// — which is exactly the pair of states every view has to survive.

export interface RawRosterItem {
  /** The fantraxId. Absent in at least one observed degradation (a one-team dummy
   *  league's draft picks arrived with no player at all), so the mapper skips a
   *  slot it cannot name rather than inventing one. */
  id?: string;
  position?: string;
  /** ACTIVE or RESERVE. Left raw — the vocabulary is Fantrax's. */
  status?: string;
}

export interface RawTeamRoster {
  teamName?: string;
  /** On the wire and meaningless to us: our leagues have no salary cap. Mirrored
   *  here because raw.ts mirrors the wire; deliberately not mapped. */
  salaryCap?: number;
  rosterItems?: RawRosterItem[];
}

/** `getTeamRosters` takes an optional `period` and echoes it back. */
export interface RawTeamRosters {
  period?: number;
  rosters?: Record<string, RawTeamRoster>;
}

export interface RawStandingsRow {
  teamId?: string;
  teamName?: string;
  rank?: number;
  /** Win-loss-tie as one string, e.g. "0-0-0". Not split: the only sample we have
   *  is all zeroes, so a parser would be inferring a format from nothing. */
  points?: string;
  totalPointsFor?: number;
  /** Derivable, and derived by them. Not mapped. */
  gamesBack?: number;
  winPercentage?: number;
}

export type RawStandings = RawStandingsRow[];

// Draft results stay unmodelled by decision, not by ignorance: nothing is built
// on them this season. The capture keeps recording the payload verbatim, which
// costs nothing and cannot be backfilled later.

export interface RawDraftResults {
  draftPicks?: unknown[];
  draftState?: string;
  draftType?: string;
}
