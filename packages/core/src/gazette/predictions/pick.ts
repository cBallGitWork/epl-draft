import { PREDICTIONS } from "../../config";

// Who Lawro backs in each tie, decided here and never by the writer. The favourite is Fantrax's
// higher projected total; on a close tie the first of his instincts that fires backs the other side,
// and Liverpool men overturn a gap twice as wide.

/** Why he went against the favourite, tried in this order: the football first, the loyalty last. */
export type Instinct = "doubt" | "defence" | "liverpool";
export const INSTINCTS: readonly Instinct[] = ["doubt", "defence", "liverpool"];

/** What the call reads of one side. Squad-level only: nothing here says who starts. */
export interface PickSide {
  teamId: string;
  /** Fantrax's projected total for the round; null when Fantrax gave none, which is not nought. */
  projected: number | null;
  /** The side's best man is out, or FPL gives him no better than an even chance. */
  bestManDoubt: boolean;
  /** Liverpool men anywhere in the squad. */
  liverpool: number;
  /** The back line's mean ease rank this round, 1 the kindest; null with no ratings. */
  backLineEase: number | null;
}

export interface PredictionCall {
  homeTeamId: string;
  awayTeamId: string;
  /** Null only when there were no numbers to call it from. */
  callsTeamId: string | null;
  /** Set only on a gut call, and then the numbers backed the other side. */
  instinct: Instinct | null;
  score: { home: number; away: number } | null;
  /** On paper close, for the brief's wording; never printed. */
  close: boolean;
}

export function callTie(home: PickSide, away: PickSide): PredictionCall {
  const tie = { homeTeamId: home.teamId, awayTeamId: away.teamId };
  if (home.projected === null || away.projected === null) {
    return { ...tie, callsTeamId: null, instinct: null, score: null, close: false };
  }
  // Level totals go to the home side of Fantrax's fixture list.
  const [favourite, underdog] = away.projected > home.projected ? [away, home] : [home, away];
  const top = favourite.projected as number;
  if (top <= 0) return { ...tie, callsTeamId: null, instinct: null, score: null, close: false };

  const gap = (top - (underdog.projected as number)) / top;
  const close = gap <= PREDICTIONS.closeShare;
  const reach = (each: Instinct) => (each === "liverpool" ? PREDICTIONS.liverpoolShare : PREDICTIONS.closeShare);
  const instinct = INSTINCTS.find((each) => gap <= reach(each) && fires(each, favourite, underdog)) ?? null;
  const winner = instinct === null ? favourite : underdog;
  const favouriteScore = Math.round(top);
  // A gut call wins by the one point the numbers would not give him.
  const winnerScore = instinct === null ? favouriteScore : favouriteScore + 1;
  const loserScore =
    instinct === null ? Math.min(Math.round(underdog.projected as number), winnerScore - 1) : favouriteScore;
  const scoreOf = (side: PickSide) => (side === winner ? winnerScore : loserScore);
  return {
    ...tie,
    callsTeamId: winner.teamId,
    instinct,
    score: { home: scoreOf(home), away: scoreOf(away) },
    close,
  };
}

/** Whether one instinct backs the underdog. */
function fires(instinct: Instinct, favourite: PickSide, underdog: PickSide): boolean {
  if (instinct === "doubt") return favourite.bestManDoubt;
  if (instinct === "liverpool") return underdog.liverpool - favourite.liverpool >= PREDICTIONS.liverpoolLead;
  if (favourite.backLineEase === null || underdog.backLineEase === null) return false;
  return favourite.backLineEase - underdog.backLineEase >= PREDICTIONS.defenceEdge;
}
