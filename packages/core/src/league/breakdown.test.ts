import { describe, expect, it } from "vitest";
import { breakdownOf, pointsBreakdown } from "./breakdown";
import { mapTeamStats } from "./fantrax/stats";
import teamStats from "./fantrax/__fixtures__/teamStats.json";

// Against the recorded payload rather than a hand-built one: the claim worth
// testing is that Fantrax's own categories add up to Fantrax's own total, and a
// fixture we invented would only prove our arithmetic.

const stats = mapTeamStats(teamStats);
const breakdown = pointsBreakdown(stats);

describe("pointsBreakdown", () => {
  it("explains every total exactly", () => {
    for (const group of stats.groups) {
      for (const line of group.lines) {
        const sum = (breakdown.get(line.fantraxId) ?? []).reduce((total, l) => total + l.points, 0);
        expect(sum).toBe(line.points);
      }
    }
  });

  it("names each category as Fantrax names it", () => {
    // The keeper: 63 minutes + 28 clean sheets − 11 goals against + 23 saves
    // − 2 bookings + 5 penalty saves + 3 assists = 109.
    expect(breakdown.get("02lz0")).toEqual([
      { code: "Min", name: "Minutes Played", definition: null, points: 63 },
      {
        code: "CS",
        name: "Clean Sheets On Field",
        definition: expect.stringContaining("at least 60 minutes"),
        points: 28,
      },
      { code: "Sv", name: "Saves", definition: null, points: 23 },
      {
        code: "PKS",
        name: "Penalty Kick Saves",
        definition: "Number of penalty kicks saved by the goalkeeper",
        points: 5,
      },
      {
        code: "A",
        name: "Assists (Official)",
        definition: expect.stringContaining("official assist"),
        points: 3,
      },
      { code: "YC", name: "Yellow Cards", definition: null, points: -2 },
      { code: "GA", name: "Goals Against", definition: expect.any(String), points: -11 },
    ]);
  });

  it("puts what a category cost him at the bottom", () => {
    // Largest first, so the deductions sort below the earnings and read as the
    // deductions they are.
    const outfielder = breakdown.get("05o4b") ?? [];
    expect(outfielder.map((line) => line.code)).toEqual(["Min", "CS", "G", "A", "YC", "GAO"]);
  });

  it("drops the categories that scored him nothing", () => {
    // Two printings of nothing and neither is a row: a bare dash for a category
    // he never registered, and a real nought. Games played goes the same way —
    // in this view it renders as 0, because a count of appearances is not a
    // score, which is why their own table leaves it out of the sum.
    const codes = (breakdown.get("05o4b") ?? []).map((line) => line.code);
    expect(codes).not.toContain("GP");
    expect(codes).not.toContain("RC");
  });

  it("keeps a keeper's columns off an outfielder's line", () => {
    // The two groups have different headers, and the pairing is per group. A
    // flat header would file saves under goals against.
    expect((breakdown.get("05nzu") ?? []).map((line) => line.code)).not.toContain("Sv");
  });

  it("has nothing to say about a player nobody rosters", () => {
    expect(breakdown.get("nobody")).toBeUndefined();
  });
});

describe("breakdownOf", () => {
  it("survives a row shorter than its header", () => {
    // Provider data: a row that arrives short lines up with the header it has
    // rather than pairing a value with a column that is not there.
    expect(
      breakdownOf([{ code: "G", name: "Goals" }], {
        fantraxId: "x",
        points: 6,
        perGame: null,
        values: [6, 4],
      }),
    ).toEqual([{ code: "G", name: "Goals", definition: null, points: 6 }]);
  });

  it("falls back on the short code when Fantrax names nothing", () => {
    expect(
      breakdownOf([{ code: "GAO", name: "" }], {
        fantraxId: "x",
        points: -3,
        perGame: null,
        values: [-3],
      }),
    ).toEqual([{ code: "GAO", name: "GAO", definition: null, points: -3 }]);
  });
});
