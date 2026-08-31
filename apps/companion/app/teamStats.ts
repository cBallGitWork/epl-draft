import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  SEASON_CODE_LIFE,
  fetchPoolStats,
  fetchTeamStats,
  mapPoolStats,
  mapTeamStats,
} from "@epl/core";
import type { TeamStats } from "@epl/core";
import { leagueCache } from "./leagueCache";
import { orRefusal } from "./refusals";

// One team's season table, read once and shared.
//
// Here rather than beside either of its readers because both of them cache, and
// two `unstable_cache` calls with the same key are two definitions of one cache
// — the kind of duplication that stays invisible until the day their revalidate
// windows disagree. The player page reads one row out of this table; the squad
// board reads the points column out of the same one.

/** The season code to ask for.
 *
 *  Fantrax defaults every stat read to a projection, so the code has to be sent,
 *  and it is published by exactly one endpoint. Asked for a single row — the
 *  list comes with any page size — and cached hard: it changes once a year. */
export const yearToDate = leagueCache(
  "fantrax-season-code",
  async (): Promise<string | undefined> => {
    const raw = await orRefusal(fetchPoolStats(FANTRAX_LEAGUE_ID, 1));
    // A code we could not look up is not a reason to compose one. Sending
    // nothing means Fantrax picks, and whatever it picks is read back and
    // labelled — which is what the callers do with the answer anyway.
    //
    // Only their refusal is caught. A mapper throwing is our bug.
    if (raw instanceof FantraxError) return undefined;
    return mapPoolStats(raw).yearToDate ?? undefined;
  },
  SEASON_CODE_LIFE,
);

/** One team's table, or nothing.
 *
 *  The refusal is swallowed inside the cache rather than thrown across it, and
 *  that is deliberate: `unstable_cache` serialises, so a `FantraxError` thrown
 *  through it need not arrive as one, and `instanceof` on the far side would
 *  quietly answer false. The same trap is recorded against `squads.ts`.
 *  Nothing here needs to tell one refusal from another — an undrafted league
 *  answering `WARNING` and Fantrax being down both mean there are no numbers to
 *  show, and both say so by not appearing. */
export const readTeamStats = leagueCache("fantrax-team-stats",
  async (teamId: string, season: string | undefined): Promise<TeamStats | null> => {
    try {
      return mapTeamStats(await fetchTeamStats(FANTRAX_LEAGUE_ID, teamId, season));
    } catch (error) {
      if (error instanceof FantraxError) return null;
      throw error;
    }
  },
);

/** One squad's season table, in the two shapes the squad page draws it in.
 *
 *  It used to return the index alone and throw the table away, which is how a
 *  page that had already paid for thirteen scoring columns came to print one
 *  number per player. Both shapes come off one read: the index is a derived view
 *  of the same lines, so returning it beside them cannot disagree with them.
 *
 *  The season travels with the numbers and is never dropped, because Fantrax
 *  answers a *projection* unless the year-to-date code is both known and
 *  honoured — and a column headed with points that silently switches between a
 *  projection and a season total is the confident wrong answer this app exists
 *  to avoid.
 *
 *  **A season total, and it takes no period, because the endpoint behind it does
 *  not honour one** — periods 1, 2 and 3 answer byte-identical payloads. It used
 *  to take one, which is how a card came to be headed "This period" over a
 *  running season. The caller that needs a period reads the live scoreboard. */
export async function squadSeason(teamId: string): Promise<SquadSeason | null> {
  const stats = await readTeamStats(teamId, await yearToDate());
  if (stats === null) return null;

  return {
    stats,
    points: new Map(
      stats.groups.flatMap((group) => group.lines.map((line) => [line.fantraxId, line.points])),
    ),
  };
}

export interface SquadSeason {
  /** Fantrax's own table, whole: which season these are, and one group per
   *  scoring vocabulary — a keeper is tabled apart from an outfielder because
   *  they score differently, and their columns differ thirteen against eleven. */
  stats: TeamStats;
  /** The same lines indexed by player, which is how a pitch and a list want them:
   *  a figure against a face. Null points is null, never nought — Fantrax prints
   *  a dash for a category a player has not registered. */
  points: Map<string, number | null>;
}
