import type { MatchupState } from "./state";

// The facts one draft report may use, one block per match-up: where both sides stand, how they last met, the score in
// fantasy terms and the men worth a line. No provider is named, because the writer copies labels.

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
  const { home, away } = ctx.state;
  const [score, ...rest] = ctx.state.lines;
  return [
    `MATCH-UP: ${home.side.name} v ${away.side.name}`,
    ["WHERE THEY STAND before this round:", place(home.side.name, ctx.places.home), place(away.side.name, ctx.places.away)].filter((l) => l !== null).join("\n"),
    ctx.lastMeeting === null ? null : `LAST TIME: ${ctx.lastMeeting}.`,
    `${cutoff === "saturday" ? "THE SCORE after Saturday's matches" : "THE FINAL SCORE"}: ${score}.`,
    rest.length === 0 ? null : ["WORKED OUT FOR YOU, true as written:", ...rest.map((line) => `- ${line}`)].join("\n"),
    ["THE MEN WHO SCORED MOST:", ...(["home", "away"] as const).map((s) => `- ${ctx.state[s].side.name}: ${topScorers(ctx.state[s].side.eleven)}`)].join("\n"),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

function topScorers(men: MatchupState["home"]["side"]["eleven"]): string {
  const top = [...men].filter((m) => m.points !== null && m.points > 0).sort((a, b) => (b.points ?? 0) - (a.points ?? 0)).slice(0, 3);
  return top.length === 0 ? "nobody has scored yet" : top.map((m) => `${m.name} (${m.club}) ${m.points}`).join(", ");
}

export function buildDraftBrief(cutoff: Cutoff, gameweek: number, contexts: readonly MatchupContext[]): string {
  const when = cutoff === "saturday" ? "after Saturday's matches, with the rest of the round to come" : "at the end of the round";
  return [`DRAFT REPORT, gameweek ${gameweek}, ${when}. ${contexts.length} match-up${contexts.length === 1 ? "" : "s"}.`, ...contexts.map((c) => matchupBlock(c, cutoff))].join("\n\n=====\n\n");
}
