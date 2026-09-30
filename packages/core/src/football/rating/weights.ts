// Our match rating out of ten, as data. Each part is a list of stats at so many rating points
// apiece; `rating.ts` holds no numbers. Tuned on 25/26 (PLATFORM_NOTES, "Our player rating is…").

export type RatingPosition = "GK" | "DEF" | "MID" | "FWD";

/** A weight for every position, or only for those it names; an unnamed position scores nought. */
export type PerPosition = number | Partial<Record<RatingPosition, number>>;

/** Which of the opponent's ratings scales a term: his defence for a goal, his attack for a clean
 *  sheet, and his attack inverted for a goal conceded (a strong attack's goal costs less). */
export type OpponentScale = "defence" | "attack" | "attackInverse";

export type PartName =
  | "minutes" | "returns" | "keeping" | "attacking" | "waste" | "defending" | "passing" | "discipline";

export interface Term {
  stat: string;
  weight: PerPosition;
  opponent?: OpponentScale;
}

export interface Part {
  name: PartName;
  label: string;
  terms: readonly Term[];
}

export interface RatingWeights {
  /** The mark before anything happens at ninety minutes, and how far it slides by one minute.
   *  Set per position so each one's typical match lands at the same mark. */
  base: { full: PerPosition; cameoDrop: number };
  /** Below this many minutes a man is rated only if one of `ratedAnyway` happened. */
  minMinutes: number;
  ratedAnyway: readonly string[];
  /** A strength of 1.0 is the league average; the factor is strength^exponent within the clamp. */
  opponent: { exponent: number; min: number; max: number };
  parts: readonly Part[];
  /** Above `knee` each raw point counts `slope`, so only a season's biggest days reach the 10 cap. */
  curve: { knee: number; slope: number };
  /** How much of `vsExpected` the blended mark carries. */
  blend: number;
  /** FPL's clean-sheet rule: a man off before this cannot keep one, so none is expected of him. */
  cleanSheetMinutes: number;
}

export const RATING_WEIGHTS: RatingWeights = {
  base: { full: { GK: 6.0, DEF: 6.0, MID: 5.8, FWD: 6.15 }, cameoDrop: 0.5 },
  minMinutes: 10,
  ratedAnyway: ["goals", "assists", "redCards", "ownGoals", "penaltiesMissed", "penaltySaves", "errorsLeadingToGoal"],
  opponent: { exponent: 0.7, min: 0.75, max: 1.35 },
  parts: [
    {
      name: "returns",
      label: "Goals, assists, clean sheets",
      terms: [
        { stat: "openPlayGoals", weight: { GK: 1.6, DEF: 1.6, MID: 1.3, FWD: 1.1 }, opponent: "defence" },
        { stat: "penaltyGoals", weight: 0.6 },
        { stat: "goalsOutsideBox", weight: 0.3 },
        { stat: "assists", weight: 0.8, opponent: "defence" },
        { stat: "cleanSheet", weight: { GK: 0.8, DEF: 0.7, MID: 0.2 }, opponent: "attack" },
        { stat: "goalsAgainstOnPitch", weight: { GK: -0.2, DEF: -0.25 }, opponent: "attackInverse" },
        { stat: "penaltySaves", weight: { GK: 1.0 } },
      ],
    },
    {
      name: "keeping",
      label: "Saves and goals prevented",
      terms: [
        { stat: "saves", weight: { GK: 0.12 } },
        { stat: "goalsPrevented", weight: { GK: 0.5 } },
      ],
    },
    {
      name: "attacking",
      label: "Threat and creation",
      terms: [
        { stat: "nonPenaltyXg", weight: 0.5 },
        { stat: "xa", weight: 0.5 },
        { stat: "keyPasses", weight: 0.08 },
        { stat: "bigChancesCreated", weight: 0.15 },
        { stat: "shotsOnTarget", weight: 0.07 },
        { stat: "shotsOffPost", weight: 0.15 },
        { stat: "penaltiesWon", weight: 0.4 },
        { stat: "foulsSuffered", weight: 0.02 },
      ],
    },
    {
      name: "waste",
      label: "Chances and ball wasted",
      terms: [
        { stat: "bigChancesMissed", weight: -0.25 },
        { stat: "penaltiesMissed", weight: -1.2 },
        { stat: "dispossessed", weight: -0.04 },
      ],
    },
    {
      name: "defending",
      label: "Duels and defending",
      terms: [
        { stat: "duelsWon", weight: 0.07 },
        { stat: "duelsLost", weight: -0.06 },
        { stat: "tacklesWon", weight: 0.06 },
        { stat: "interceptions", weight: 0.04 },
        { stat: "clearances", weight: 0.03 },
        { stat: "blocks", weight: 0.07 },
        { stat: "recoveries", weight: 0.03 },
        { stat: "clearancesOffLine", weight: 0.5 },
      ],
    },
    {
      name: "passing",
      label: "Passing",
      terms: [{ stat: "accuratePasses", weight: 0.004 }],
    },
    {
      name: "discipline",
      label: "Cards and errors",
      terms: [
        { stat: "yellowCards", weight: -0.25 },
        { stat: "redCards", weight: -2.0 },
        { stat: "ownGoals", weight: -1.2 },
        { stat: "errorsLeadingToGoal", weight: -1.0 },
        { stat: "errorsLeadingToShot", weight: -0.2 },
        { stat: "penaltiesConceded", weight: -0.5 },
        { stat: "foulsCommitted", weight: -0.02 },
      ],
    },
  ],
  curve: { knee: 8.5, slope: 0.73 },
  blend: 0.35,
  cleanSheetMinutes: 60,
};
