import type { Availability, PlayerState } from "@epl/core";
import { noteBesideChance } from "@epl/core";

const WORD: Record<Exclude<PlayerState, "fit">, string> = {
  doubt: "Doubtful",
  injured: "Injured",
  suspended: "Suspended",
  unavailable: "Unavailable",
};

/** FPL's note on a man who may miss out, his chance said once; null for a fit man, who needs no line. */
export function fitnessNote(availability: Availability): string | null {
  if (availability.state === "fit") return null;
  const said = noteBesideChance(availability.news, availability.chance) || WORD[availability.state];
  return availability.chance === null ? said : `${said}, ${availability.chance}% chance of playing`;
}
