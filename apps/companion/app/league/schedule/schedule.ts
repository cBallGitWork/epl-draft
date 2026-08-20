import { unstable_cache } from "next/cache";
import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  PAGE_REVALIDATE,
  type FixtureStatus,
  type LeagueInfo,
  type StandingsRow,
  type TeamBadge,
  type PeriodResult,
  fetchLeagueInfo,
  fetchSeasonResults,
  fetchStandings,
  fetchTeamBadges,
  firstKickoff,
  gameweekStarted,
  gameweekStatus,
  locksAt,
  mapLeagueInfo,
  mapSeasonResults,
  mapStandings,
  mapTeamBadges,
  periodGameweeks,
} from "@epl/core";
import { seasonFixtures } from "../../football";
import { orRefusal, tell } from "../../refusals";
import type { Unavailable } from "../../refusals";

// What the schedule is made of, kept out of the route for the same reason
// `squads.ts` and `scoreboard.ts` are: four provider reads with four different
// tolerances for failure is not what a page file should be about.
//
// The page speaks GAMEWEEKS and this is where that translation happens. Fantrax
// scores in periods and asks to be queried in them; a manager thinks in
// gameweeks, and printing both was printing the same number twice. The mapping
// is `periodGameweeks`, the one-way seam — the league layer is told the football
// calendar and never reaches for it.

/** One round of the season as this page needs it: what to call it, what to ask
 *  Fantrax for, and whether it has been played. */
export interface ScheduleRound {
  gameweek: number;
  /** The Fantrax period the gameweek is scored in. Every one of the 38 aligns
   *  exactly this season (`npm run periods`), but it is read rather than assumed
   *  — a postponement is the known way the two calendars come apart. */
  period: number;
  /** When lineups lock for it — the commissioner's fifteen minutes before the
   *  round's first kickoff, derived by `locksAt` so this and the paper's masthead
   *  cannot print different times.
   *
   *  Bounded by `rosterPeriods`, which is the lineup calendar, and never by
   *  `scoringPeriods` or FPL's own deadline. Null when the league described no
   *  roster period for it, or when FPL has dated none of its football. */
  deadline: string | null;
  /** The round's first kickoff, or null when FPL has dated none of it. All the
   *  page shows is the deadline; this is what dates a round the league has no
   *  roster period for. */
  kickoff: string | null;
  /** Where the round's football has got to. For the label, and only the label:
   *  a round part-played with nothing on is "upcoming", which is right for a
   *  caption and wrong for deciding whether a score exists. */
  status: FixtureStatus;
  /** Whether a ball has been kicked in it. What every view asks before printing
   *  a score, and deliberately not derived from `status` — see
   *  `gameweekStarted`. */
  started: boolean;
}

export interface Schedule {
  info: LeagueInfo;
  /** Ascending, and the whole of the dropdown. A gameweek no period covers is
   *  not on it: the league cannot score a week it does not have. */
  rounds: ScheduleRound[];
  /** Fantrax's table, which is what the placeholder brackets are seeded from.
   *  Empty is ordinary — nobody has played, or nobody has joined. */
  table: StandingsRow[];
  badges: TeamBadge[];
}

/** The four reads, cached together because none of them depends on which
 *  gameweek is being looked at. The scores do, and are fetched per round by
 *  `liveScores`, which has its own cache keyed on the period.
 *
 *  Only the league's own description of itself is fatal. A table we cannot read
 *  costs the placeholder brackets their seeding and they print places instead; a
 *  badge we cannot read costs a picture. Neither is worth losing the fixtures
 *  over, and neither states anything false in its absence. */
const readSeason = unstable_cache(
  async (): Promise<Schedule | Unavailable> => {
    const [raw, season, standings, badges] = await Promise.all([
      orRefusal(fetchLeagueInfo(FANTRAX_LEAGUE_ID)),
      seasonFixtures(),
      orRefusal(fetchStandings(FANTRAX_LEAGUE_ID)),
      orRefusal(fetchTeamBadges(FANTRAX_LEAGUE_ID)),
    ]);
    if (raw instanceof FantraxError) return { unavailable: tell(raw) };

    const info = mapLeagueInfo(raw);
    const kickoffs = season.flatMap((fixture) =>
      fixture.gameweek === null || fixture.kickoff === null
        ? []
        : [{ gameweek: fixture.gameweek, kickoff: fixture.kickoff }],
    );

    // When each round starts and when its lineups lock, from the lineup calendar
    // — `rosterPeriods`, never `scoringPeriods`. The lock is measured back from
    // the period's FIRST KICKOFF and not from its boundary; see
    // `gazette/deadline.ts` for the weeks where the two are a day apart.
    const opens = new Map(
      info.rosterPeriods.map((period) => {
        const kickoff = firstKickoff(period, kickoffs);
        return [period.number, { kickoff, deadline: kickoff === null ? null : locksAt(kickoff) }];
      }),
    );

    const rounds = periodGameweeks(info.scoringPeriods, kickoffs)
      // A period holding two gameweeks is a double and a period holding none is
      // an international break. Both are real answers, and flattening is what
      // lets the page be a list of gameweeks rather than a list of periods.
      .flatMap((period) =>
        period.gameweeks.map((gameweek) => ({
          gameweek,
          period: period.period,
          deadline: opens.get(period.period)?.deadline ?? null,
          kickoff: opens.get(period.period)?.kickoff ?? null,
          status: gameweekStatus(season, gameweek),
          started: gameweekStarted(season, gameweek),
        })),
      )
      .sort((a, b) => a.gameweek - b.gameweek)
      // One round per gameweek. A postponed match keeps FPL's original `event`
      // while Fantrax scores it in the period it was actually played
      // (`calendar.ts`), so a rearranged gameweek 20 fixture puts gameweek 20 in
      // period 20 AND period 25. Two rows for one gameweek is a dropdown with
      // the same option twice, one of them unreachable, and a fixture list that
      // prints a team's week twice. The lower period wins: it is the gameweek's
      // own week, and the one the other nine matches were played in.
      .filter((round, at, all) => all.findIndex((e) => e.gameweek === round.gameweek) === at);

    return {
      info,
      rounds,
      table: standings instanceof FantraxError ? [] : mapStandings(standings),
      badges: badges instanceof FantraxError ? [] : mapTeamBadges(badges),
    };
  },
  ["schedule-season", FANTRAX_LEAGUE_ID],
  { revalidate: PAGE_REVALIDATE },
);

export function getSchedule(): Promise<Schedule | Unavailable> {
  return readSeason();
}

/** Every team's total in every period, from Fantrax's own results table.
 *
 *  One request for the whole season, which is what makes a season view
 *  affordable — the live read answers one period at a time, and thirty-eight of
 *  those to draw one screen is not a trade worth making.
 *
 *  Read separately from `readSeason` and only when a season is actually being
 *  shown, so a reader looking at one gameweek does not pay for thirty-eight.
 *
 *  Failure is empty rather than fatal: a season with no results is every row on
 *  a dash, and the fixtures are still right. */
export const getSeasonResults = unstable_cache(
  async (): Promise<PeriodResult[]> => {
    const raw = await orRefusal(fetchSeasonResults(FANTRAX_LEAGUE_ID));
    return raw instanceof FantraxError ? [] : mapSeasonResults(raw);
  },
  ["schedule-results", FANTRAX_LEAGUE_ID],
  { revalidate: PAGE_REVALIDATE },
);

