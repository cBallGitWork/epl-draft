// Our match rating out of ten, as data. Everything is in league points: the opponent and the
// parts move his points, and `marks` turns points into a mark. `rating.ts` holds no numbers.

export type PartName = "points" | "opponent" | "mistakes" | "extras";

export interface Term {
  stat: string;
  /** League points apiece. */
  points: number;
}

export interface Part {
  name: PartName;
  label: string;
  terms: readonly Term[];
}

export interface RatingWeights {
  /** Below this many minutes a man is rated only if one of `ratedAnyway` happened. */
  minMinutes: number;
  ratedAnyway: readonly string[];
  /** Goal and assist points scale by the opponent's defence, clean-sheet points by his attack:
   *  strength^exponent within the clamp, 1.0 the league average. */
  opponent: { exponent: number; min: number; max: number };
  parts: readonly Part[];
  /** League points → mark, straight lines between; below the first and above the last hold. */
  marks: readonly (readonly [number, number])[];
  /** The points his chances were worth: xG and xA at his goal and assist prices, plus shooting and
   *  key passes above an ordinary man's rate for his minutes. */
  underlying: { shots: number; keyPasses: number; ordinaryPer90: number };
}

export const RATING_WEIGHTS: RatingWeights = {
  minMinutes: 10,
  ratedAnyway: ["goals", "assists", "redCards", "ownGoals", "penaltiesMissed", "penaltySaves", "errorsLeadingToGoal"],
  opponent: { exponent: 1, min: 0.7, max: 1.5 },
  parts: [
    {
      name: "mistakes",
      label: "Chances missed and errors",
      terms: [
        { stat: "bigChancesMissed", points: -1 },
        { stat: "penaltiesMissed", points: -1 },
        { stat: "errorsLeadingToGoal", points: -2 },
        { stat: "errorsLeadingToShot", points: -0.5 },
        { stat: "penaltiesConceded", points: -1.5 },
        { stat: "dispossessed", points: -0.15 },
      ],
    },
    {
      name: "extras",
      label: "What the league does not score",
      terms: [
        { stat: "goalsOutsideBox", points: 1 },
        { stat: "penaltiesWon", points: 1 },
        { stat: "clearancesOffLine", points: 1.5 },
        { stat: "goalsPrevented", points: 1 },
      ],
    },
  ],
  marks: [
    [-4, 1],
    [0, 2.5],
    [2, 4.5],
    [6, 6.8],
    [10, 8.3],
    [16, 9.5],
    [22, 10],
  ],
  underlying: { shots: 0.25, keyPasses: 0.15, ordinaryPer90: 0.45 },
};
