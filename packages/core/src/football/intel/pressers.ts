import { instantOf } from "../../time";
import type { IntelManifest } from "./types";

// What a manager said about availability, as a signal and as his own words: a quote is carried, never composed.

/** One thing a manager said about one player; `tag` is the sister repo's vocabulary, verbatim, never mapped. */
export interface PresserSignal {
  /** FPL's season-stable code. */
  code: number;
  /** His club's FPL code, for a man who moved. */
  club: number;
  tag: string;
  /** The complaint in the source's own word — "calf", "concussion"; absent on a signal about rotation. */
  condition?: string;
  /** The agent's own 0–1. Below `FIRM` a signal is a hint, not a fact. */
  confidence: number;
  /** When the press conference was, not when it was parsed. */
  said: string;
  manager: string;
}

/** One thing a manager actually said, verbatim, with its attribution. */
export interface PresserQuote {
  /** His club's FPL code. */
  club: number;
  /** His own words, with no quotation marks — the renderer adds those. */
  text: string;
  /** Who said it — the speaker's name, not an instant. */
  said: string;
  /** What he was asked about, when the source says. */
  about?: string;
  /** When the conference was — the day this quote belongs to. */
  at?: string;
}

/** A club that held a press conference, signal or not: a clean bill of health is news too. */
interface PresserSpoke {
  club: number;
  manager: string | null;
  at: string;
}

export interface IntelPressers {
  manifest: IntelManifest;
  rows: PresserSignal[];
  /** Absent on an export written before this member existed. */
  spoke?: PresserSpoke[];
  /** Absent on an export from before quotes were carried. */
  quotes?: PresserQuote[];
}

/** Below this a signal is a hint and the column may not lead on it. 0.6 is the
 *  agent's own floor for its softer patterns ("look after him", "rest him");
 *  its explicit ones ("not risked", "managing his minutes") sit at 0.65. */
export const FIRM = 0.65;

/** The export's tag for a man declared fit again: back from injury, in contention. */
export const FIT_AGAIN = "available";

/** The signals for one gameweek's pressers, newest first, for every man: ownership annotates, never filters. */
export function pressers(
  intel: IntelPressers | null,
  /** Only signals said on or after this instant; the caller owns the window and the clock. */
  since: string,
): PresserSignal[] {
  if (intel === null) return [];
  const floor = instantOf(since);
  return (intel.rows ?? [])
    .filter((row) => {
      const at = instantOf(row.said);
      // An unreadable instant is kept: dropping it would hide a real absence.
      return at === null || floor === null || at >= floor;
    })
    // An unreadable instant sorts last: a NaN comparison would scramble the readable ones around it.
    .sort((a, b) => (instantOf(b.said) ?? -Infinity) - (instantOf(a.said) ?? -Infinity) || 0);
}
