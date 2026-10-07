import type { LeagueTransaction } from "./types";

// Trades proposed and not yet answered, off the trade log read with `executedOnly: false` as the commissioner.

/** One man in a proposal and which way he would go. */
export interface ProposedMove {
  fantraxId: string;
  playerName: string;
  club: string | null;
  clubName: string | null;
  fromTeamId: string | null;
  toTeamId: string | null;
}

export interface TradeProposal {
  setId: string;
  /** Fantrax's stamp, verbatim, US Eastern. */
  proposedAt: string | null;
  /** Every team in it, in the order the log first names them. */
  teamIds: string[];
  moves: ProposedMove[];
}

/** Fantrax's `resultCode` on a proposal still waiting for its answer. Empty until a pending row is seen: the three codes
 *  seen (`EXECUTED`, `TRADE_CANCELLED`, `TRADE_REJECTED`) all close a deal, and a guess could raise a banner forever. */
const OPEN_CODES: ReadonlySet<string> = new Set<string>();
const isOpen = (code: string | null) => code !== null && OPEN_CODES.has(code);

/** Proposals still waiting on an answer, one per set, in the log's order. */
export function openProposals(rows: readonly LeagueTransaction[]): TradeProposal[] {
  const bySet = new Map<string, TradeProposal>();
  for (const row of rows) {
    if (row.kind !== "trade" || row.executed || !isOpen(row.resultCode) || row.setId === "") continue;
    let proposal = bySet.get(row.setId);
    if (!proposal) {
      proposal = { setId: row.setId, proposedAt: row.processedAt, teamIds: [], moves: [] };
      bySet.set(row.setId, proposal);
    }
    for (const teamId of [row.fromTeamId, row.toTeamId]) {
      if (teamId !== null && !proposal.teamIds.includes(teamId)) proposal.teamIds.push(teamId);
    }
    proposal.moves.push({
      fantraxId: row.fantraxId,
      playerName: row.playerName,
      club: row.club,
      clubName: row.clubName,
      fromTeamId: row.fromTeamId,
      toTeamId: row.toTeamId,
    });
  }
  return [...bySet.values()];
}
