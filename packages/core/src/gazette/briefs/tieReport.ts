import type { StoryThread } from "../ledger";
import { figure } from "./figure";
import { storylinesBlock } from "./storylines";

// The facts behind one finished head-to-head.
//
// **One tie, one report, and never the round in a survey.** The paper ran a
// single round-report that spread across all five ties until 3 Sep 2026 — its
// prompt said in as many words "SPREAD ACROSS THE LEAGUE… a paper about a whole
// league that only mentions two managers has failed" — and Craig's ruling is the
// opposite: *"not the whole league in 1 article"*. A tie has two managers in it,
// which is how many a story can be about.
//
// It is the `tie-call`'s full-time twin and deliberately reads as one: the call
// is a paragraph with a spine and this is the report the call was promising.
// What it adds is the men — a call knows the totals and the clock, a report
// knows who did it.

/** One side of a finished tie: his total, and the men who made it. */
export interface TieReportSide {
  name: string;
  points: number | null;
  /** His scorers this period, best first, **priced at the slot he was filed
   *  in** — Fantrax scores the roster slot and not the player, so this is what
   *  the man was worth to THIS manager and not his season figure. */
  scorers: readonly { name: string; position: string | null; points: number }[];
}

export interface TieReportBrief {
  gameweek: number;
  home: TieReportSide;
  away: TieReportSide;
  threads: readonly StoryThread[];
}

/** How many of a side's men the brief names. Six: enough that a manager's round
 *  is described rather than summarised by its top man, and short enough that the
 *  writer is choosing between men rather than reading out a roster. */
const SCORERS_NAMED = 6;

function side(each: TieReportSide): string {
  if (each.scorers.length === 0) {
    return `${each.name} ${figure(each.points)} — no man of his has been priced yet.`;
  }
  const named = each.scorers
    .slice(0, SCORERS_NAMED)
    .map((man) => `${man.name}${man.position === null ? "" : ` (${man.position})`} ${man.points}`)
    .join(", ");
  return `${each.name} ${figure(each.points)} — ${named}.`;
}

export function buildTieReportBrief(brief: TieReportBrief): string {
  const { home, away, gameweek } = brief;
  // The margin is the one number neither side's total states, and it is what a
  // report is about. Absent rather than nought when either side is unpriced: a
  // margin of zero and a margin we cannot compute are different claims.
  const margin =
    home.points === null || away.points === null
      ? null
      : Math.abs(home.points - away.points);

  return [
    `THE TIE, gameweek ${gameweek}. ${home.name} ${figure(home.points)}, ${away.name} ${figure(away.points)}.${
      margin === null ? "" : ` ${margin === 0 ? "Level." : `Margin ${margin}.`}`
    }`,
    side(home),
    side(away),
    "The round is over and these are final. Write the TIE: what settled it, which men did it, and what the manager on the wrong end has to be annoyed about. Two managers, and no others — this is one head-to-head and not a round-up of the league.",
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}
