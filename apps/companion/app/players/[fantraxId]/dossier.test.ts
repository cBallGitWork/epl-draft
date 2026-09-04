import { describe, expect, it } from "vitest";
import type { LeagueTransaction } from "@epl/core";
import { movesOf } from "./dossier";

const move = (over: Partial<LeagueTransaction> = {}): LeagueTransaction => ({
  setId: "s1", kind: "claim", fantraxId: "03gu4", playerName: "Harry Maguire",
  position: "D", club: "MUN", fromTeamId: null, toTeamId: "t1",
  processedAt: "Wed Aug 12, 2026, 9:14AM", period: 2, executed: true, ...over,
});

const NAMES = new Map([["t1", "test3"], ["t2", "test211"]]);

describe("movesOf", () => {
  it("keeps only his moves", () => {
    const rows = [move(), move({ fantraxId: "other", setId: "s2" })];
    expect(movesOf(rows, "03gu4", NAMES)).toHaveLength(1);
  });

  it("names both sides of a trade", () => {
    const [got] = movesOf([move({ kind: "trade", fromTeamId: "t2", toTeamId: "t1" })], "03gu4", NAMES);
    expect(got.fromName).toBe("test211");
    expect(got.toName).toBe("test3");
  });

  it("leaves a side null when there is nobody on it", () => {
    // Nobody owns a free agent, and a dropped man goes to the pool.
    const [claimed] = movesOf([move({ fromTeamId: null })], "03gu4", NAMES);
    expect(claimed.fromName).toBeNull();
    const [dropped] = movesOf([move({ kind: "drop", fromTeamId: "t1", toTeamId: null })], "03gu4", NAMES);
    expect(dropped.toName).toBeNull();
  });

  it("leaves a team it cannot name null rather than printing an id", () => {
    const [got] = movesOf([move({ toTeamId: "gone" })], "03gu4", NAMES);
    expect(got.toName).toBeNull();
    expect(got.transaction.toTeamId).toBe("gone");
  });

  it("reads newest first — the feed arrives oldest first", () => {
    const rows = [move({ setId: "old", period: 1 }), move({ setId: "new", period: 5 })];
    expect(movesOf(rows, "03gu4", NAMES).map((m) => m.transaction.setId)).toEqual(["new", "old"]);
  });

  it("keeps a pending move rather than hiding it", () => {
    // Fantrax distinguishes executed from proposed; carrying the flag is what
    // stops a reader mistaking one for the other.
    const [got] = movesOf([move({ executed: false })], "03gu4", NAMES);
    expect(got.transaction.executed).toBe(false);
  });

  it("has nothing to say about a man nobody has moved", () => {
    expect(movesOf([], "03gu4", NAMES)).toEqual([]);
  });
});
