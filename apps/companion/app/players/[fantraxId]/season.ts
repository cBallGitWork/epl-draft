import { unstable_cache } from "next/cache";
import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  PAGE_REVALIDATE,
  SEASON_CODE_LIFE,
  fetchPoolStats,
  fetchTeamStats,
  isUnmapped,
  mapPoolStats,
  mapTeamStats,
  playerByCode,
} from "@epl/core";
import type { FootballPlayer, StatColumn, StatSeason, TeamStats } from "@epl/core";
import { footballNow } from "../../football";
import { orRefusal } from "../../refusals";
import { bridge } from "../../squads";

// What one player's season looks like, from the two places that know: Fantrax
// for the points, FPL for whether he is fit.
//
// The points read is `getTeamRosterInfo`, which answers per team — so this only
// has an answer for a player somebody owns. A free agent's season is not hidden,
// it is simply not on any team's table, and the page says that rather than
// showing a row of noughts.

/** One player's season in our league, as Fantrax scores it. */
export interface PlayerSeason {
  season: StatSeason;
  /** The categories that earned him points, largest contribution first, with the
   *  ones worth nothing dropped. Fantrax's own breakdown, and it sums to the
   *  total exactly — no scoring of ours is involved. */
  categories: { column: StatColumn; value: number }[];
  points: number | null;
  perGame: number | null;
}

/** The season code to ask for.
 *
 *  Fantrax defaults every stat read to a projection, so the code has to be sent,
 *  and it is published by exactly one endpoint. Asked for a single row — the
 *  list comes with any page size — and cached hard: it changes once a year. */
const yearToDate = unstable_cache(
  async (): Promise<string | undefined> => {
    const raw = await orRefusal(fetchPoolStats(FANTRAX_LEAGUE_ID, 1));
    // A code we could not look up is not a reason to compose one. Sending
    // nothing means Fantrax picks, and whatever it picks is read back and
    // labelled — which is what the page does with the answer anyway.
    //
    // Only their refusal is caught. A mapper throwing is our bug, and the bare
    // `catch` this replaced hid it behind their name.
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
 *  quietly answer false. The same trap is recorded against `squad/league.ts`.
 *  Nothing here needs to tell one refusal from another — an undrafted league
 *  answering `WARNING` and Fantrax being down both mean this section has no
 *  numbers to show, and it says so by not appearing. */
const readTeamStats = unstable_cache(
  async (teamId: string, season: string | undefined): Promise<TeamStats | null> => {
    try {
      return mapTeamStats(await fetchTeamStats(FANTRAX_LEAGUE_ID, teamId, season));
    } catch (error) {
      if (error instanceof FantraxError) return null;
      throw error;
    }
  },
  ["fantrax-team-stats", FANTRAX_LEAGUE_ID],
  { revalidate: PAGE_REVALIDATE },
);

export async function playerSeason(
  fantraxId: string,
  ownerTeamId: string | null,
): Promise<PlayerSeason | null> {
  if (ownerTeamId === null) return null;

  const stats = await readTeamStats(ownerTeamId, await yearToDate());
  if (stats === null) return null;

  for (const group of stats.groups) {
    const line = group.lines.find((entry) => entry.fantraxId === fantraxId);
    if (!line) continue;
    return {
      season: stats.season,
      points: line.points,
      perGame: line.perGame,
      categories: line.values
        .flatMap((value, index) =>
          value === null || value === 0 ? [] : [{ column: group.columns[index], value }],
        )
        // Biggest first, and the costly ones — cards, goals against — sort to the
        // bottom where they read as the deductions they are.
        .sort((a, b) => b.value - a.value),
    };
  }
  return null;
}

/** The football layer's view of the same man, if the bridge has settled him.
 *
 *  Null for the academy names Fantrax carries and FPL has never listed. That is
 *  a permanent correct state, not a gap to fill in later. */
export async function footballSelf(fantraxId: string): Promise<FootballPlayer | null> {
  const entry = bridge[fantraxId];
  if (!entry || isUnmapped(entry)) return null;
  return playerByCode(await footballNow()).get(entry.fplCode) ?? null;
}
