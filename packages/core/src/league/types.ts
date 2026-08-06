// The LEAGUE layer: our fantasy competition, sourced from Fantrax. Where the
// football layer is the real Premier League and is permanent, this layer is an
// adapter over whoever happens to be running our league — Fantrax now, our own
// engine in 27/28.
//
// Nothing here is football truth. Two consequences run through every type below:
//
//  1. A player's club code and position here are FANTRAX's opinion. The
//     commissioner can change a position at any time and Fantrax carries youth
//     players FPL has never heard of. Positions are display hints, never join
//     keys, and the club codes are not FPL's (they disagree on Brentford and
//     Nott'm Forest).
//  2. The join to the football layer goes through the identity bridge and
//     nothing else. Never name-match at runtime.

/** A player as Fantrax's global EPL pool knows them. */
export interface LeaguePlayer {
  fantraxId: string;
  /** Verbatim, as Fantrax gives it — usually "Surname, Firstname" but sometimes
   *  a display form ("Gabriel Jesus"). Kept unmodified so a bridge audit can see
   *  exactly what was matched against. */
  rawName: string;
  /** Reading order, comma form resolved. */
  displayName: string;
  /** Fantrax's three-letter club code, which is not always FPL's. */
  clubCode: string | null;
  /** Fantrax's position letter (G/D/M/F). Commissioner-mutable league state. */
  position: string | null;
  rotowireId: number | null;
}

/** Per-player state within OUR league, as distinct from the global pool: who is
 *  rostered, who is on waivers, and what the commissioner currently deems them
 *  eligible to play as. */
export interface LeaguePlayerState {
  fantraxId: string;
  /** Fantrax supports multi-position eligibility, so this is a list — "F,M" is a
   *  real and common value. Another reason position cannot be a join key. */
  eligiblePositions: string[];
  /** Fantrax's own code, e.g. "WW" for waiver wire. Left as a raw string: the
   *  vocabulary is theirs and undocumented, and inventing an enum would mean
   *  guessing at values we have not seen. */
  status: string;
}

/** The roster shape the league enforces, as configured by the commissioner. */
export interface RosterLimits {
  maxTotalPlayers: number;
  maxActivePlayers: number;
  maxReservePlayers: number;
  /** Position letter to maximum active count, e.g. `{ G: 1, D: 5, M: 5, F: 3 }`. */
  maxActiveByPosition: Record<string, number>;
}

/** One scoring or roster period. Fantrax numbers these 1–38 in step with FPL
 *  gameweeks, but the dates are its own and carry a US Eastern offset. */
export interface LeaguePeriod {
  number: number;
  /** ISO instants, as provided (offset preserved). */
  start: string;
  end: string;
}

/** A fantasy team in our league. */
export interface LeagueTeam {
  teamId: string;
  name: string;
}

/** One pairing in one period.
 *
 *  Ids, not embedded teams: Fantrax sends team names on `teamInfo` and again on
 *  every matchup, and a second copy is a copy that goes stale when someone renames
 *  their team. Flattened to one row per pairing per period so selecting a period
 *  is a filter. */
export interface LeagueMatchup {
  period: number;
  homeTeamId: string;
  awayTeamId: string;
}

/** One player in one team's roster for one period. */
export interface RosterSlot {
  fantraxId: string;
  /** The slot Fantrax has them filling. Fantrax's opinion, commissioner-mutable,
   *  and never a join key. */
  position: string | null;
  /** ACTIVE or RESERVE, raw. The distinction is the whole point of a lineup, so
   *  it is carried verbatim rather than reduced to a boolean we would have to
   *  reinterpret when Fantrax adds a third value. */
  status: string;
}

export interface TeamRoster {
  teamId: string;
  teamName: string;
  slots: RosterSlot[];
}

/** `getTeamRosters` for one period. */
export interface PeriodRosters {
  /** Which period this is, echoed back by Fantrax. Null when it did not say —
   *  never 0, which would read as a real period. */
  period: number | null;
  teams: TeamRoster[];
}

export interface StandingsRow {
  teamId: string;
  teamName: string;
  rank: number;
  /** Win-loss-tie exactly as Fantrax formats it ("0-0-0"). Unparsed on purpose:
   *  every sample we have is all zeroes, so splitting it would infer a format
   *  from nothing. Parse it when a played gameweek produces a real one. */
  record: string;
  pointsFor: number;
}

/** Everything `getLeagueInfo` tells us about the competition's configuration.
 *
 *  Nearly all of it is custom. FPL's rules are fixed for everyone and can be
 *  constants; a Fantrax league's rules are the product being sold, so the shape of
 *  the competition is data we read — roster limits, the position vocabulary, the
 *  period calendar, the lineup deadline, the team count, the schedule. Never
 *  assumed, never inferred from the football layer (§3). */
export interface LeagueInfo {
  name: string;
  seasonYear: number;
  /** Season bounds as plain YYYY-MM-DD dates, not instants. */
  startDate: string;
  endDate: string;
  /** Absent in the rehearsal league and present in the real one — same provider,
   *  same day. Null means Fantrax did not say. */
  draftType: string | null;
  roster: RosterLimits;
  scoringPeriods: LeaguePeriod[];
  players: LeaguePlayerState[];
  /** Empty until managers join. */
  teams: LeagueTeam[];
  matchups: LeagueMatchup[];
}
