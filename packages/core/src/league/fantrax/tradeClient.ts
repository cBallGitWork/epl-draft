import { fxpaRead } from "./fxpa";
import type { RawPositionRefs, RawTradeBlocks } from "./tradeBlock";

// The trade market's reads. Fantrax shows it to members only, so the blocks carry the commissioner's session.

/** Every team's trade block, as the league's trade-block page asks for it. */
export function fetchTradeBlocks(leagueId: string, session: string): Promise<RawTradeBlocks> {
  return fxpaRead(leagueId, "getTradeBlocks", {}, session) as Promise<RawTradeBlocks>;
}

/** Fantrax's names for its position ids; public. */
export function fetchPositionRefs(leagueId: string): Promise<RawPositionRefs> {
  return fxpaRead(leagueId, "getRefObject", { type: "Position" }) as Promise<RawPositionRefs>;
}
