import { clubById, isUnmapped, playerByCode } from "@epl/core";
import type { Club, FootballPlayer } from "@epl/core";
import { footballNow } from "../../football";
import { bridge } from "../../squads";

// Which footballer a Fantrax id is, if anyone.
//
// **This file used to hold `playerSeason` as well** — Fantrax's per-category
// breakdown of a man's year, read off `getTeamRosterInfo`. Its one reader was
// the History tab's year-to-date block, and that block was removed on 4 Sep 2026
// (Craig: *"poitnless"*). The read went with it, and so did `Breakdown.tsx`,
// which was the only thing that drew it: when a screen goes, its pipeline rarely
// goes with it unless somebody follows the export back to a consumer.


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
