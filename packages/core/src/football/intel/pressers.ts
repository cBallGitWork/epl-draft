import type { IntelManifest } from "./types";

// What a manager said about availability, as a signal rather than a sentence.
//
// **No quote reaches this file, and that is the contract's hard line, not a size
// decision** (`docs/providers/intel-export.md` §5). The tag is the export; the
// sentence that produced it is not. A verbatim line from a real manager is a
// republishing question this repo has not answered, and an invented one is what
// `voice/house.ts` forbids outright.

/** One thing a manager said about one player. The tag vocabulary is the sister
 *  repo's own, verbatim — a mapping table here would be a second vocabulary to
 *  keep in step, which is the failure `situation` already had. */
export interface PresserSignal {
  /** FPL's season-stable code. */
  code: number;
  /** His club's FPL code, for a man who moved. */
  club: number;
  tag: string;
  /** The agent's own 0–1. Below `FIRM` a signal is a hint, not a fact. */
  confidence: number;
  /** When the press conference was, not when it was parsed. */
  said: string;
  manager: string;
}

export interface IntelPressers {
  manifest: IntelManifest;
  rows: PresserSignal[];
}

/** Below this a signal is a hint and the column may not lead on it. 0.6 is the
 *  agent's own floor for its softer patterns ("look after him", "rest him");
 *  its explicit ones ("not risked", "managing his minutes") sit at 0.65. */
export const FIRM = 0.65;

/** The signals for one round's pressers, newest first — EVERY man, not only the
 *  ones this league holds.
 *
 *  **It filtered to held players until 18 Sep 2026** and Craig reversed it having
 *  read one: *"can mention other players too, even non owned, its important
 *  data."* He is right and the first rule was too tight. A draft manager decides
 *  who to claim as well as who to start, and a fit-again forward nobody owns is
 *  the most useful line in the column. Ownership is an ANNOTATION now, not a
 *  gate — the caller marks the men somebody holds. */
export function pressers(
  intel: IntelPressers | null,
  /** Only signals said on or after this instant — Thursday's pressers, not last
   *  week's. The caller owns the window; this file owns no clock. */
  since: string,
): PresserSignal[] {
  if (intel === null) return [];
  const floor = Date.parse(since);
  return intel.rows
    .filter((row) => {
      const at = Date.parse(row.said);
      // An unreadable instant is kept: a signal that cannot say when it was said
      // is still a signal, and dropping it would hide a real absence.
      return Number.isNaN(at) || Number.isNaN(floor) || at >= floor;
    })
    .sort((a, b) => Date.parse(b.said) - Date.parse(a.said));
}
