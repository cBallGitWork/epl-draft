import type { LeagueTransaction } from "../league/types";
import type { Deal } from "./types";

// The week's business, told as stories rather than as rows.
//
// Fantrax files each half of a transaction separately — a claim here, the drop
// that paid for it there, both halves of a trade in two places — joined only by
// a `setId`. Reading them apart gives a feed in which a manager signs somebody
// and, separately and mysteriously, loses somebody else. Reading them together
// is the whole job of this file.

/** Executed moves, newest first, one entry per transaction.
 *
 *  Pending proposals are dropped: a trade nobody has accepted is not news, and
 *  Fantrax's own default hides them too. Ordering follows the feed rather than
 *  the timestamp, because `processedAt` is an unparsed string in their format —
 *  and the feed already arrives newest first. */
export function deals(transactions: readonly LeagueTransaction[]): Deal[] {
  const bySet = new Map<string, Deal>();
  const order: string[] = [];

  for (const row of transactions) {
    if (!row.executed) continue;

    // A missing setId groups nothing, so each such row is its own story rather
    // than all of them collapsing into one under the empty string.
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

    // A drop and a claim are the two sides of one piece of business, which is
    // why `drop` is not a kind of its own up here.
    if (row.kind === "drop") deal.outbound.push(side(row, row.fromTeamId));
    else if (row.toTeamId !== null) deal.inbound.push(side(row, row.toTeamId));
    else deal.outbound.push(side(row, row.fromTeamId));

    // A trade names both sides explicitly, so it wins over a claim's shape if
    // the rows disagree about what this set is.
    if (row.kind === "trade") deal.kind = "trade";
  }

  return order.map((key) => bySet.get(key)).filter((deal): deal is Deal => deal !== undefined);
}

function side(row: LeagueTransaction, teamId: string | null) {
  return { playerName: row.playerName, teamId };
}
