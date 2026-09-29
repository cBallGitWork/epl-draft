import type { MatchupState } from "./state";

// The facts one draft report may use, one block per match-up: where both sides stand, how they last met, the score as a
// verdict, who is still to play and the stories. No provider is named and no label announces itself, because the writer
// copies labels.

export type Cutoff = "saturday" | "week";

export interface TablePlace {
  rank: number;
  won: number;
  drawn: number;
  lost: number;
  /** Their last few results, oldest first, as W, D and L. */
  run: string;
}

export interface MatchupContext {
  state: MatchupState;
  places: { home: TablePlace | null; away: TablePlace | null };
  /** Their last meeting, in words ("test2 won it 40-31 in round two"); null when they have not met. */
  lastMeeting: string | null;
}

const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th")}`;
const place = (name: string, p: TablePlace | null) =>
  p === null ? null : `- ${name}: ${ordinal(p.rank)}, won ${p.won}, drawn ${p.drawn}, lost ${p.lost}${p.run === "" ? "" : `; last results ${p.run.split("").join(" ")}`}`;

export function matchupBlock(ctx: MatchupContext, cutoff: Cutoff): string {
  const { home, away, score, stillToPlay, stories } = ctx.state;
  return [
    `MATCH-UP: ${home.side.name} v ${away.side.name}`,
    ["WHERE THEY STAND before this round:", place(home.side.name, ctx.places.home), place(away.side.name, ctx.places.away)].filter((l) => l !== null).join("\n"),
    ctx.lastMeeting === null ? null : `LAST TIME: ${ctx.lastMeeting}.`,
    `${cutoff === "saturday" ? "THE SCORE after Saturday's matches" : "THE RESULT"}: ${score}.`,
    stillToPlay.length === 0 ? null : ["STILL TO PLAY:", ...stillToPlay.map((line) => `- ${line}`)].join("\n"),
    stories.length === 0 ? null : ["THE STORIES:", ...stories.map((line) => `- ${line}`)].join("\n"),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

export function buildDraftBrief(cutoff: Cutoff, gameweek: number, contexts: readonly MatchupContext[]): string {
  const when = cutoff === "saturday" ? "after Saturday's matches, with the rest of the round to come" : "at the end of the round";
  return [`DRAFT REPORT, gameweek ${gameweek}, ${when}. ${contexts.length} match-up${contexts.length === 1 ? "" : "s"}.`, ...contexts.map((c) => matchupBlock(c, cutoff))].join("\n\n=====\n\n");
}
