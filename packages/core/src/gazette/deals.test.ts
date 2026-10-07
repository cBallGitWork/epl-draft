import { describe, expect, it } from "vitest";
import type { LeagueTransaction } from "../league/types";
import { deals } from "./deals";

const tx = (over: Partial<LeagueTransaction> & { fantraxId: string }): LeagueTransaction => ({
  setId: "s1", kind: "claim", playerName: "A Player", position: null, club: null, clubName: null, via: null, fromTeamId: null,
  toTeamId: null, processedAt: "Wed Aug 12, 2026, 9:14AM", period: 1, executed: true, resultCode: null, ...over,
});

describe("deals", () => {
  it("tells a claim and the drop that paid for it as one story", () => {
    // Fantrax files these as two rows sharing a setId. Read apart, the feed says
    // a manager signed somebody and separately, mysteriously, lost somebody.
    const told = deals([
      tx({ fantraxId: "in", playerName: "Schade", kind: "claim", toTeamId: "t1" }),
      tx({ fantraxId: "out", playerName: "Gibbs-White", kind: "drop", fromTeamId: "t1" }),
    ]);
    expect(told).toHaveLength(1);
    expect(told[0].inbound.map((p) => p.playerName)).toEqual(["Schade"]);
    expect(told[0].outbound.map((p) => p.playerName)).toEqual(["Gibbs-White"]);
  });

  it("tells both halves of a trade as one story, and calls it a trade", () => {
    const told = deals([
      tx({ setId: "t", fantraxId: "a", playerName: "One", kind: "trade", fromTeamId: "t1", toTeamId: "t2" }),
      tx({ setId: "t", fantraxId: "b", playerName: "Two", kind: "trade", fromTeamId: "t2", toTeamId: "t1" }),
    ]);
    expect(told).toHaveLength(1);
    expect(told[0].kind).toBe("trade");
    expect(told[0].inbound).toHaveLength(2);
  });

  it("leaves a proposal out of the paper", () => {
    // A trade nobody has accepted is not news, and mistaking one for a fact
    // would report a squad that does not exist.
    expect(deals([tx({ fantraxId: "x", executed: false })])).toEqual([]);
  });

  it("keeps unrelated deals apart when Fantrax sends no setId", () => {
    // Grouping on the empty string would collapse the whole week into one story.
    const told = deals([
      tx({ setId: "", fantraxId: "a", playerName: "One", toTeamId: "t1" }),
      tx({ setId: "", fantraxId: "b", playerName: "Two", toTeamId: "t2" }),
    ]);
    expect(told).toHaveLength(2);
  });

  it("keeps the feed's order, which is newest first", () => {
    const told = deals([
      tx({ setId: "a", fantraxId: "1", playerName: "Newest", toTeamId: "t1" }),
      tx({ setId: "b", fantraxId: "2", playerName: "Older", toTeamId: "t1",
        processedAt: "Tue Aug 11, 2026, 9:14AM" }),
    ]);
    expect(told.map((m) => m.inbound[0].playerName)).toEqual(["Newest", "Older"]);
  });

  it("tells one week from two views rather than every claim then every trade", () => {
    // Claims and trades are separate reads, each newest-first on its own. The
    // trade here happened a minute before the claim and belongs below it.
    const told = deals([
      tx({ setId: "c", fantraxId: "1", playerName: "Claimed", toTeamId: "t1",
        processedAt: "Wed Aug 12, 2026, 9:14AM" }),
      tx({ setId: "t", fantraxId: "2", playerName: "Traded", kind: "trade", toTeamId: "t2",
        processedAt: "Wed Aug 12, 2026, 9:13AM" }),
      tx({ setId: "c2", fantraxId: "3", playerName: "Older claim", toTeamId: "t1",
        processedAt: "Mon Aug 10, 2026, 4:02PM" }),
    ]);
    expect(told.map((m) => m.inbound[0].playerName)).toEqual(["Claimed", "Traded", "Older claim"]);
  });

  it("reads midnight and noon as Fantrax writes them", () => {
    // 12:30AM is the small hours and 12:30PM is lunchtime. Getting these the
    // wrong way round puts a whole day's business twelve hours out of place.
    const told = deals([
      tx({ setId: "a", fantraxId: "1", playerName: "Small hours", toTeamId: "t1",
        processedAt: "Wed Aug 12, 2026, 12:30AM" }),
      tx({ setId: "b", fantraxId: "2", playerName: "Lunchtime", toTeamId: "t1",
        processedAt: "Wed Aug 12, 2026, 12:30PM" }),
    ]);
    expect(told.map((m) => m.inbound[0].playerName)).toEqual(["Lunchtime", "Small hours"]);
  });

  it("leaves the order alone rather than half-sort a feed it cannot date", () => {
    // A date we stop understanding — a translated month, a changed format —
    // should cost the section its interleaving, not its contents. Deciding one
    // row's place by an accident of the comparator is the worse outcome.
    const told = deals([
      tx({ setId: "a", fantraxId: "1", playerName: "First", toTeamId: "t1",
        processedAt: "mer. 12 août 2026, 9:14" }),
      tx({ setId: "b", fantraxId: "2", playerName: "Second", toTeamId: "t1",
        processedAt: "Wed Aug 12, 2026, 9:15AM" }),
    ]);
    expect(told.map((m) => m.inbound[0].playerName)).toEqual(["First", "Second"]);
  });
});
