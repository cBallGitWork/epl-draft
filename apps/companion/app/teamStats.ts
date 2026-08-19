import { unstable_cache } from "next/cache";
import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  PAGE_REVALIDATE,
  SEASON_CODE_LIFE,
  fetchPoolStats,
  fetchTeamStats,
  mapPoolStats,
  mapTeamStats,
  pointsBreakdown,
} from "@epl/core";
import type { BreakdownLine, TeamStats } from "@epl/core";
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
export const yearToDate = unstable_cache(
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
  ["fantrax-season-code", FANTRAX_LEAGUE_ID],
  { revalidate: SEASON_CODE_LIFE },
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
export const readTeamStats = unstable_cache(
  async (
    teamId: string,
    season: string | undefined,
    period?: number,
  ): Promise<TeamStats | null> => {
    try {
      return mapTeamStats(await fetchTeamStats(FANTRAX_LEAGUE_ID, teamId, season, period));
    } catch (error) {
      if (error instanceof FantraxError) return null;
      throw error;
    }
  },
  ["fantrax-team-stats", FANTRAX_LEAGUE_ID],
  { revalidate: PAGE_REVALIDATE },
);

/** Fantasy points per player for one squad, with the season they belong to.
 *
 *  The season travels with the numbers and is never dropped, because Fantrax
 *  answers a *projection* unless the year-to-date code is both known and
 *  honoured — and a column headed with points that silently switches between a
 *  projection and a season total is the confident wrong answer this app exists
 *  to avoid. Null points is null, never nought: Fantrax prints a dash for a
 *  category a player has not registered. */
export async function squadPoints(
  teamId: string,
  /** The period to price, when the caller is showing one. The season table on a
   *  squad page wants whatever Fantrax's current period is; a head-to-head board
   *  is looking at a named week and must ask for that one. */
  period?: number,
): Promise<SquadPoints | null> {
  const stats = await readTeamStats(teamId, await yearToDate(), period);
  if (stats === null) return null;

  return {
    projected: stats.season.projected,
    points: new Map(
      stats.groups.flatMap((group) => group.lines.map((line) => [line.fantraxId, line.points])),
    ),
    breakdown: Object.fromEntries(pointsBreakdown(stats)),
  };
}

export interface SquadPoints {
  projected: boolean;
  points: Map<string, number | null>;
  /** Why each of those numbers is what it is, in the league's own categories —
   *  the same table read once, since the FPTS view carries the total and the
   *  parts on one row.
   *
   *  A plain object and not the Map the join hands back: this crosses to the
   *  browser inside a client component's props, and a Map does not survive
   *  serialisation. */
  breakdown: Record<string, BreakdownLine[]>;
}
