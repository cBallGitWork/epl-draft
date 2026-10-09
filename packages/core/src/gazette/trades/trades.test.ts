import { describe, expect, it } from "vitest";
import txTrade from "../../league/fantrax/__fixtures__/txTrade.json";
import { mapTransactions } from "../../league/fantrax/transactions";
import type { LeagueTransaction } from "../../league/types";
import { completedTrades, tradeSlot } from "./trades";

const row = (over: Partial<LeagueTransaction>): LeagueTransaction => ({
  setId: "t1",
  kind: "trade",
  fantraxId: "p1",
  playerName: "Bukayo Saka",
  position: "M",
  club: "ARS",
  clubName: "Arsenal",
  via: null,
  fromTeamId: "a",
  toTeamId: "b",
  processedAt: "Wed Oct 7, 2026, 9:13AM",
  period: 7,
  executed: true,
  ...over,
});

describe("completedTrades", () => {
  it("reads Fantrax's trade feed as one trade per set, each man with where he left and where he went", () => {
    const [trade, ...rest] = completedTrades(mapTransactions(txTrade, "TRADE"));
    expect(rest).toEqual([]);
    expect(trade.id).toBe("trm6y84gmsq41g2x");
    expect(trade.period).toBe(1);
    expect(trade.moves.map((m) => [m.playerName, m.fromTeamId, m.toTeamId])).toEqual([
      ["Adrien Truffert", "8enbgqo5msgb375j", "pbxm9fgimshcpazf"],
      ["Gabriel Magalhaes", "pbxm9fgimshcpazf", "8enbgqo5msgb375j"],
    ]);
  });

  it("files only executed trades with an id of their own, never a claim, a proposal or a set it cannot key", () => {
    const trades = completedTrades([
      row({ setId: "done" }),
      row({ setId: "pending", executed: false }),
      row({ setId: "claim", kind: "claim", fromTeamId: null }),
      row({ setId: "" }),
    ]);
    expect(trades.map((t) => t.id)).toEqual(["done"]);
  });

  it("drops a half with no team on one side, and a trade left with no man", () => {
    const trades = completedTrades([row({ setId: "x", toTeamId: null }), row({ setId: "y" }), row({ setId: "y", fantraxId: "p2", fromTeamId: null })]);
    expect(trades.map((t) => [t.id, t.moves.length])).toEqual([["y", 1]]);
  });

  it("orders trades newest first by Fantrax's stamp", () => {
    const trades = completedTrades([
      row({ setId: "old", processedAt: "Mon Oct 5, 2026, 9:00AM" }),
      row({ setId: "new", processedAt: "Thu Oct 8, 2026, 6:30PM" }),
    ]);
    expect(trades.map((t) => t.id)).toEqual(["new", "old"]);
  });
});

describe("tradeSlot", () => {
  it("keys a trade by its own id, so it files once however often it is seen", () => {
    expect(tradeSlot({ id: "trm6y84gmsq41g2x" })).toEqual({ key: "trade:trm6y84gmsq41g2x", slug: "here-we-go-trm6y84gmsq41g2x" });
  });
});
