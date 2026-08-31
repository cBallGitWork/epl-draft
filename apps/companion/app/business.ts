import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type TransactionView,
  fetchTransactions,
  mapTransactions,
  transactionDateLabel,
} from "@epl/core";
import { leagueCache } from "./leagueCache";
import { orRefusal } from "./refusals";

// The week's business: the transaction feed, read once and cached.

/** The views that make up a week's business.
 *
 *  Two reads rather than one because for a trade the view IS the type: trade rows
 *  carry no `transactionCode`, so a paper reading only `CLAIM_DROP` reports every
 *  waiver claim in the league and none of its trades.
 *
 *  `LINEUP_CHANGE` is captured daily but deliberately not read here. Benching
 *  somebody is not business anyone did with anyone, and on sixteen teams it would
 *  bury the two moves that are. */
const DEAL_VIEWS: readonly TransactionView[] = ["CLAIM_DROP", "TRADE"];

/** The transaction feed, cached and failure-tolerant.
 *
 *  A claim log we cannot read costs the paper a section, not the paper — and one
 *  view refusing costs it only that view, which is why each is caught on its own.
 *  It is its own cache entry rather than part of the squads read because it
 *  changes on a completely different rhythm — a few times a week, against every
 *  thirty seconds on a Saturday. */
export const readDeals = leagueCache("gazette-deals",
  async () => {
    const feeds = await Promise.all(
      DEAL_VIEWS.map(async (view) => {
        const raw = await orRefusal(fetchTransactions(FANTRAX_LEAGUE_ID, view));
        if (raw instanceof FantraxError) return { rows: [], at: null };
        return { rows: mapTransactions(raw, view), at: transactionDateLabel(raw) };
      }),
    );
    return {
      rows: feeds.flatMap((feed) => feed.rows),
      // Every view heads the column the same way; the first that answered wins.
      at: feeds.map((feed) => feed.at).find((label) => label !== null) ?? null,
    };
  },
);
