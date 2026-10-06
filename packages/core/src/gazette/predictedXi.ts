import type { Club } from "../football/types";
import type { IntelXi } from "../football/intel/types";
import { xiFault } from "../football/intel/map";
import { fullClubName } from "./clubNames";
import type { StoryLineup, StoryLineupMan, StoryLineupSide } from "./extras";

// The gameweek's predicted elevens by fixture; naming a man and his holder is the caller's `man`.

/** One fixture, as the football layer knows it. */
export interface PredictedTie {
  home: Club;
  away: Club;
  kickoff: string;
}

/** A fixture prints both elevens or neither, and a side every starter or none: refused, never repaired. */
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
    // By home club's printed name, alphabetically: Spurs file under T, Forest under N.
    .sort((a, b) => a.home.club.localeCompare(b.home.club));
}

/** One side in the source's own order (keeper, then the shape read out), never regrouped; null when short. */
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
