import { FANTRAX_LEAGUE_ID, minimumsOf } from "@epl/core";
import limits from "../../../data/leagues/roster-limits.json";

// The fewest players this league may start at each position, for the planner.
//
// **A checked-in file and not an endpoint, because Fantrax has no endpoint for
// it.** `getLeagueInfo.rosterInfo.positionConstraints` carries `maxActive` and
// nothing else — counted across all three leagues, live and in every snapshot —
// while the commissioner's own setup page has a Min Active column that is
// switched ON and reads D 3 · M 2 · F 1 · G 1. `scripts/roster-limits.ts` reads
// that page with the commissioner's cookie and writes the file; nothing the app
// serves holds the cookie.
//
// Empty for a league the script could not read: the real league's setup page
// carries no position table until it has members, so the planner enforces no
// floor until it is re-run after the draft. `minimumsInForce` is read, not
// assumed: a commissioner who turns it off has no minimums whatever the boxes say.

/** What the league insists on, by position letter. */
export function rosterMinimums(): Record<string, number> {
  return minimumsOf(limits, FANTRAX_LEAGUE_ID) ?? {};
}
