import type { LeagueScoring } from "./scoring";
import type {
  LeagueInfo,
  LeagueMatchup,
  LeaguePlayer,
  LeaguePlayerState,
  LeagueTeam,
  PeriodRosters,
} from "./types";

// Pure read-side selectors over league state, kept out of the components so they
// stay unit-testable — the same rule the football layer's selectors follow.

/** A footballer in Fantrax's global EPL pool, seen through our competition.
 *
 *  Three sources meet here and they are three different things, which is why the
 *  pool entry stays nested rather than being flattened into one row: `player` is
 *  whole-of-Fantrax and identical in every league on the site, `eligiblePositions`
 *  and `status` are what OUR commissioner has decided, and `ownerTeamId` is this
 *  week's roster. Flattening them would put the commissioner's opinion and
 *  Fantrax's global one in adjacent fields with nothing left to say which is
 *  which. */
export interface PoolPlayer {
  player: LeaguePlayer;
  /** What this league deems him eligible to play as. Empty when it has not said
   *  — never a guess taken from `player.position`, which is Fantrax's global
   *  default and not our commissioner's setting. */
  eligiblePositions: string[];
  /** Fantrax's own code — "FA", "WW", "T". Raw, because the vocabulary is theirs:
   *  an undrafted league marks all 697 players "WW" while a drafted one splits
   *  them across all three, so anything keying off a particular letter would be
   *  reading a league state as a player fact. */
  status: string;
  /** Null when nobody holds him — which is every player in a league that has not
   *  drafted, and is not the same statement as `status`. */
  ownerTeamId: string | null;
}

/** Whether a manager has a stake in this pairing.
 *
 *  A null team id — a reader who has not signed in — has a stake in none of
 *  them, which is the neutral list rather than a special case to branch on.
 *
 *  Here rather than in a component because two screens both order by it and
 *  mark by it, and two spellings of "is this one mine" is how a list comes to
 *  put a card first and then not mark it. */
export function pairingInvolves(pairing: PeriodPairing, teamId: string | null): boolean {
  return teamId !== null && (pairing.home.teamId === teamId || pairing.away.teamId === teamId);
}

/** One pairing in one period, both ids resolved to the teams that hold them. */
export interface PeriodPairing {
  home: LeagueTeam;
  away: LeagueTeam;
}

/** This period's pairings, resolved. The consumer `LeagueMatchup` was flattened
 *  for: one row per pairing per period makes selecting a period a filter, and
 *  resolving the ids here rather than in a component keeps the second copy of a
 *  team name out of the view — the same reason the matchup carries ids at all.
 *
 *  Empty is a real answer, not a failure, and it happens two ways we have seen:
 *  a league with no teams yet (the real league, every day until 10 Oct), and a
 *  period the schedule does not cover — a bye, or a schedule that starts at
 *  period 6 while Fantrax serves period 1. Both render as "no pairings", never
 *  as a crash.
 *
 *  A pairing naming a team id `teams` does not carry is dropped whole rather
 *  than half-rendered: a matchup with one side is not a matchup, and inventing
 *  a placeholder team would put a name we made up beside fifteen names Fantrax
 *  gave us. */
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

/** The pool, ordered as a person reads it and answering "whose is he".
 *
 *  Ownership is computed from the rosters rather than taken from `status`, and
 *  the two are not interchangeable: `status` says what may be done with a player
 *  under the league's transaction rules, the rosters say who has him. A league
 *  with no teams answers "nobody owns anybody" while still calling all 697
 *  waiver-wire, and both statements are true. */
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
      // A pool entry our league has no state for is still a real footballer, so
      // he is listed with nothing claimed about him rather than dropped.
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

/** One team's pairing this period, told from that team's side.
 *
 *  `periodPairings` reports Fantrax's home and away because that is what the
 *  schedule says, and every screen that shows a head-to-head to a particular
 *  manager reads his own team first; `home` is kept only for the ground the
 *  tie is drawn over. Three of them had written
 *  `pairing.home.teamId === mine ? … : …` for themselves — his own matchup on
 *  the live tab, his squad screen naming Saturday's opponent, and the board —
 *  which is the third occurrence and the point at which it stops being a
 *  coincidence.
 *
 *  Undefined is ordinary rather than a fault: a bye, a period the schedule does
 *  not cover, a league that has not drafted, or a team id from another league. */
export interface HeadToHead {
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
