import type { Availability, PlayerState } from "@epl/core";
import { DASH, noteBesideChance } from "@epl/core";

const WORD: Record<PlayerState, string> = {
  fit: "Fit",
  doubt: "Doubtful",
  injured: "Injured",
  suspended: "Suspended",
  unavailable: "Unavailable",
};

/** His fitness row: FPL's note, or his state where it wrote none, and his chance, said once. */
export function condition(availability: Availability): { said: string; chance: string } {
  if (availability.state === "fit") return { said: WORD.fit, chance: "100%" };
  const note = noteBesideChance(availability.news, availability.chance);
  return {
    said: note || WORD[availability.state],
    chance: availability.chance === null ? DASH : `${availability.chance}%`,
  };
}
