import { clubById, fplCodeOf, playerByCode } from "@epl/core";
import type { Club, FootballPlayer } from "@epl/core";
import { footballNow } from "../../football";
import { bridge } from "../../squads";

/** The footballer a Fantrax id is, and his club, off one snapshot; null for a man FPL has never listed. */
export async function footballSelf(
  fantraxId: string,
): Promise<{ player: FootballPlayer; club: Club | undefined } | null> {
  const code = fplCodeOf(bridge, fantraxId);
  if (code === null) return null;
  const snapshot = await footballNow();
  const player = playerByCode(snapshot).get(code);
  return player === undefined ? null : { player, club: clubById(snapshot).get(player.clubId) };
}
