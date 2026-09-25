import type { LeagueTransaction } from "../league/types";
import { orderKey } from "../league/fantrax/transactions";
import type { Deal } from "./types";

// The week's business, told as stories rather than as rows.
//
// Fantrax files each half of a transaction separately — a claim here, the drop
// that paid for it there, both halves of a trade in two places — joined only by
// a `setId`. Reading them apart gives a feed in which a manager signs somebody
// and, separately and mysteriously, loses somebody else. Reading them together
// is the whole job of this file.
//
// The rows arrive from more than one of Fantrax's views, because the view IS the
// type for a trade — claims and trades are two separate reads that have to be
// told as one week. Each read is newest-first on its own, so concatenating them
// gives every claim, then every trade, which is not a week.



/** Newest first, and feed order untouched unless every story can be dated.
 *
 *  A partial sort is the bad outcome here: one row we cannot read would decide
 *  where it sits by an accident of the comparator rather than by a fact, and the
 *  feed order it displaced was at least each provider view's own truth. So this
 *  is all-or-nothing — a format we stop understanding costs the section its
 *  interleaving, not its contents. */
function newestFirst(told: Deal[]): Deal[] {
  const keyed: { deal: Deal; key: number }[] = [];
  for (const deal of told) {
    const key = orderKey(deal.processedAt);
    if (key === null) return told;
    keyed.push({ deal, key });
  }
  return keyed.sort((a, b) => b.key - a.key).map((entry) => entry.deal);
}

/** Executed moves, newest first, one entry per transaction.
 *
 *  Pending proposals are dropped: a trade nobody has accepted is not news, and
 *  Fantrax's own default hides them too.
 *
 *  Takes the rows of every view the paper reads at once, because a week is not
 *  one of them. Ordering was the feed's until it had to be — one view arrives in
 *  order, several concatenated do not. */
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
    else if (row.toTeamId !== null) {
      deal.inbound.push(side(row, row.toTeamId));
      deal.via ??= row.via;
    }
    else deal.outbound.push(side(row, row.fromTeamId));

    // A trade names both sides explicitly, so it wins over a claim's shape if
    // the rows disagree about what this set is.
    if (row.kind === "trade") deal.kind = "trade";
  }

  const told = order.map((key) => bySet.get(key)).filter((deal): deal is Deal => deal !== undefined);
  return newestFirst(told);
}

function side(row: LeagueTransaction, teamId: string | null) {
  return { playerName: row.playerName, position: row.position, club: row.club, clubName: row.clubName, teamId };
}
