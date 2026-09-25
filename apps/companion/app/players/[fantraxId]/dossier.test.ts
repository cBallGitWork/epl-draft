import { describe, expect, it } from "vitest";
import type { LeagueTransaction } from "@epl/core";
import { joinedBy, movesOf } from "./dossier";

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

  it("reads newest first, by the date and not by the feed's order", () => {
    // The feed arrives newest-first PER VIEW, so a reverse would give oldest
    // first — and concatenating claims and trades leaves every claim before every
    // trade, which is not a history either. `orderKey` is the same comparison the
    // paper's week is built on.
    const rows = [
      move({ setId: "mid", processedAt: "Wed Aug 12, 2026, 9:14AM" }),
      move({ setId: "new", processedAt: "Fri Sep 4, 2026, 8:00AM" }),
      move({ setId: "old", processedAt: "Mon Aug 3, 2026, 11:30PM" }),
    ];
    expect(movesOf(rows, "03gu4", NAMES).map((m) => m.transaction.setId)).toEqual([
      "new",
      "mid",
      "old",
    ]);
  });

  it("leaves the feed order alone when one row cannot be dated", () => {
    // All-or-nothing: a row we cannot read would sit where the comparator
    // happened to put it, and the order it displaced was at least the view's own.
    const rows = [
      move({ setId: "a", processedAt: "Fri Sep 4, 2026, 8:00AM" }),
      move({ setId: "b", processedAt: null }),
    ];
    expect(movesOf(rows, "03gu4", NAMES).map((m) => m.transaction.setId)).toEqual(["a", "b"]);
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

describe("joinedBy", () => {
  it("is the latest executed move that put him with his holder", () => {
    const moves = movesOf(
      [
        move({ setId: "new", toTeamId: "t1", processedAt: "Tue Sep 22, 2026, 5:00AM" }),
        move({ setId: "old", toTeamId: "t1", processedAt: "Fri Sep 4, 2026, 8:00AM" }),
        move({ setId: "pending", toTeamId: "t1", executed: false, processedAt: "Wed Sep 23, 2026, 5:00AM" }),
      ],
      "03gu4",
      NAMES,
    );
    expect(joinedBy(moves, "t1")?.transaction.setId).toBe("new");
  });

  it("has none for a free agent, or a holder no move names", () => {
    const moves = movesOf([move({ toTeamId: "t1" })], "03gu4", NAMES);
    expect(joinedBy(moves, null)).toBeNull();
    expect(joinedBy(moves, "t2")).toBeNull();
  });
});
