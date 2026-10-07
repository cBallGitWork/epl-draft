import { describe, expect, it } from "vitest";
import { mapTransactions } from "./fantrax/transactions";
import type { RawTransactionHistory } from "./fantrax/transactions";
import proposals from "./fantrax/__fixtures__/txTradeProposals.json";
import { openProposals } from "./proposals";

// Recorded 7 Oct 2026 with the commissioner's cookie: a set GlengarryHearts and The Raccoons cancelled, and one declined.
const LOG = mapTransactions(proposals as RawTransactionHistory, "TRADE");

describe("openProposals", () => {
  it("leaves out a trade that was cancelled, declined or done", () => {
    expect(LOG.map((row) => row.resultCode)).toContain("TRADE_CANCELLED");
    expect(LOG.map((row) => row.resultCode)).toContain("TRADE_REJECTED");
    expect(openProposals(LOG)).toEqual([]);
  });
});
