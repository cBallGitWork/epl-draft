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

/** The same four as a heading over a group of them. */
const GROUP: Record<string, string> = {
  G: "Goalkeepers",
  D: "Defenders",
  M: "Midfielders",
  F: "Forwards",
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

/** Several eligible positions as one label: `MID/FWD`.
 *
 *  Fantrax lets a man hold more than one and 48 of 607 in this pool do. Which of
 *  them he is *scored* at is his manager's choice and lives on the roster slot,
 *  never here — this only says what he is allowed to be. */
export function positionsLabel(positions: readonly string[]): string | null {
  const labelled = positions.map((p) => positionLabel(p)).filter((p): p is string => p !== null);
  return labelled.length === 0 ? null : labelled.join("/");
}

/** A heading over everyone playing there: `Defenders`.
 *
 *  Spelled out rather than `DEF`, because a heading has the room and a column of
 *  three-letter headings reads as a form. Unknown letters print verbatim on the
 *  same rule as `positionLabel`. */
export function positionGroup(position: string): string {
  return GROUP[position] ?? position;
}
