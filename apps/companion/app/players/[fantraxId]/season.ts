import { breakdownOf, clubById, isUnmapped, playerByCode } from "@epl/core";
import type { BreakdownLine, Club, FootballPlayer, StatSeason } from "@epl/core";
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
  categories: BreakdownLine[];
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
      // Biggest first, and the costly ones — cards, goals against — sort to the
      // bottom where they read as the deductions they are. Done in core, where
      // the live card on the head-to-head board reads the same shape out of the
      // same table.
      categories: breakdownOf(group.columns, line),
    };
  }
  return null;
}

/** The football layer's view of the same man, if the bridge has settled him —
 *  and the club he plays for, which his portrait needs as much as his name does.
 *
 *  Null for the academy names Fantrax carries and FPL has never listed. That is
 *  a permanent correct state, not a gap to fill in later.
 *
 *  The two travel together because they are read from one snapshot: fetching the
 *  player here and the club at the call site would be the same read twice, and
 *  the second one could disagree with the first. */
export async function footballSelf(
  fantraxId: string,
): Promise<{ player: FootballPlayer; club: Club | undefined } | null> {
  const entry = bridge[fantraxId];
  if (!entry || isUnmapped(entry)) return null;
  const snapshot = await footballNow();
  const player = playerByCode(snapshot).get(entry.fplCode);
  return player === undefined ? null : { player, club: clubById(snapshot).get(player.clubId) };
}
