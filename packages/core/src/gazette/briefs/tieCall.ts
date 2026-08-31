import type { StoryThread } from "../ledger";
import type { TieState } from "../tieState";
import { figure } from "./figure";
import { storylinesBlock } from "./storylines";

// The facts behind a mid-round call. Short on purpose: a call is a paragraph
// with a spine, not a report — the report comes when the round ends.

export interface TieCallBrief {
  gameweek: number;
  homeName: string;
  awayName: string;
  homePoints: number | null;
  awayPoints: number | null;
  /** Active men each side still has to come. */
  homeToPlay: number | null;
  awayToPlay: number | null;
  state: TieState;
  threads: readonly StoryThread[];
}

export function buildTieCallBrief(brief: TieCallBrief): string {
  const left = (name: string, toPlay: number | null) =>
    toPlay === null
      ? `${name}: men still to play unknown`
      : `${name}: ${toPlay} still to play`;

  return [
    `THE CALL, gameweek ${brief.gameweek}. ${brief.homeName} ${figure(brief.homePoints)}, ${brief.awayName} ${figure(brief.awayPoints)}. ${left(brief.homeName, brief.homeToPlay)}; ${left(brief.awayName, brief.awayToPlay)}.`,
    brief.state === "settled"
      ? "The trailing side has nobody left. This is decided in all but the arithmetic — write it as a call the paper is making, 'all but done', never as a final result: Fantrax has not settled the round and the paper does not pretend it has."
      : "The margin and the men left make this all but done, and the paper is calling it — clearly AS a call, with the small print that football has embarrassed better pundits. Never write it as a result.",
    storylinesBlock(brief.threads),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}
