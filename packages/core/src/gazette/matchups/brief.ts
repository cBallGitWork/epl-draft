import type { Angle } from "./angle";
import { matchupBlock } from "./block";
import type { SeasonFact } from "./form";
import type { OldBoy } from "./meetings";
import type { MatchupState } from "./state";

// The facts one draft report may use, one block per match-up (`block.ts`), each built on the story the desk chose. No
// provider is named and no label announces itself, because the writer copies labels.

export type Cutoff = "saturday" | "gameweek";

export interface TablePlace {
  rank: number;
  won: number;
  drawn: number;
  lost: number;
  /** Their last few results, oldest first, as W, D and L. */
  run: string;
}

/** A side's opponent next gameweek, and his place once this one is added when that is known. */
export interface NextOpponent {
  name: string;
  rank: number | null;
}

export interface MatchupContext {
  state: MatchupState;
  places: { home: TablePlace | null; away: TablePlace | null };
  /** Their meetings as a record and the last of them, from the home side's view; empty when they have not met. */
  meetings: string[];
  /** Streaks, runs ended, returns to form, records and table moves for either side, each with its kind. */
  form: SeasonFact[];
  /** Stories from outside the gameweek's points: an old boy facing the side that let him go. */
  oldBoys: OldBoy[];
  /** Each side's opponent next gameweek; null when it has none. */
  next: { home: NextOpponent | null; away: NextOpponent | null };
  /** The story the desk chose (`angle.ts`); null for a match-up with nothing to tell but its result. */
  angle: Angle | null;
}

/** Each match-up's block, numbered from 1 in the order given: the lead first. */
export function draftBlocks(cutoff: Cutoff, contexts: readonly MatchupContext[]): string[] {
  return contexts.map((c, at) => matchupBlock(c, cutoff, at + 1));
}

export function buildDraftBrief(cutoff: Cutoff, gameweek: number, contexts: readonly MatchupContext[]): string {
  const when = cutoff === "saturday" ? "after Saturday's matches, with the rest of the gameweek to come" : "at the end of the gameweek";
  return [`DRAFT REPORT, gameweek ${gameweek}, ${when}. ${contexts.length} match-up${contexts.length === 1 ? "" : "s"}, the lead first.`, ...draftBlocks(cutoff, contexts)].join("\n\n=====\n\n");
}
