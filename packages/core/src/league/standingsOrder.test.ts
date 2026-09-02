import { describe, expect, it } from "vitest";
import { defaultDescending, isSortKey, sortRows } from "./standingsOrder";
import type { StandingsRow } from "./types";

function row(over: Partial<StandingsRow> & { teamId: string; rank: number }): StandingsRow {
  return {
    teamName: over.teamId,
    won: 0,
    drawn: 0,
    lost: 0,
    played: 0,
    points: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    ...over,
  };
}

/** Three rounds played, and `d` has conceded most while `a` has conceded least —
 *  so `against` and `for` disagree about the order, which is the only way to
 *  tell one is not standing in for the other. */
const TABLE: StandingsRow[] = [
  row({ teamId: "a", rank: 1, played: 3, won: 3, points: 9, pointsFor: 214, pointsAgainst: 140 }),
  row({ teamId: "b", rank: 2, played: 3, won: 2, lost: 1, points: 6, pointsFor: 181, pointsAgainst: 166 }),
  row({ teamId: "c", rank: 3, played: 3, won: 2, lost: 1, points: 6, pointsFor: 198, pointsAgainst: 152 }),
  row({ teamId: "d", rank: 4, played: 3, lost: 3, points: 0, pointsFor: 121, pointsAgainst: 190 }),
];

const order = (rows: readonly StandingsRow[]) => rows.map((r) => r.teamId).join("");

describe("isSortKey", () => {
  it("accepts the columns that are quantities", () => {
    for (const key of ["rank", "played", "won", "drawn", "lost", "for", "against", "pts"]) {
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

  it("rejects the keys the Fantrax columns were addressed by", () => {
    // `?sort=fp` and `?sort=gb` are live URLs until this ships. They must fall
    // back to Fantrax's own order, which is what an unknown key already does.
    for (const gone of ["record", "gb", "win", "fp"]) expect(isSortKey(gone)).toBe(false);
    // `in` walked the prototype chain and let these through, and the column
    // lookup after the guard then read `.of` off a function. A sort key arrives
    // in a URL, so `/league?sort=toString` was a 500 anybody could type.
    for (const inherited of ["toString", "constructor", "valueOf", "__proto__"]) {
      expect(isSortKey(inherited)).toBe(false);
    }
  });
});

describe("defaultDescending", () => {
  it("opens the who-is-best columns at the top", () => {
    expect(defaultDescending("pts")).toBe(true);
    expect(defaultDescending("for")).toBe(true);
    expect(defaultDescending("won")).toBe(true);
  });

  it("opens the columns you want the smallest of at the top", () => {
    // Descending would head a league table with its worst side.
    expect(defaultDescending("rank")).toBe(false);
    expect(defaultDescending("lost")).toBe(false);
    expect(defaultDescending("against")).toBe(false);
  });
});

describe("sortRows", () => {
  it("leaves Fantrax's own order alone", () => {
    expect(order(sortRows(TABLE, "rank", false))).toBe("abcd");
  });

  it("orders by a figure", () => {
    expect(order(sortRows(TABLE, "for", true))).toBe("acbd");
  });

  it("breaks a tie on Fantrax's rank, not on array order", () => {
    // b and c are both on 6 points. Fantrax ranks b above c, so b stays above c
    // whichever way the column is read — a table that reshuffles level teams
    // between refreshes is one a manager stops trusting.
    expect(order(sortRows(TABLE, "pts", true))).toBe("abcd");
    const shuffled = [TABLE[2], TABLE[0], TABLE[3], TABLE[1]];
    expect(order(sortRows(shuffled, "pts", true))).toBe("abcd");
  });

  it("orders fewest conceded first, which is not the for column's order", () => {
    expect(order(sortRows(TABLE, "against", false))).toBe("acbd");
    // Same result string as `for` descending above, and reached the other way
    // round: a is best on both, but c beats b on against by conceding less and
    // on for by scoring more. Read them apart on d, who is last on both, and on
    // the reversed direction.
    expect(order(sortRows(TABLE, "against", true))).toBe("dbca");
  });

  it("does not mutate its input", () => {
    const before = order(TABLE);
    sortRows(TABLE, "for", true);
    expect(order(TABLE)).toBe(before);
  });

  it("never rewrites rank", () => {
    expect(sortRows(TABLE, "for", true).map((r) => r.rank)).toEqual([1, 3, 2, 4]);
  });
});
