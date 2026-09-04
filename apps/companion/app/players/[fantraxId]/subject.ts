import { FANTRAX_LEAGUE_ID, FantraxError, fetchPlayerProfile, mapPlayerProfile } from "@epl/core";
import type { Club, FootballPlayer, PlayerIntel } from "@epl/core";
import { orRefusal, tell } from "../../refusals";
import type { Unavailable } from "../../refusals";
import { footballSelf } from "./season";

// Who this screen is about, read once for whichever tab is open.
//
// All four views need the same two things before they can draw anything: Fantrax
// on who he is, and the football layer on whether we have ever settled him. They
// were inline in `page.tsx` while there was one view; four callers is what moved
// them here (CODE_RULES §1).
//
// **One profile per tap, and that is the whole politeness policy.** Fantrax
// throttles `getPlayerProfile` at around 27 calls even batched, so this is fine
// for a man's page and unusable for a board. Nothing may loop over it.

export interface Subject {
  intel: PlayerIntel;
  /** The footballer behind the Fantrax id, and his club — null for the 88 in the
   *  pool the bridge has never settled. A permanent correct state, not a gap:
   *  those are academy names FPL has never listed. */
  football: { player: FootballPlayer; club: Club | undefined } | null;
}

/** A player id that is not a player and a Fantrax that is not answering arrive as
 *  the same refusal, so this does not pretend to tell them apart with a 404. The
 *  tell goes on screen instead, which is what makes a mistyped URL diagnosable
 *  rather than mysterious. */
export async function subject(fantraxId: string): Promise<Subject | Unavailable> {
  const raw = await orRefusal(fetchPlayerProfile(FANTRAX_LEAGUE_ID, fantraxId));
  if (raw instanceof FantraxError) return { unavailable: tell(raw) };
  const intel = mapPlayerProfile(raw);
  // After the profile has succeeded, so it cannot fail it. It reads the snapshot
  // every other screen keeps warm, which costs FPL nothing.
  return { intel, football: await footballSelf(fantraxId) };
}
