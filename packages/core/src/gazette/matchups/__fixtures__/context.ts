import type { Cutoff, MatchupContext } from "../brief";
import { matchupState } from "../state";
import type { DraftSide } from "../types";
import { LIMITS } from "./limits";
import { worthOf } from "./worth";

/** Two sides' match-up at a cut-off, at the league's prices, with nothing around it but what `over` gives. */
export function contextOf(home: DraftSide, away: DraftSide, over: Partial<Omit<MatchupContext, "state">> = {}, cutoff: Cutoff = "gameweek"): MatchupContext {
  return { state: matchupState({ home, away }, worthOf(), LIMITS, cutoff), places: { home: null, away: null }, meetings: [], form: [], oldBoys: [], ...over };
}
