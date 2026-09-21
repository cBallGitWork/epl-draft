import type { Club } from "../football/types";
import type { IntelXi } from "../football/intel/types";
import { xiFault } from "../football/intel/map";
import { fullClubName } from "./clubNames";
import type { StoryLineup, StoryLineupMan, StoryLineupSide } from "./extras";

// The round's predicted elevens, grouped by the match they are for.
//
// The join only. Naming a footballer and saying who holds him is the caller's,
// because both need reads this layer has no business making.

/** One fixture, as the football layer knows it. */
export interface PredictedTie {
  home: Club;
  away: Club;
  kickoff: string;
}

/** A tie prints both elevens or neither, and a side prints eleven men or none.
 *
 *  Refused rather than repaired, on `xiFault`'s precedent: ten names under a
 *  4-2-3-1 is a team sheet disagreeing with its own heading, and half a fixture
 *  is a heading naming two clubs above one of them. The body says how many of
 *  the round's ties survived, so a missing match is stated and not silent. */
export function predictedLineups(
  ties: readonly PredictedTie[],
  xi: IntelXi | null,
  man: (code: number) => StoryLineupMan | null,
): StoryLineup[] {
  if (xi === null) return [];
  return ties
    .flatMap((tie) => {
      const home = side(tie.home, xi, man);
      const away = side(tie.away, xi, man);
      return home === null || away === null ? [] : [{ home, away, kickoff: tie.kickoff }];
    })
    // By HOME club, alphabetically (Craig, 21 Sep 2026). On the printed name and
    // not FPL's: Spurs file under T, Forest under N.
    .sort((a, b) => a.home.club.localeCompare(b.home.club));
}

/** The source's own order is the line-up — keeper, then the shape read out —
 *  so it is printed as given and never regrouped. */
function side(
  club: Club,
  xi: IntelXi,
  man: (code: number) => StoryLineupMan | null,
): StoryLineupSide | null {
  // Keyed on the three-letter label the export writes, not on a numeric code.
  const predicted = xi.clubs?.[club.shortName];
  if (predicted === undefined || xiFault(predicted) !== null) return null;

  const men = predicted.starters.flatMap((starter) => {
    const named = man(starter.code);
    return named === null ? [] : [named];
  });
  if (men.length !== predicted.starters.length) return null;

  return { club: fullClubName(club.name), code: club.code, formation: predicted.formation, men };
}
