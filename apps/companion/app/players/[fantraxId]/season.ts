import { clubById, fplCodeOf, playerByCode } from "@epl/core";
import type { Club, FootballPlayer } from "@epl/core";
import { footballNow } from "../../football";
import { bridge } from "../../squads";

// Which footballer a Fantrax id is, if anyone.

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
  const code = fplCodeOf(bridge, fantraxId);
  if (code === null) return null;
  const snapshot = await footballNow();
  const player = playerByCode(snapshot).get(code);
  return player === undefined ? null : { player, club: clubById(snapshot).get(player.clubId) };
}
