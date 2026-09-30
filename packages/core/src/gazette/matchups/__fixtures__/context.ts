import { pickAngle } from "../angle";
import type { Cutoff, MatchupContext } from "../brief";
import { matchupState } from "../state";
import { threadsOf } from "../threads";
import type { DraftSide } from "../types";
import { LIMITS } from "./limits";
import { worthOf } from "./worth";

/** Two sides' match-up at a cut-off in gameweek 5, at the league's prices, with nothing around it but what `over` gives,
 *  and the angle the desk would choose unless `over` sets one. */
export function contextOf(home: DraftSide, away: DraftSide, over: Partial<Omit<MatchupContext, "state">> = {}, cutoff: Cutoff = "gameweek"): MatchupContext {
  const ctx: MatchupContext = { state: matchupState({ home, away }, worthOf(), LIMITS, cutoff), places: { home: null, away: null }, form: [], oldBoys: [], next: { home: null, away: null }, angle: null, ...over };
  return over.angle !== undefined ? ctx : { ...ctx, angle: pickAngle(ctx, threadsOf(ctx, cutoff, worthOf(), 5), []) };
}
