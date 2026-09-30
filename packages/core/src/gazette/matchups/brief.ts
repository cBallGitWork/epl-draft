import { ordinal } from "../../league/ordinal";
import type { Angle } from "./angle";
import type { SeasonFact } from "./form";
import type { OldBoy } from "./meetings";
import type { MatchupState } from "./state";

// The facts one draft report may use, one block per match-up: where both sides stand, how they last met, the score as a
// verdict, who is still to play and the stories. No provider is named and no label announces itself, because the writer
// copies labels.

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

const place = (name: string, p: TablePlace | null) =>
  p === null ? null : `- ${name}: ${ordinal(p.rank)}, won ${p.won}, drawn ${p.drawn}, lost ${p.lost}${p.run === "" ? "" : `; last results ${p.run.split("").join(" ")}`}`;

/** Where each side goes next, for a closing line; nothing after Saturday, with the gameweek still to finish. */
function nextBlock(ctx: MatchupContext): string | null {
  const line = (name: string, next: NextOpponent | null) => (next === null ? null : `- ${name} play ${next.name}${next.rank === null ? "" : `, ${ordinal(next.rank)} after this gameweek`}`);
  const lines = [line(ctx.state.home.side.name, ctx.next.home), line(ctx.state.away.side.name, ctx.next.away)].filter((l) => l !== null);
  return lines.length === 0 ? null : ["NEXT GAMEWEEK, may be left out:", ...lines].join("\n");
}

export function matchupBlock(ctx: MatchupContext, cutoff: Cutoff, n: number): string {
  const { home, away, score, stillToPlay, stories } = ctx.state;
  return [
    `MATCH-UP ${n}: ${home.side.name} v ${away.side.name}`,
    ["WHERE THEY STAND before this gameweek:", place(home.side.name, ctx.places.home), place(away.side.name, ctx.places.away)].filter((l) => l !== null).join("\n"),
    ctx.meetings.length === 0 ? null : ["THE MEETINGS:", ...ctx.meetings.map((line) => `- ${line}`)].join("\n"),
    `${cutoff === "saturday" ? "THE SCORE after Saturday's matches" : "THE RESULT"}: ${score}.`,
    stillToPlay.length === 0 ? null : ["STILL TO PLAY:", ...stillToPlay.map((line) => `- ${line}`)].join("\n"),
    // The bracketed kind tells the writer which frame a fact takes; it is never printed.
    ctx.form.length === 0 ? null : ["FORM AND THE TABLE:", ...ctx.form.map((f) => `- ${f.text} [${f.kind}]`)].join("\n"),
    stories.length + ctx.oldBoys.length === 0 ? null : ["THE STORIES:", ...[...stories, ...ctx.oldBoys.map((o) => o.line)].map((line) => `- ${line}`)].join("\n"),
    cutoff === "saturday" ? null : nextBlock(ctx),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

/** Each match-up's block, numbered from 1 in the order given: the lead first. */
export function draftBlocks(cutoff: Cutoff, contexts: readonly MatchupContext[]): string[] {
  return contexts.map((c, at) => matchupBlock(c, cutoff, at + 1));
}

export function buildDraftBrief(cutoff: Cutoff, gameweek: number, contexts: readonly MatchupContext[]): string {
  const when = cutoff === "saturday" ? "after Saturday's matches, with the rest of the gameweek to come" : "at the end of the gameweek";
  return [`DRAFT REPORT, gameweek ${gameweek}, ${when}. ${contexts.length} match-up${contexts.length === 1 ? "" : "s"}, the lead first.`, ...draftBlocks(cutoff, contexts)].join("\n\n=====\n\n");
}
