import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type LeagueInfo,
  fetchLeagueInfo,
  mapLeagueInfo,
  periodGameweeks,
  planningPeriod,
} from "@epl/core";
import { leagueCache } from "./leagueCache";
import { orRefusal } from "./refusals";
import { seasonKickoffs } from "./football";

// The competition's own description of itself, and which round of it a screen is
// about.
//
// Split out of `squads.ts` when that file crossed CODE_RULES' 300-line ceiling.
// The seam is real rather than arithmetic: everything here answers a question
// about the COMPETITION — its rules, its calendar, and which week we are
// discussing — and nothing here has read a roster. `squads.ts` is what reads
// the men.
//
// It is also the direction the dependency has to run. `getLeagueSquads` needs to
// know which period a gameweek is scored in before it can ask for anything, so
// this module cannot be the one that imports that one.

/** The competition's own description of itself, or none.
 *
 *  A separate read from the rosters and deliberately failure-tolerant: if
 *  Fantrax will not describe the competition we end up with no calendar, and no
 *  calendar means squad-only. Losing the lineup view because a second request
 *  failed is the correct trade — the alternative is showing an XI we cannot
 *  prove is allowed to be shown.
 *
 *  Cached on its own rather than only inside `readLeague`, because three cached
 *  readers want it: the head-to-head route resolves a gameweek to a period
 *  before it can ask for that period's rosters, so an uncached one made two
 *  `getLeagueInfo` requests per window to answer one page — and the table needs
 *  the league's own playoff settings to know where its cut falls. */
export const leagueInfo = leagueCache("league-info",
  async (): Promise<LeagueInfo | null> => {
    const raw = await orRefusal(fetchLeagueInfo(FANTRAX_LEAGUE_ID));
    return raw instanceof FantraxError ? null : mapLeagueInfo(raw);
  },
);

/** A round other than the one Fantrax is currently pointing at.
 *
 *  Both halves are needed and they belong to different layers: the gameweek asks
 *  FPL for that round's football, the period asks Fantrax for that week's
 *  lineups. Resolving one from the other is the calendar seam's job and is done
 *  before this is called, not inside it. */
export interface Round {
  gameweek: number;
  period: number;
}

/** Which Fantrax period a gameweek is scored in, or null for one the league's
 *  calendar does not cover.
 *
 *  The calendar seam, cached on its own because it is the cheapest question the
 *  app asks and the one a route has to answer before it can ask anything else:
 *  you cannot request a period's rosters until you know which period a gameweek
 *  is. Read rather than assumed — the two are one-to-one every week this season
 *  and a postponement is the known way they come apart. */
const readCalendar = leagueCache("league-calendar",
  async () => {
    const [info, kickoffs] = await Promise.all([leagueInfo(), seasonKickoffs()]);
    return info === null ? [] : periodGameweeks(info.scoringPeriods, kickoffs);
  },
);

/** The round the squad screens are about: the first whose lineups have not
 *  locked, which mid-weekend is next week and not this one.
 *
 *  Not the default for every caller, and that is the point of it being a
 *  separate question. The matchday board, the matchups board and the paper all
 *  want the round being PLAYED, which is what `getLeagueSquads()` unasked still
 *  gives them. Squads wants the round a manager can still change — the eleven he
 *  opened the app to pick — and taking Fantrax's unasked answer there is what
 *  drew a locked arrangement under a running score all Saturday.
 *
 *  Null when the league would not describe itself or the calendar cannot place
 *  the period, and null means "whatever Fantrax considers open" — the behaviour
 *  every one of these screens had before. */
export async function planningRound(): Promise<Round | null> {
  const [info, kickoffs, calendar] = await Promise.all([
    leagueInfo(),
    seasonKickoffs(),
    readCalendar(),
  ]);
  if (info === null) return null;

  // `rosterPeriods` and not `scoringPeriods`, as everything measuring a lock
  // does: the lineup calendar is the one that says when a week stops taking
  // changes.
  const period = planningPeriod(info.rosterPeriods, kickoffs, new Date().toISOString());
  if (period === null) return null;

  // The first gameweek in it. A double is two gameweeks in one period and the
  // earlier one is the week that opens; a blank period has none, and
  // `planningPeriod` has already stepped over those.
  const gameweek = calendar.find((entry) => entry.period === period)?.gameweeks[0];
  return gameweek === undefined ? null : { gameweek, period };
}

export async function roundOf(gameweek: number): Promise<Round | null> {
  const found = (await readCalendar()).find((period) => period.gameweeks.includes(gameweek));
  return found === undefined ? null : { gameweek, period: found.period };
}
