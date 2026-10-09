import type { LeagueTransaction } from "../../league/types";
import { newestFirst } from "../deals";

// A completed trade as the paper's Here We Go item: every man in it, where he left and where he went, keyed by
// Fantrax's own set id so a trade files once however many firings see it.

/** One man in a trade: both sides named, never the wire. */
export interface TradeMove {
  fantraxId: string;
  playerName: string;
  /** Fantrax's letters, "D" or "F,M"; null when the row carried none. */
  position: string | null;
  /** His real club in full, "Arsenal"; null when the row carried none. */
  clubName: string | null;
  fromTeamId: string;
  toTeamId: string;
}

export interface Trade {
  /** Fantrax's `txSetId`: the trade's own id, and the story's key. */
  id: string;
  /** Fantrax's stamp, verbatim. */
  processedAt: string | null;
  /** The period it takes effect in. */
  period: number | null;
  moves: TradeMove[];
}

/** Executed trades, newest first, one per set; a proposal, a claim or a row with no set id is no story. */
export function completedTrades(rows: readonly LeagueTransaction[]): Trade[] {
  const bySet = new Map<string, Trade>();
  for (const row of rows) {
    if (row.kind !== "trade" || !row.executed || row.setId === "") continue;
    const trade = bySet.get(row.setId) ?? { id: row.setId, processedAt: row.processedAt, period: row.period, moves: [] };
    bySet.set(row.setId, trade);
    // A half with no team on one side is a row we cannot tell, not a man who went to the wire.
    if (row.fromTeamId === null || row.toTeamId === null) continue;
    const { fantraxId, playerName, position, clubName, fromTeamId, toTeamId } = row;
    trade.moves.push({ fantraxId, playerName, position, clubName, fromTeamId, toTeamId });
  }
  return newestFirst([...bySet.values()].filter((trade) => trade.moves.length > 0));
}

/** The trade's covered-key and slug, both from its own id. */
export function tradeSlot(trade: Pick<Trade, "id">): { key: string; slug: string } {
  return { key: `trade:${trade.id}`, slug: `here-we-go-${trade.id}` };
}
