import { describe, expect, it } from "vitest";
import { defaultDescending, isSortKey, sortRows } from "./standingsOrder";
import type { StandingsRow } from "./types";

function row(over: Partial<StandingsRow> & { teamId: string; rank: number }): StandingsRow {
  return {
    teamName: over.teamId,
    won: 0,
    drawn: 0,
    lost: 0,
    points: 0,
    pointsFor: 0,
    gamesBack: null,
    winPercentage: null,
    ...over,
  };
}

const TABLE: StandingsRow[] = [
  row({ teamId: "a", rank: 1, points: 9, pointsFor: 214, won: 3, gamesBack: 0, winPercentage: 1 }),
  row({ teamId: "b", rank: 2, points: 6, pointsFor: 181, won: 2, gamesBack: 1, winPercentage: 0.667 }),
  row({ teamId: "c", rank: 3, points: 6, pointsFor: 198, won: 2, gamesBack: 1, winPercentage: 0.667 }),
  row({ teamId: "d", rank: 4, points: 0, pointsFor: 121, won: 0, gamesBack: 3, winPercentage: 0 }),
];

const order = (rows: readonly StandingsRow[]) => rows.map((r) => r.teamId).join("");

describe("isSortKey", () => {
  it("accepts the columns that are quantities", () => {
    for (const key of ["rank", "record", "gb", "win", "fp", "pts"]) {
      expect(isSortKey(key)).toBe(true);
    }
  });

  it("rejects a column that is not one, and an absent one", () => {
    // `form` is a run of letters and `team` a name; neither is orderable, and a
    // stale link naming one must fall back rather than throw.
    expect(isSortKey("form")).toBe(false);
    expect(isSortKey("team")).toBe(false);
    expect(isSortKey(undefined)).toBe(false);
  });
});

describe("defaultDescending", () => {
  it("opens the who-is-best columns at the top", () => {
    expect(defaultDescending("pts")).toBe(true);
    expect(defaultDescending("fp")).toBe(true);
    expect(defaultDescending("win")).toBe(true);
  });

  it("opens the columns that already count from the leader at the top", () => {
    expect(defaultDescending("rank")).toBe(false);
    expect(defaultDescending("gb")).toBe(false);
  });
});

describe("sortRows", () => {
  it("leaves Fantrax's own order alone", () => {
    expect(order(sortRows(TABLE, "rank", false))).toBe("abcd");
  });

  it("orders by a figure", () => {
    expect(order(sortRows(TABLE, "fp", true))).toBe("acbd");
  });

  it("breaks a tie on Fantrax's rank, not on array order", () => {
    // b and c are both on 6 points. Fantrax ranks b above c, so b stays above c
    // whichever way the column is read — a table that reshuffles level teams
    // between refreshes is one a manager stops trusting.
    expect(order(sortRows(TABLE, "pts", true))).toBe("abcd");
    const shuffled = [TABLE[2], TABLE[0], TABLE[3], TABLE[1]];
    expect(order(sortRows(shuffled, "pts", true))).toBe("abcd");
  });

  it("sorts a side with no games-back last, never ahead of the leader", () => {
    // A nought would put him top; absence is not a lead.
    const withAbsence = [...TABLE, row({ teamId: "e", rank: 5, gamesBack: null })];
    expect(order(sortRows(withAbsence, "gb", false))).toBe("abcde");
  });

  it("does not mutate its input", () => {
    const before = order(TABLE);
    sortRows(TABLE, "fp", true);
    expect(order(TABLE)).toBe(before);
  });

  it("never rewrites rank", () => {
    expect(sortRows(TABLE, "fp", true).map((r) => r.rank)).toEqual([1, 3, 2, 4]);
  });
});
