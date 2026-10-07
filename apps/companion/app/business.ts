import {
  FANTRAX_LEAGUE_ID,
  FantraxError,
  type TransactionView,
  fetchTransactions,
  mapTransactions,
} from "@epl/core";
import { leagueCache } from "./leagueCache";
import { orRefusal } from "./refusals";

// The week's business: the transaction feed, read once and cached.

/** The views that make up a week's business: trade rows carry no `transactionCode`, so a trade is its own read. */
const DEAL_VIEWS: readonly TransactionView[] = ["CLAIM_DROP", "TRADE"];

/** The transaction feed, cached; a view Fantrax refuses costs only that view. */
export const readDeals = leagueCache("gazette-deals",
  async () => {
    const feeds = await Promise.all(
      DEAL_VIEWS.map(async (view) => {
        const raw = await orRefusal(fetchTransactions(FANTRAX_LEAGUE_ID, view));
        return raw instanceof FantraxError ? [] : mapTransactions(raw, view);
      }),
    );
    return { rows: feeds.flat() };
  },
  () => ({ rows: [] }),
);
