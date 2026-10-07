import { describe, expect, it } from "vitest";
import { mapTransactions } from "./transactions";
import type { RawTransactionHistory } from "./transactions";
import claimDrop from "./__fixtures__/txClaimDrop.json";
import trade from "./__fixtures__/txTrade.json";
import lineupChange from "./__fixtures__/txLineupChange.json";

// Recorded from the rehearsal league's first transactions: a trade, and a free-agent claim with its drop.

describe("mapTransactions, on a claim and the drop that paid for it", () => {
  const rows = mapTransactions(claimDrop as RawTransactionHistory, "CLAIM_DROP");

  it("reads both halves and names each one", () => {
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.kind)).toEqual(["claim", "drop"]);
    expect(rows.map((r) => r.playerName)).toEqual(["Kevin Schade", "Morgan Gibbs-White"]);
  });

  it("says how he was signed, and names his club in full", () => {
    // `claimType` is FA or WW on a claim, and "" on a drop.
    expect(rows.map((r) => r.via)).toEqual(["free agency", null]);
    expect(rows.map((r) => r.clubName)).toEqual(["Brentford", "Nottingham Forest"]);
  });

  it("ties them together with the set id Fantrax groups them by", () => {
    expect(rows[0]?.setId).toBe(rows[1]?.setId);
    expect(rows[0]?.setId).toBeTruthy();
  });

  // The team and date cells carry `rowspan: 2`, so the DROP row arrives with only its gameweek and inherits the rest.
  it("carries spanned cells forward — the drop row states only its gameweek", () => {
    const table = (claimDrop as RawTransactionHistory).table;
    const dropRow = table?.rows?.[1];
    expect(dropRow?.cells?.map((c) => c.key)).toEqual(["week"]);

    // The date the CLAIM row spanned, read back off the recording.
    const spannedDate = table?.rows?.[0]?.cells?.find((c) => c.key === "date");
    expect(spannedDate?.rowspan).toBe(2);
    expect(rows[1]?.processedAt).toBe(spannedDate?.content);
    expect(rows[1]?.fromTeamId).toBe(rows[0]?.toTeamId);
  });

  it("points a claim in from the pool and a drop back out to it", () => {
    // The pool side is null: the free-agent pool is not a team.
    expect(rows[0]).toMatchObject({ kind: "claim", fromTeamId: null });
    expect(rows[0]?.toTeamId).toBeTruthy();
    expect(rows[1]).toMatchObject({ kind: "drop", toTeamId: null });
    expect(rows[1]?.fromTeamId).toBeTruthy();
  });

  it("carries the player id we already join on", () => {
    // `scorerId` is the roster and pool id, so the bridge takes it straight; compared to the recording, not a literal.
    const scorers = (claimDrop as RawTransactionHistory).table?.rows?.map(
      (row) => row.scorer?.scorerId,
    );
    expect(rows.map((r) => r.fantraxId)).toEqual(scorers);
    expect(scorers?.every(Boolean)).toBe(true);
  });

  it("records the period the move takes effect in, and that it executed", () => {
    expect(rows.every((r) => r.period === 1)).toBe(true);
    expect(rows.every((r) => r.executed)).toBe(true);
  });
});

describe("mapTransactions, on a trade", () => {
  const rows = mapTransactions(trade as RawTransactionHistory, "TRADE");

  // Trade rows carry no `transactionCode`: on this view the tab is the type, so the view is a parameter.
  it("takes its type from the view, because the rows do not state one", () => {
    expect((trade as RawTransactionHistory).table?.rows?.[0]?.transactionCode).toBeUndefined();
    expect(rows.map((r) => r.kind)).toEqual(["trade", "trade"]);
  });

  it("names both directions, and they are mirror images", () => {
    expect(rows).toHaveLength(2);
    const [out, back] = rows;
    expect(out?.playerName).toBe("Adrien Truffert");
    expect(back?.playerName).toBe("Gabriel Magalhaes");
    expect(out?.fromTeamId).toBe(back?.toTeamId);
    expect(out?.toTeamId).toBe(back?.fromTeamId);
  });

  it("keeps each row's own from and to over the inherited date", () => {
    // Both rows state `from` and `to` while sharing a date cell, so a row's own value wins over a carried one.
    expect(rows[0]?.fromTeamId).not.toBe(rows[1]?.fromTeamId);
    expect(rows[0]?.processedAt).toBe(rows[1]?.processedAt);
    expect(rows[0]?.processedAt).toBeTruthy();
  });

  // A status diff over captures cannot see a trade: both men stay rostered and only their OWNER changes.
  it("is the case a status diff cannot see", () => {
    expect(rows.every((r) => r.fromTeamId !== null && r.toTeamId !== null)).toBe(true);
  });
});

describe("mapTransactions, on views and shapes with nothing in them", () => {
  it("returns nothing for a league that has not changed a lineup yet", () => {
    // Recorded empty, before any period started; re-record it once rows appear.
    expect(mapTransactions(lineupChange as RawTransactionHistory, "LINEUP_CHANGE")).toEqual([]);
  });

  it("degrades to empty rather than throwing on a stripped payload", () => {
    expect(mapTransactions({}, "TRADE")).toEqual([]);
    expect(mapTransactions({ table: {} }, "TRADE")).toEqual([]);
    expect(mapTransactions({ table: { rows: [] } }, "TRADE")).toEqual([]);
  });

  it("skips a row it cannot attribute to a player, without losing the row's span", () => {
    // A skipped row still consumes a span; dropping it before resolving cells shifts every later date by one.
    const raw: RawTransactionHistory = {
      table: {
        rows: [
          {
            scorer: { scorerId: "aaa", name: "First" },
            transactionCode: "CLAIM",
            txSetId: "s1",
            executed: true,
            cells: [
              { key: "team", content: "123", teamId: "t1", rowspan: 3 },
              { key: "date", content: "Wed Aug 12, 2026, 9:00AM", rowspan: 3 },
              { key: "week", content: "1" },
            ],
          },
          // No scorer at all — observed on Fantrax in a degraded league.
          { txSetId: "s1", cells: [{ key: "week", content: "1" }] },
          {
            scorer: { scorerId: "ccc", name: "Third" },
            transactionCode: "DROP",
            txSetId: "s1",
            executed: true,
            cells: [{ key: "week", content: "1" }],
          },
        ],
      },
    };

    const rows = mapTransactions(raw, "CLAIM_DROP");
    expect(rows.map((r) => r.fantraxId)).toEqual(["aaa", "ccc"]);
    expect(rows[1]?.processedAt).toBe("Wed Aug 12, 2026, 9:00AM");
    expect(rows[1]?.fromTeamId).toBe("t1");
  });

  it("prefers the team id to the team name, because managers rename teams", () => {
    const rows = mapTransactions(claimDrop as RawTransactionHistory, "CLAIM_DROP");
    // The cell's `content` is "test3"; what we keep is the id beside it.
    expect(rows[0]?.toTeamId).not.toBe("test3");
    expect(rows[0]?.toTeamId).toMatch(/^\w{8,}$/);
  });
});

describe("mapTransactions, on a waiver claim", () => {
  it("reads WW as a claim off waivers", () => {
    const raw: RawTransactionHistory = {
      table: { rows: [{ scorer: { scorerId: "070hc", name: "Brian Brobbey" }, transactionCode: "CLAIM", claimType: "WW", executed: true }] },
    };
    expect(mapTransactions(raw, "CLAIM_DROP")[0]?.via).toBe("waivers");
  });
});
