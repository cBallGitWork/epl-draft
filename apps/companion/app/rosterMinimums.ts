import { FANTRAX_LEAGUE_ID } from "@epl/core";
import limits from "../../../data/leagues/roster-limits.json";

// The fewest players this league may start at each position.
//
// **A checked-in file and not an endpoint, because Fantrax has no endpoint for
// it.** `getLeagueInfo.rosterInfo.positionConstraints` carries `maxActive` and
// nothing else — counted across all three leagues, live and in every snapshot —
// while the commissioner's own setup page has a Min Active column that is
// switched ON and reads D 3 · M 2 · F 1 · G 1. `scripts/roster-limits.ts` reads
// that page with the commissioner's cookie and writes the file; nothing the app
// serves holds the cookie.
//
// That makes it the labelled fallback CODE_RULES §3 allows, and the label is the
// point: `mapLeagueInfo` returns an EMPTY minimum because the endpoint publishes
// none, and this is the only place a number joins it. One caller — the planner —
// so the merge happens where it is used rather than being threaded through five
// callers of the mapper, four of which have no use for it.

interface Recorded {
  key: string;
  minimumsInForce?: boolean;
  positions?: { shortName: string; minActive: number }[];
  unreadable?: string;
}

/** What the league insists on, by position letter.
 *
 *  Empty for a league the script could not read — the real league's setup page
 *  carries no position table until it has members, so it will be empty until
 *  after the draft and the planner simply enforces no floor. That is the honest
 *  state: a floor we have not read is not a floor of nought, but there is
 *  nothing to enforce either way, and inventing one would be the confident wrong
 *  answer the domain rules forbid.
 *
 *  **`minimumsInForce` is read, not assumed.** It is a checkbox on the same
 *  page, and a commissioner who turns it off has no minimums whatever the boxes
 *  still say. */
export function rosterMinimums(): Record<string, number> {
  const league = (limits.leagues as Record<string, Recorded>)[FANTRAX_LEAGUE_ID];
  if (league === undefined || !league.minimumsInForce || league.positions === undefined) return {};
  return Object.fromEntries(
    league.positions
      .filter((position) => position.minActive > 0)
      .map((position) => [position.shortName, position.minActive]),
  );
}
