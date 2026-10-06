import { byPositionDepth } from "@epl/core";

// Fantrax's position letters in a manager's words; Fantrax publishes no long form. Display only: a letter not here
// prints as itself, and nothing here is compared, sorted or stored.

/** The letters this league actually uses, as a manager says them. */
const SHORT: Record<string, string> = {
  G: "GK",
  D: "DEF",
  M: "MID",
  F: "FWD",
};

/** What a manager reads on a shirt: `GK`, `DEF`, `MID`, `FWD`; null for none, so each caller draws its own nothing. */
export function positionLabel(position: string | null | undefined): string | null {
  if (!position) return null;
  return SHORT[position] ?? position;
}

/** A letter the league itself publishes, as a manager says it: never null, because the league named it. */
export const leaguePositionLabel = (position: string): string => positionLabel(position) ?? position;

/** Fantrax's comma-joined spelling of a man's positions (`"M,F"`) as the array everywhere else holds. */
export function positionsFromList(positions: string | null | undefined): string[] {
  if (!positions) return [];
  return positions.split(",").map((p) => p.trim());
}

/** Fantrax's letters back to front, blanks dropped: Saka arrives as "F,M" and prints M/F (Craig, 2 Sep). */
export function backToFront(positions: readonly string[]): string[] {
  return positions.filter((p) => p).sort(byPositionDepth);
}

/** Several eligible positions as one label: `MID` alone, `M/F` for two (Craig, 2 Sep: "make it M/F for space"). */
export function positionsLabel(positions: readonly string[]): string | null {
  const kept = backToFront(positions);
  if (kept.length === 0) return null;
  if (kept.length === 1) return leaguePositionLabel(kept[0]);
  // Fantrax's own letters, joined — which is what the short form IS.
  return kept.join("/");
}
