import type { RawScoringSystem } from "./scoring";

// Fantrax's fxea responses exactly as they arrive, inconsistencies included.
// Transcribed from live recordings on 5–6 Aug 2026; the trimmed copies used by
// the tests are in __fixtures__/, the full ones in data/snapshots/.
//
// EVERY field is optional. That is not defensive habit: the two leagues we
// capture disagree about which keys exist at all. The real league's getLeagueInfo
// carries `draftType` and `leagueHistoryId`, the rehearsal league's carries
// neither — same provider, same method, same day. Presence varies by league and
// by state, so optionality is what the wire actually looks like.
//
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

interface RawErrorBody {
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
interface RawPlayerInfo {
  eligiblePos?: string;
  status?: string;
}

/** A fantasy team, as Fantrax embeds it in `teamInfo` and on both sides of a
 *  matchup. The name is repeated on every payload that mentions the team, which
 *  is why only the id is carried into our own matchup type. */
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
  /** The league's full points configuration, and the most custom thing in it.
   *
   *  Read, not recomputed: Fantrax scores the matches and we show their numbers.
   *  Only the flat per-position values are mapped, for the one thing their live
   *  feed withholds until full time — see `join/cleanSheets.ts`. The banded
   *  expressions stay unparsed because nothing needs them. */
  scoringSystem?: RawScoringSystem;
  /** The league's own playoff settings. `used: false` is a real answer — the
   *  rehearsal league says it — and is not the same as the key being absent. */
  playoffs?: RawPlayoffs;
  poolSettings?: unknown;
  draftSettings?: unknown;
}

export interface RawPlayoffs {
  used?: boolean;
  numPlayoffTeams?: number;
  firstPlayoffPeriod?: number;
  lastRegularSeasonPeriod?: number;
  /** On the wire and not read: what it changes is how Fantrax scores a
   *  multi-period playoff round, and we score nothing. */
  mergePlayoffPeriods?: boolean;
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

interface RawTeamRoster {
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

interface RawStandingsRow {
  teamId?: string;
  teamName?: string;
  rank?: number;
  /** The RECORD as one string — "1-0-0" for a side with a win, "0-0-1" for one
   *  with a defeat, read 29 Aug 2026. Not the league's points, despite the name,
   *  and not split here: the fxpa page publishes the same three numbers in three
   *  columns of its own, so parsing a string would be the second reader of a fact
   *  we already have straight. */
  points?: string;
  totalPointsFor?: number;
  /** How far off the pace. **The one column this array has and the page does
   *  not**, which is why the table reads both. It was all noughts on every early
   *  sample and is not any more — 0, 0, 1, 1 across the rehearsal league on
   *  29 Aug — so the reason for skipping it has expired. */
  gamesBack?: number;
  /** A FRACTION, 0..1: literally `1` for a 1-0-0 side. Mirrored and not mapped —
   *  the page's `winpc` column is the same number beside the record it belongs
   *  with, and one number read twice is one number that can disagree. */
  winPercentage?: number;
}

export type RawStandings = RawStandingsRow[];

// Draft results were unmodelled by decision until 28 Aug 2026, on the grounds
// that nothing was built on them. The paper is: a draft league's whole
// conversation is the gap between what a pick cost and what he did, and that is
// the one story format no other fantasy game has. The capture had been recording
// the payload verbatim throughout, which is why there was a season of it to read
// the moment it was wanted.

export interface RawDraftResults {
  draftPicks?: RawDraftPick[];
  /** `"completed"` once it is done. A draft in progress is a partial list, which
   *  is a real state for nine weeks: the real league drafts on 10 Oct. */
  draftState?: string;
  draftType?: string;
}

/** One pick, as Fantrax files it.
 *
 *  `playerId` is a Fantrax pool id — the same id the rosters and the transaction
 *  log use — so pedigree joins to a squad directly and needs no bridge. `pick`
 *  is the overall number and `pickInRound` is the position within the round;
 *  both are carried because their names are easy to confuse and only one of them
 *  means "the No.1 overall pick". */
export interface RawDraftPick {
  round?: number;
  pick?: number;
  pickInRound?: number;
  teamId?: string;
  playerId?: string;
}
