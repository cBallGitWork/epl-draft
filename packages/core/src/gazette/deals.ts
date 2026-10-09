import type { LeagueTransaction } from "../league/types";
import { orderKey } from "../league/fantrax/transactions";
import type { Deal } from "./types";

// The week's business as stories: Fantrax files each half of a transaction as its own row, joined by `setId`.

/** Newest first, all or nothing: one undatable story leaves the feed's own order untouched. */
function newestFirst(told: Deal[]): Deal[] {
  const keyed: { deal: Deal; key: number }[] = [];
  for (const deal of told) {
    const key = orderKey(deal.processedAt);
    if (key === null) return told;
    keyed.push({ deal, key });
  }
  return keyed.sort((a, b) => b.key - a.key).map((entry) => entry.deal);
}

/** Executed moves, newest first, one per transaction, from the rows of every view read (claims and trades) at once. */
export function deals(transactions: readonly LeagueTransaction[]): Deal[] {
  const bySet = new Map<string, Deal>();
  const order: string[] = [];

  for (const row of transactions) {
    if (!row.executed) continue;

    // A row with no setId is its own story, never pooled under the empty string.
    const key = row.setId === "" ? `${row.fantraxId}:${row.kind}:${order.length}` : row.setId;

    let deal = bySet.get(key);
    if (!deal) {
      deal = {
        setId: row.setId,
        kind: row.kind === "drop" ? "claim" : row.kind,
        inbound: [],
        outbound: [],
        processedAt: row.processedAt,
        period: row.period,
      };
      bySet.set(key, deal);
      order.push(key);
    }

    // A drop is the outbound side of a claim, never a kind of its own.
    if (row.kind === "drop") deal.outbound.push(side(row, row.fromTeamId));
    else if (row.toTeamId !== null) {
      deal.inbound.push(side(row, row.toTeamId));
      deal.via ??= row.via;
    }
    else deal.outbound.push(side(row, row.fromTeamId));

    // A trade row wins when a set's rows disagree on its kind.
    if (row.kind === "trade") deal.kind = "trade";
  }

  const told = order.map((key) => bySet.get(key)).filter((deal): deal is Deal => deal !== undefined);
  return newestFirst(told);
}

function side(row: LeagueTransaction, teamId: string | null) {
  return { playerName: row.playerName, position: row.position, club: row.club, clubName: row.clubName, teamId };
}
