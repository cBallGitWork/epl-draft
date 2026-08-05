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

/** Everything `getLeagueInfo` tells us about the competition's configuration. */
export interface LeagueInfo {
  name: string;
  seasonYear: number;
  /** Season bounds as plain YYYY-MM-DD dates, not instants. */
  startDate: string;
  endDate: string;
  draftType: string;
  roster: RosterLimits;
  scoringPeriods: LeaguePeriod[];
  players: LeaguePlayerState[];
}
