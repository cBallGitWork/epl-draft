// What the sister repo hands over, and nothing about how it is drawn.
//
// **Untrusted, like any provider payload.** It arrives as a committed JSON file
// rather than over a wire, which changes nothing: it is written by a different
// repo on a different schedule, and `map.ts` parses it rather than asserting it.
//
// Everything here is keyed on FPL's **season-stable `code`**. The exporter emits
// codes and never per-season element ids, because these files are persisted and
// CODE_RULES §3 forbids persisting an id that is recycled each August.

/** Where a file came from and when, in one shape across all of them.
 *
 *  `exportedAt` is when the export ran; each source's own `mtime` rides along,
 *  because "the export is fresh" and "what it was built from is fresh" are
 *  different claims and only the second one catches a stalled pipeline. */
export interface IntelManifest {
  season: string;
  /** The round an XI predicts. Null on a file that is not per-round. */
  gameweek: number | null;
  exportedAt: string;
  rows: number;
  sources: { path: string; mtime: string | null }[];
  /** How many squad numbers were cleared as collisions — see `squadNumber`. */
  numberCollisions?: number;
}

/** One man on a club's books, as the sister repo files him. */
export interface IntelPlayer {
  /** FPL's season-stable player code. */
  code: number;
  /** FPL's three-letter club label, e.g. "ARS". */
  clubCode: string;
  /** His real-life position — `CB`, `LB`, `DM`, `RW`.
   *
   *  **Null is a real answer and a common one.** The exporter sends null for
   *  every man whose position came from FPL's `element_type`, because that is
   *  FPL's fantasy classification and not a fact about the footballer — the same
   *  rule that keeps position out of the football layer entirely
   *  (`football/types.ts`). 146 of 651 were null on the first export. */
  position: string | null;
  /** Which provider settled the position, carried even when it is null so a
   *  screen can say WHY there is none rather than only that there is none. */
  positionSource: string | null;
  secondaryPositions: string[];
  canCover: string[];
  /** The sister's depth chart within his club and position: 1 first choice, 2
   *  second, 3 third, 4 fringe, and **0 unavailable** — a loan out of the league
   *  or a contract expired, not a knock. */
  depthTier: number | null;
  /** His shirt number, or null.
   *
   *  Null in two different situations and the file does not distinguish them:
   *  nobody recorded one, or **the number collided inside his club** and the
   *  exporter gave it to whoever had the better claim. It cleared 111 on the
   *  first export, on this app's own rule for portraits — a wrong one is worse
   *  than none, because only one of the two looks like an answer. */
  squadNumber: number | null;
  status: string;
  expectedReturnGw: number | null;
  /** Who takes a set piece, as a RANK — `{ corners: 1 }` is the first choice,
   *  and a missing key means he is not in the order for that one.
   *
   *  Null for the four men in five nobody has ranked. FPL has no notion of this
   *  at all, which is why it comes across the bridge: it is the sister repo's
   *  own reading of who actually steps up. */
  setPieces: Record<string, number> | null;
  /** His position bucketed into a pitch line — `GK`, `CB`, `FB`, `DM`, `CM`,
   *  `AM`, `WF`, `CF`. The sister repo's own bucketing, not ours: it owns the
   *  football taxonomy and a second copy here is a second thing to be wrong.
   *  Null exactly where `position` is. */
  line: string | null;
}

export interface IntelSquads {
  manifest: IntelManifest;
  players: IntelPlayer[];
}

/** One man in a predicted eleven. */
export interface IntelStarter {
  code: number;
  /** How sure the source is, 0–1. Carried so a board can show the doubt rather
   *  than printing a prediction as a team sheet. */
  prob: number;
}

/** One club's predicted eleven and the shape it is predicted to play. */
export interface IntelClubXi {
  /** `4-2-3-1`, `3-4-3`, `3-4-2-1`, `4-3-3`. */
  formation: string;
  /** How many men the formation puts in each line, keyed as `line` is. Summing
   *  to eleven is the sister's own assertion; `map.ts` checks it again, because
   *  we take this over a wire. */
  slots: Record<string, number> | null;
  starters: IntelStarter[];
}

export interface IntelXi {
  manifest: IntelManifest;
  /** When the SOURCE fetched its prediction — not when we exported it. A
   *  prediction is stale when the source is stale, whatever we did afterwards. */
  fetchedAt: string | null;
  source: string | null;
  /** By FPL club code as a string, because a JSON object's keys are strings. */
  clubs: Record<string, IntelClubXi>;
}
