import type { ProposedMove, TradeProposal } from "../proposals";

// Fantrax's pending page, `getPendingTransactions {txType: "TRADE"}`: the trades waiting on an answer that one of the
// session's own teams is in. Proposals never reach the transaction log, even with "executed only" off. Pure.

interface RawTeamRef {
  teamId?: string;
}

interface RawPendingMove {
  scorer?: { scorerId?: string; name?: string; teamShortName?: string; teamName?: string };
  from?: RawTeamRef;
  to?: RawTeamRef;
}

interface RawPendingTrade {
  txSetId?: string;
  creatorTeamId?: string;
  pending?: boolean;
  moves?: RawPendingMove[];
  /** Labelled facts, the proposal's stamp among them: `{name: "Proposed", value: "Oct 8, 11:53 AM BST"}`. */
  usefulInfo?: { name?: string; value?: string }[];
}

export interface RawPendingTrades {
  /** The team Fantrax answered for: one of the session's own, whatever was asked. */
  teamId?: string;
  /** Every team the session owns, each of which has its own answer. */
  myTeamIds?: string[];
  tradeInfoList?: RawPendingTrade[];
}

/** The proposals still pending in one answer, one per set; a move missing its man or both teams drops out. */
export function mapPendingTrades(raw: RawPendingTrades): TradeProposal[] {
  return (raw.tradeInfoList ?? []).flatMap((trade) => {
    if (trade.pending !== true || !trade.txSetId) return [];
    const moves = (trade.moves ?? []).flatMap((move): ProposedMove[] => {
      const scorer = move.scorer;
      if (!scorer?.scorerId || !scorer.name) return [];
      const fromTeamId = move.from?.teamId ?? null;
      const toTeamId = move.to?.teamId ?? null;
      if (fromTeamId === null && toTeamId === null) return [];
      return [{
        fantraxId: scorer.scorerId,
        playerName: scorer.name,
        club: scorer.teamShortName ?? null,
        clubName: scorer.teamName ?? null,
        fromTeamId,
        toTeamId,
      }];
    });
    if (moves.length === 0) return [];
    const teamIds = [...new Set(moves.flatMap((move) => [move.fromTeamId, move.toTeamId]))].filter(
      (id): id is string => id !== null,
    );
    return [{
      setId: trade.txSetId,
      creatorTeamId: trade.creatorTeamId ?? null,
      proposedAt: trade.usefulInfo?.find((fact) => fact.name === "Proposed")?.value ?? null,
      teamIds,
      moves,
    }];
  });
}
