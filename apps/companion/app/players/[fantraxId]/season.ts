import { isUnmapped, playerByCode } from "@epl/core";
import type { FootballPlayer, StatColumn, StatSeason } from "@epl/core";
import { footballNow } from "../../football";
import { bridge } from "../../squads";
import { readTeamStats, yearToDate } from "../../teamStats";

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
