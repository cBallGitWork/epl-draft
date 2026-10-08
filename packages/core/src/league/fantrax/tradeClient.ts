import { fxpaRead } from "./fxpa";
import type { RawPositionRefs, RawTradeBlocks } from "./tradeBlock";
import type { RawPendingTrades } from "./pendingTrades";

// The trade market's reads. Fantrax shows it to members only, so the blocks and proposals carry the commissioner's session.

/** Every team's trade block, as the league's trade-block page asks for it. */
export function fetchTradeBlocks(leagueId: string, session: string): Promise<RawTradeBlocks> {
  return fxpaRead(leagueId, "getTradeBlocks", {}, session) as Promise<RawTradeBlocks>;
}

/** Fantrax's names for its position ids; public. */
export function fetchPositionRefs(leagueId: string): Promise<RawPositionRefs> {
  return fxpaRead(leagueId, "getRefObject", { type: "Position" }) as Promise<RawPositionRefs>;
}

/** The trades waiting on an answer that one of the session's own teams is in, as Fantrax's pending page asks; with no
 *  `teamId` Fantrax picks one of them and names the rest in `myTeamIds`. Nobody else's are readable. */
export function fetchPendingTrades(leagueId: string, session: string, teamId?: string): Promise<RawPendingTrades> {
  return fxpaRead(
    leagueId,
    "getPendingTransactions",
    { txType: "TRADE", ...(teamId === undefined ? {} : { teamId }) },
    session,
  ) as Promise<RawPendingTrades>;
}
