import { describe, expect, it } from "vitest";
import { breakdownOf, liveBreakdown } from "./breakdown";
import { mapTeamStats } from "./fantrax/stats";
import teamStats from "./fantrax/__fixtures__/teamStats.json";

// Against the recorded payload rather than a hand-built one: the claim worth
// testing is that Fantrax's own categories add up to Fantrax's own total, and a
// fixture we invented would only prove our arithmetic.

const stats = mapTeamStats(teamStats);

/** Every player in the recorded team, paired with his own group's header.
 *
 *  `pointsBreakdown` used to do this and had exactly one caller, which now reads
 *  the live scoreboard instead. The assertions below are about `breakdownOf` and
 *  were always about `breakdownOf`; only the loop over the two groups has moved
 *  out of the source and into the test that needed it. Keeper and outfielder
 *  stay separate right up to the lookup, which is what keeps a keeper's saves
 *  out from under an outfielder's goals against. */
const breakdown = new Map(
  stats.groups.flatMap((group) =>
    group.lines.map((line) => [line.fantraxId, breakdownOf(group.columns, line)] as const),
  ),
);

describe("breakdownOf, over a whole recorded team", () => {
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

describe("liveBreakdown", () => {
  const names = {
    "5010#6090": { code: "G", name: "Goals" },
    "5010#6120": { code: "Min", name: "Minutes Played" },
    "5010#6280": { code: "YC", name: "Yellow Cards" },
  };

  it("names the categories and sorts what he lost below what he earned", () => {
    expect(
      liveBreakdown(
        [
          { category: "5010#6120", value: 90, points: 2 },
          { category: "5010#6280", value: 1, points: -1 },
          { category: "5010#6090", value: 1, points: 5 },
        ],
        names,
      ),
    ).toEqual([
      { code: "G", name: "Goals", definition: null, points: 5 },
      { code: "Min", name: "Minutes Played", definition: null, points: 2 },
      { code: "YC", name: "Yellow Cards", definition: null, points: -1 },
    ]);
  });

  it("carries no definition, because the live feed publishes none", () => {
    // Fantrax's prose — "Awarded to a player who played at least 60 minutes…" —
    // is on the stat table's header and not on `getLeagueInfo`. A reader still
    // gets it, on the player's own page. Null rather than an invented sentence.
    const [line] = liveBreakdown([{ category: "5010#6090", value: 1, points: 5 }], names);
    expect(line.definition).toBeNull();
  });

  it("drops a category this league never described, rather than printing its id", () => {
    // The two leagues score different things. An identifier on screen is worse
    // than a line missing from a list that never claimed to be complete.
    expect(liveBreakdown([{ category: "5010#9999", value: 1, points: 4 }], names)).toEqual([]);
    expect(liveBreakdown([{ category: "5010#6090", value: 1, points: 5 }], {})).toEqual([]);
  });

  it("survives a league info cached before it carried any names", () => {
    // Not hypothetical: this threw on the first render after the field was
    // added, off a cache entry written by the deploy before it.
    expect(liveBreakdown([{ category: "5010#6090", value: 1, points: 5 }], undefined)).toEqual([]);
  });
});
