import type { LeagueScoring } from "./scoring";
import type {
  LeagueInfo,
  LeagueMatchup,
  LeaguePlayer,
  LeaguePlayerState,
  LeagueTeam,
  PeriodRosters,
} from "./types";

// Pure read-side selectors over league state.

/** A footballer in Fantrax's global pool, seen through our competition: `player` is Fantrax-wide and stays nested,
 *  apart from our commissioner's `eligiblePositions` and `status` and this week's `ownerTeamId`. */
export interface PoolPlayer {
  player: LeaguePlayer;
  /** What this league deems him eligible to play as; empty when unsaid, never a guess from `player.position`. */
  eligiblePositions: string[];
  /** Fantrax's own code ("FA", "WW", "T"), raw: a letter describes the league's state, not the player. */
  status: string;
  /** Null when nobody holds him, which is not the same statement as `status`. */
  ownerTeamId: string | null;
}

/** Whether a manager has a stake in this pairing; a reader not signed in (null) has a stake in none. */
export function pairingInvolves(pairing: PeriodPairing, teamId: string | null): boolean {
  return teamId !== null && (pairing.home.teamId === teamId || pairing.away.teamId === teamId);
}

/** One pairing in one period, both ids resolved to the teams that hold them. */
export interface PeriodPairing {
  home: LeagueTeam;
  away: LeagueTeam;
}

/** This period's pairings, ids resolved to teams; empty for a league with no teams or a period unscheduled.
 *  A pairing naming a team `teams` does not carry is dropped whole, never half-drawn. */
export function periodPairings(
  matchups: readonly LeagueMatchup[],
  teams: readonly LeagueTeam[],
  period: number,
): PeriodPairing[] {
  const byId = new Map(teams.map((team) => [team.teamId, team]));
  return matchups
    .filter((matchup) => matchup.period === period)
    .flatMap((matchup) => {
      const home = byId.get(matchup.homeTeamId);
      const away = byId.get(matchup.awayTeamId);
      return home && away ? [{ home, away }] : [];
    });
}

/** The pool by name, answering "whose is he" from the rosters, never from `status`. */
export function leaguePool(
  pool: readonly LeaguePlayer[],
  states: readonly LeaguePlayerState[],
  rosters: PeriodRosters,
): PoolPlayer[] {
  const byId = new Map(states.map((state) => [state.fantraxId, state]));
  const owners = new Map<string, string>();
  for (const team of rosters.teams) {
    for (const slot of team.slots) owners.set(slot.fantraxId, team.teamId);
  }

  return pool
    .map((player) => {
      // A pool entry with no league state is listed with nothing claimed about him, never dropped.
      const state = byId.get(player.fantraxId);
      return {
        player,
        eligiblePositions: state?.eligiblePositions ?? [],
        status: state?.status ?? "",
        ownerTeamId: owners.get(player.fantraxId) ?? null,
      };
    })
    .sort((a, b) => a.player.displayName.localeCompare(b.player.displayName));
}

/** One team's pairing this period, told from that team's side; undefined (a bye, an unscheduled period) is ordinary. */
interface HeadToHead {
  /** The team asked about. */
  team: LeagueTeam;
  opponent: LeagueTeam;
  /** Whichever of the two Fantrax's schedule puts at home: the tie is played at his venue. */
  home: LeagueTeam;
}

export function headToHead(
  matchups: readonly LeagueMatchup[],
  teams: readonly LeagueTeam[],
  period: number,
  teamId: string,
): HeadToHead | undefined {
  const pairing = periodPairings(matchups, teams, period).find(
    (p) => p.home.teamId === teamId || p.away.teamId === teamId,
  );
  if (pairing === undefined) return undefined;

  return pairing.home.teamId === teamId
    ? { team: pairing.home, opponent: pairing.away, home: pairing.home }
    : { team: pairing.away, opponent: pairing.home, home: pairing.home };
}

/** The first period after `after` in which this team has a head-to-head; undefined when the schedule has none left. */
export function nextPairedPeriod(
  matchups: readonly LeagueMatchup[],
  teams: readonly LeagueTeam[],
  after: number,
  teamId: string,
): number | undefined {
  const periods = [...new Set(matchups.map((m) => m.period))].filter((p) => p > after).sort((a, b) => a - b);
  return periods.find((p) => headToHead(matchups, teams, p, teamId) !== undefined);
}

/** The league's own season: its first paired period, and the days Fantrax's date range covers from it to the end. */
export interface LeagueSeason {
  firstPeriod: number;
  /** YYYY-MM-DD in Fantrax's own zone, as its BY_DATE range takes them. */
  startDate: string;
  endDate: string;
}

/** From the first period the schedule pairs anybody in, never the calendar's first; null before any pairing. */
export function leagueSeason(info: Pick<LeagueInfo, "matchups" | "scoringPeriods" | "endDate">): LeagueSeason | null {
  const firstPeriod = Math.min(...info.matchups.map((matchup) => matchup.period));
  const opens = info.scoringPeriods.find((period) => period.number === firstPeriod);
  // The period's start keeps Fantrax's offset, so its date part is Fantrax's day.
  const startDate = opens === undefined ? undefined : /^\d{4}-\d{2}-\d{2}/.exec(opens.start)?.[0];
  return startDate === undefined ? null : { firstPeriod, startDate, endDate: info.endDate };
}

/** A league's rules and its names for them, as our own sums are priced; null when it described no scoring. */
export function scoringOf(info: LeagueInfo): LeagueScoring | null {
  return info.scoring === null ? null : { rules: info.scoring, categories: info.scoringCategories };
}
