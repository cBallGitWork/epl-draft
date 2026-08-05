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

// The three reads below are all EMPTY in our league until the draft on 10 Oct
// 2026: standings is `[]`, rosters answers with a NO_TEAMS error, and draftPicks
// is `[]`. Their element shapes have therefore never been observed.
//
// They are typed as `unknown` deliberately. CODE_RULES §5 requires raw types to
// mirror what the provider actually returns, and inventing plausible fields here
// would be documenting a wish. The capture runner stores these responses verbatim
// regardless — it needs no types — and the elements get modelled the moment real
// data exists to mirror.

export type RawStandings = unknown[];

export type RawTeamRosters = Record<string, unknown>;

export interface RawDraftResults {
  draftPicks?: unknown[];
  draftState?: string;
  draftType?: string;
}
