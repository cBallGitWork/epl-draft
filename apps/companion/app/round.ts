import {
  FANTRAX_LEAGUE_ID,
  type LeagueInfo,
  type PeriodGameweeks,
  fetchLeagueInfo,
  mapLeagueInfo,
  openingGameweek,
  periodGameweeks,
  periodOfGameweek,
  lastLockedPeriod,
  planningPeriod,
} from "@epl/core";
import { now } from "./clock";
import { leagueCache } from "./leagueCache";
import { refusedAs } from "./refusals";
import { seasonKickoffs } from "./football";

// The competition's own description of itself, and which round of it a screen is about.
// Nothing here reads a roster: `squads.ts` imports this module, never the reverse.

/** The competition's own description of itself, or null when Fantrax refuses: no calendar then,
 *  so squads only, never an XI we cannot prove may be shown. */
export const leagueInfo = leagueCache("league-info",
  (): Promise<LeagueInfo | null> => refusedAs(fetchLeagueInfo(FANTRAX_LEAGUE_ID), () => null, mapLeagueInfo),
  () => null,
);

/** A round other than Fantrax's current one: the gameweek asks FPL, the period asks Fantrax. */
export interface Round {
  gameweek: number;
  period: number;
}

/** Each Fantrax period with the gameweeks it scores. Read, never assumed: a postponement is how the two come apart.
 *  Worked out from two cached reads, never cached itself: one nested inside a cache skips its own and goes live. */
export async function readCalendar(): Promise<PeriodGameweeks[]> {
  const [info, kickoffs] = await Promise.all([leagueInfo(), seasonKickoffs()]);
  return info === null ? [] : periodGameweeks(info.scoringPeriods, kickoffs);
}

/** The first round whose lineups have not locked (mid-weekend, next week's), for the squad screens.
 *  The boards and the paper want the round being played, `getLeagueSquads()`'s default.
 *  Null means "whatever Fantrax considers open". */
export async function planningRound(): Promise<Round | null> {
  const [info, kickoffs, calendar] = await Promise.all([
    leagueInfo(),
    seasonKickoffs(),
    readCalendar(),
  ]);
  if (info === null) return null;

  // `rosterPeriods`, not `scoringPeriods`: the lineup calendar says when a week locks.
  const period = planningPeriod(info.rosterPeriods, kickoffs, now().toISOString());
  if (period === null) return null;

  const gameweek = openingGameweek(calendar, period);
  return gameweek === undefined ? null : { gameweek, period };
}

/** The round a rival's squad screen opens on, the last whose lineups have locked; the planning
 *  round before the season's first lock. */
export async function lastLockedRound(): Promise<Round | null> {
  const [info, kickoffs, calendar] = await Promise.all([
    leagueInfo(),
    seasonKickoffs(),
    readCalendar(),
  ]);
  if (info === null) return null;

  const period = lastLockedPeriod(info.rosterPeriods, kickoffs, now().toISOString());
  if (period === null) return planningRound();

  const gameweek = openingGameweek(calendar, period);
  return gameweek === undefined ? planningRound() : { gameweek, period };
}

export async function roundOf(gameweek: number): Promise<Round | null> {
  const found = periodOfGameweek(await readCalendar(), gameweek);
  return found === undefined ? null : { gameweek, period: found.period };
}
