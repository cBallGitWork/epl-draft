import type { RosteredTeam } from "../join/roster";
import { rosteredPicks } from "./teamOfTheWeek";
import type { Pick } from "./types";

// The Points Dodgers: the men who did it on the bench, and the managers who
// put them there.
//
// The anti-eleven, and the best-natured cruelty the league has. The team of
// the week is a selection of the round's best; this is the round's best that
// their own managers left out — the same list, filtered the other way, so the
// two columns can never disagree about what a player did.
//
// **What he DID, never what he would have scored.** Fantrax prices only the
// active section, so a benched man has no points anywhere in any payload, and
// a "he'd have got you 11" figure would be one we made up. Goals, assists and
// clean sheets are countable football and stand on their own.

/** How many the column names. Enough for the joke to land across the league
 *  rather than picking on one manager, short enough to stay a column. */
export const DODGERS_SHOWN = 5;

export function dodgers(teams: readonly RosteredTeam[]): Pick[] {
  return rosteredPicks(teams)
    .filter((pick) => !pick.started)
    // Only men who actually did something: a benched player on nought is not a
    // dodger, he is a substitute, and the column would be listing every
    // reserve in the league.
    .filter((pick) => pick.goals > 0 || pick.assists > 0 || pick.cleanSheet)
    .slice(0, DODGERS_SHOWN);
}
