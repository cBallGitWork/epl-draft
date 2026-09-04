import { FANTRAX_LEAGUE_ID, FantraxError, fetchPlayerProfile, mapPlayerProfile } from "@epl/core";
import type { Club, FootballPlayer, PlayerIntel } from "@epl/core";
import { orRefusal, tell } from "../../refusals";
import type { Unavailable } from "../../refusals";
import { getLeagueSquads } from "../../squads";
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
  /** The fantasy side holding him, by NAME — what the title bar puts in its
   *  brackets where Championship Manager puts the club (Craig, 4 Sep 2026).
   *  Null for a free agent, for a league Fantrax will not describe, and for the
   *  real league until 10 Oct; the bar then carries the name alone. */
  ownerName: string | null;
}

/** A player id that is not a player and a Fantrax that is not answering arrive as
 *  the same refusal, so this does not pretend to tell them apart with a 404. The
 *  tell goes on screen instead, which is what makes a mistyped URL diagnosable
 *  rather than mysterious. */
export async function subject(fantraxId: string): Promise<Subject | Unavailable> {
  const raw = await orRefusal(fetchPlayerProfile(FANTRAX_LEAGUE_ID, fantraxId));
  if (raw instanceof FantraxError) return { unavailable: tell(raw) };
  const intel = mapPlayerProfile(raw);
  // Both after the profile has succeeded, so neither can fail it. The football
  // half reads the snapshot every other screen keeps warm; the owner's name
  // comes off `getLeagueSquads`, which is one `leagueCache` entry shared with
  // `/league` and every squad page.
  const [football, ownerName] = await Promise.all([
    footballSelf(fantraxId),
    teamName(intel.ownerTeamId),
  ]);
  return { intel, football, ownerName };
}

/** The owning side's name for an id, or null.
 *
 *  **The id is Fantrax's own and the name is looked up rather than parsed out of
 *  the profile.** `PlayerIntel.league` carries a labelled row about ownership,
 *  but its label is Fantrax's wording and a screen keyed on that string breaks
 *  the day they reword it. The roster read already holds the pairing.
 *
 *  Every ordinary failure — no league, undrafted, Fantrax silent — comes back as
 *  null and the bar simply loses its brackets. */
async function teamName(ownerTeamId: string | null): Promise<string | null> {
  if (ownerTeamId === null) return null;
  const squads = await getLeagueSquads();
  if (!("period" in squads)) return null;
  return squads.period.teams.find((team) => team.teamId === ownerTeamId)?.teamName ?? null;
}
