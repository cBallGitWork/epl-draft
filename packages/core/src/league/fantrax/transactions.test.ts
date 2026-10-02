import { describe, expect, it } from "vitest";
import { mapTransactions } from "./transactions";
import type { RawTransactionHistory } from "./transactions";
import claimDrop from "./__fixtures__/txClaimDrop.json";
import trade from "./__fixtures__/txTrade.json";
import lineupChange from "./__fixtures__/txLineupChange.json";

// Recorded 12 Aug 2026 from the rehearsal league, minutes after the first real
// transactions the league has ever had: a trade at 9:13AM and a free-agent claim
// with its drop at 9:14AM. Both were also visible by diffing captures either
// side of them, which is how we know these rows describe what actually happened.

describe("mapTransactions, on a claim and the drop that paid for it", () => {
  const rows = mapTransactions(claimDrop as RawTransactionHistory, "CLAIM_DROP");

  it("reads both halves and names each one", () => {
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.kind)).toEqual(["claim", "drop"]);
    expect(rows.map((r) => r.playerName)).toEqual(["Kevin Schade", "Morgan Gibbs-White"]);
  });

  it("says how he was signed, and names his club in full", () => {
    // `claimType` is FA on 44 captured claims and WW on 3; a drop carries "".
    expect(rows.map((r) => r.via)).toEqual(["free agency", null]);
    expect(rows.map((r) => r.clubName)).toEqual(["Brentford", "Nottingham Forest"]);
  });

  it("ties them together with the set id Fantrax groups them by", () => {
    expect(rows[0]?.setId).toBe(rows[1]?.setId);
    expect(rows[0]?.setId).toBeTruthy();
  });

  // THE TRAP that costs half of every transaction. The team and the date cells
  // carry `rowspan: 2`, so the DROP row arrives with ONE cell — its gameweek —
  // and inherits the rest. A reader that takes each row's cells at face value
  // gets a drop with no team and no timestamp, and it looks like Fantrax sent
  // partial data rather than like we misread a table.
  it("carries spanned cells forward — the drop row states only its gameweek", () => {
    const table = (claimDrop as RawTransactionHistory).table;
    const dropRow = table?.rows?.[1];
    expect(dropRow?.cells?.map((c) => c.key)).toEqual(["week"]);

    // The date the drop ends up with is the one the CLAIM row spanned, read back
    // off the recording rather than restated here.
    const spannedDate = table?.rows?.[0]?.cells?.find((c) => c.key === "date");
    expect(spannedDate?.rowspan).toBe(2);
    expect(rows[1]?.processedAt).toBe(spannedDate?.content);
    expect(rows[1]?.fromTeamId).toBe(rows[0]?.toTeamId);
  });

  it("points a claim in from the pool and a drop back out to it", () => {
    // Null is the answer on the pool side. The free-agent pool is not a team,
    // and giving it an id would put a team in the feed that does not exist.
    expect(rows[0]).toMatchObject({ kind: "claim", fromTeamId: null });
    expect(rows[0]?.toTeamId).toBeTruthy();
    expect(rows[1]).toMatchObject({ kind: "drop", toTeamId: null });
    expect(rows[1]?.fromTeamId).toBeTruthy();
  });

  it("carries the player id we already join on", () => {
    // Fantrax's `scorerId` is the same id space as the rosters and the pool, so
    // the bridge takes this straight. Never name-match at runtime.
    //
    // Compared against the recording rather than against a copied-out literal:
    // the claim is that the mapper carries the id through, not that the id is
    // any particular string, and a re-recorded fixture should not need this
    // edited to stay true.
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

  // Trade rows carry no `transactionCode` at all — on this view the tab IS the
  // transaction type, which is why the view is a parameter rather than something
  // inferred from the payload.
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
    // Both rows state `from` and `to` themselves while sharing one date cell, so
    // a row's own value has to win over anything carried.
    expect(rows[0]?.fromTeamId).not.toBe(rows[1]?.fromTeamId);
    expect(rows[0]?.processedAt).toBe(rows[1]?.processedAt);
    expect(rows[0]?.processedAt).toBeTruthy();
  });

  // A status diff over captures sees the claim above and is blind to this: both
  // traded players stay rostered, so only their OWNER changes. That blindness is
  // why the native feed is the source and the diff is corroboration.
  it("is the case a status diff cannot see", () => {
    expect(rows.every((r) => r.fromTeamId !== null && r.toTeamId !== null)).toBe(true);
  });
});

describe("mapTransactions, on views and shapes with nothing in them", () => {
  it("returns nothing for a league that has not changed a lineup yet", () => {
    // Recorded genuinely empty: no period has started, so no lineup has been
    // set. When rows appear after 21 Aug this fixture gets re-recorded and this
    // test tightens rather than being deleted.
    expect(mapTransactions(lineupChange as RawTransactionHistory, "LINEUP_CHANGE")).toEqual([]);
  });

  it("degrades to empty rather than throwing on a stripped payload", () => {
    expect(mapTransactions({}, "TRADE")).toEqual([]);
    expect(mapTransactions({ table: {} }, "TRADE")).toEqual([]);
    expect(mapTransactions({ table: { rows: [] } }, "TRADE")).toEqual([]);
  });

  it("skips a row it cannot attribute to a player, without losing the row's span", () => {
    // A skipped row still consumes a span from the row above it. Dropping it
    // before resolving cells would shift every later row's date by one.
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
