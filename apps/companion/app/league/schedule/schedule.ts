import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type FixtureStatus,
  type LeagueInfo,
  type StandingsRow,
  type PeriodResult,
  fetchLeagueInfo,
  fetchSeasonResults,
  mapLeagueInfo,
  mapSeasonResults,
} from "@epl/core";
import { leagueCache } from "../../leagueCache";
import { leagueTable } from "../../standings";
import { seasonFixtures } from "../../football";
import { orRefusal, refusedAs, unavailable } from "../../refusals";
import type { Unavailable } from "../../refusals";
import { scheduleRounds } from "./rounds";

// The schedule's reads, out of the route; Fantrax's periods become gameweeks in `scheduleRounds`.

/** One round as the page needs it: what to call it, what to ask Fantrax for, and whether it has been played. */
export interface ScheduleRound {
  gameweek: number;
  /** The Fantrax period the gameweek is scored in: read, never assumed, as a postponement parts the two. */
  period: number;
  /** When lineups lock (`periodLock`, off the roster period's first kickoff); null with no roster period or no dated football. */
  deadline: string | null;
  /** The round's first kickoff, or null; it dates a round the league has no roster period for. */
  kickoff: string | null;
  /** Where the football has got to, for the label only: a part-played round with nothing on reads upcoming. */
  status: FixtureStatus;
  /** Whether a ball has been kicked: what a view asks before printing a score (`gameweekStarted`). */
  started: boolean;
}

export interface Schedule {
  info: LeagueInfo;
  /** Ascending, one per period, for the gameweek it is for (`scheduleRounds`). */
  rounds: ScheduleRound[];
  /** Fantrax's table, for each side's place. Empty is ordinary: nobody has played, or nobody has joined. */
  table: StandingsRow[];
}

/** The league's own description, or its refusal. Fantrax alone: a cached read nested in here skips its own cache, so
 *  one FPL refusal would read as Fantrax silent. A new key, as the old one held the whole schedule. */
const readInfo = leagueCache("schedule-info",
  async (): Promise<LeagueInfo | Unavailable> => {
    const raw = await orRefusal(fetchLeagueInfo(FANTRAX_LEAGUE_ID));
    return raw instanceof FantraxError ? unavailable(raw) : mapLeagueInfo(raw);
  },
  unavailable,
);

/** The league, its rounds and its table, each read from its own cache; only the league's own description is fatal. */
export async function getSchedule(): Promise<Schedule | Unavailable> {
  const [info, season, standings] = await Promise.all([readInfo(), seasonFixtures(), leagueTable()]);
  if ("unavailable" in info) return info;
  return {
    info,
    rounds: scheduleRounds(info, season),
    table: "unavailable" in standings ? [] : standings,
  };
}

/** Every team's total in every period, one request for the season; empty on failure, which prints dashes. */
export const getSeasonResults = leagueCache("schedule-results",
  (): Promise<PeriodResult[]> => refusedAs(fetchSeasonResults(FANTRAX_LEAGUE_ID), () => [], mapSeasonResults),
  () => [],
);

