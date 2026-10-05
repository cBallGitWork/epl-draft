import { byPositionDepth } from "@epl/core";

// Fantrax's position letters, in the words a manager says them in.
//
// `getLeagueInfo` publishes the vocabulary as single letters — `G`, `D`, `M`,
// `F` — and publishes no long form anywhere in the payload (probed 19 Aug). So a
// readable label can only come from us, and CLAUDE.md's "never translate
// Fantrax's vocabulary" carries a documented exception for exactly this. It used
// to be one map inside `SquadRows`; seven render sites later it is a rule rather
// than a coincidence (CODE_RULES §1).
//
// **The rule survives in the fallback.** A letter this file has never seen is
// printed verbatim, so a commissioner who files wingers under `W` gets `W` in the
// place the pitch would put it, never a guess. The data is never translated —
// only the label is, at the moment it is drawn.
//
// Display only. Nothing here may be compared, sorted or stored: `slot.position`
// stays Fantrax's letter everywhere it is reasoned about, and `positionDepth` in
// the join layer is what orders a pitch.

/** The letters this league actually uses, as a manager says them. */
const SHORT: Record<string, string> = {
  G: "GK",
  D: "DEF",
  M: "MID",
  F: "FWD",
};

/** What a manager reads on a shirt: `GK`, `DEF`, `MID`, `FWD`.
 *
 *  Null and empty both answer `null` rather than a dash or a blank string, so
 *  each caller decides what nothing looks like in its own row — a pitch sticker
 *  wants `?`, a table column wants `—`, and a joined line wants to drop the
 *  segment entirely. */
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
