import { describe, expect, it } from "vitest";
import { breakdownOf, columnLabel, liveBreakdown, bandCategories } from "./breakdown";
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
      { code: "Min", name: "Minutes Played", definition: null, points: 63, value: null },
      {
        code: "CS",
        name: "Clean Sheets On Field",
        definition: expect.stringContaining("at least 60 minutes"),
        points: 28,
        value: null,
      },
      { code: "Sv", name: "Saves", definition: null, points: 23, value: null },
      {
        code: "PKS",
        name: "Penalty Kick Saves",
        definition: "Number of penalty kicks saved by the goalkeeper",
        points: 5,
        value: null,
      },
      {
        code: "A",
        name: "Assists (Official)",
        definition: expect.stringContaining("official assist"),
        points: 3,
        value: null,
      },
      { code: "YC", name: "Yellow Cards", definition: null, points: -2, value: null },
      { code: "GA", name: "Goals Against", definition: expect.any(String), points: -11, value: null },
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

  it("states that it does not know what he DID, rather than inventing a count", () => {
    // The keeper is on 23 for saves and this view cannot say how many he made:
    // the FPTS cells ARE the points, so the count is the thing that view spent.
    // Null and never "23" — a figure repeated out of the points column would
    // read as a count and be one only where a category pays exactly 1 apiece.
    const keeper = breakdown.get("02lz0") ?? [];
    expect(keeper.length).toBeGreaterThan(0);
    expect(keeper.map((line) => line.value)).toEqual(keeper.map(() => null));
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
    ).toEqual([{ code: "G", name: "Goals", definition: null, points: 6, value: null }]);
  });

  it("falls back on the short code when Fantrax names nothing", () => {
    expect(
      breakdownOf([{ code: "GAO", name: "" }], {
        fantraxId: "x",
        points: -3,
        perGame: null,
        values: [-3],
      }),
    ).toEqual([{ code: "GAO", name: "GAO", definition: null, points: -3, value: null }]);
  });
});

describe("liveBreakdown", () => {
  const names = {
    "5010#6090": { code: "G", name: "Goals", longCode: "INDIVIDUAL_GOALS" },
    "5010#6120": { code: "Min", name: "Minutes Played", longCode: "INDIVIDUAL_MINUTES_PLAYED" },
    "5010#6280": { code: "YC", name: "Yellow Cards", longCode: "INDIVIDUAL_YELLOW_CARDS" },
  };

  it("names the categories and sorts what he lost below what he earned", () => {
    expect(
      liveBreakdown(
        [
          { category: "5010#6120", points: 2, value: "90" },
          { category: "5010#6280", points: -1, value: "1" },
          { category: "5010#6090", points: 5, value: "1" },
        ],
        names,
      ),
    ).toEqual([
      { code: "G", name: "Goals", definition: null, points: 5, value: "1" },
      { code: "Min", name: "Minutes Played", definition: null, points: 2, value: "90" },
      { code: "YC", name: "Yellow Cards", definition: null, points: -1, value: "1" },
    ]);
  });

  it("carries what he DID, which is the half the season table cannot state", () => {
    // "Minutes Played +2" is a price with the thing it priced left out. The live
    // payload carries both side by side, and this is the door they come through.
    const [line] = liveBreakdown([{ category: "5010#6120", points: 2, value: "90" }], names);
    expect(line.value).toBe("90");
  });

  it("keeps the count as the string Fantrax rendered, not a number", () => {
    // Read back to a person and never computed with — `sv` is the string they
    // already chose, and `av` is the arithmetic one nothing here wants.
    const [line] = liveBreakdown([{ category: "5010#6090", points: 5, value: "1" }], names);
    expect(line.value).toBe("1");
  });

  it("says nothing where Fantrax priced a category without stating a count", () => {
    const [line] = liveBreakdown([{ category: "5010#6090", points: 5, value: null }], names);
    expect(line.value).toBeNull();
  });

  it("carries no definition, because the live feed publishes none", () => {
    // Fantrax's prose — "Awarded to a player who played at least 60 minutes…" —
    // is on the stat table's header and not on `getLeagueInfo`. A reader still
    // gets it, on the player's own page. Null rather than an invented sentence.
    const [line] = liveBreakdown([{ category: "5010#6090", points: 5, value: "1" }], names);
    expect(line.definition).toBeNull();
  });

  it("drops a category this league never described, rather than printing its id", () => {
    // The two leagues score different things. An identifier on screen is worse
    // than a line missing from a list that never claimed to be complete.
    expect(liveBreakdown([{ category: "5010#9999", points: 4, value: "1" }], names)).toEqual([]);
    expect(liveBreakdown([{ category: "5010#6090", points: 5, value: "1" }], {})).toEqual([]);
  });

  it("survives a league info cached before it carried any names", () => {
    // Not hypothetical: this threw on the first render after the field was
    // added, off a cache entry written by the deploy before it.
    expect(liveBreakdown([{ category: "5010#6090", points: 5, value: "1" }], undefined)).toEqual([]);
  });
});

/** A column of the recorded header, by its code. Throws rather than asserting
 *  non-null, so a fixture that stops carrying the column fails as a missing
 *  column and not as a confusing `undefined`. */
function column(code: string) {
  for (const group of stats.groups) {
    const found = group.columns.find((c) => c.code === code);
    if (found) return found;
  }
  throw new Error(`no ${code} column in the recorded header`);
}

describe("columnLabel, over the same recorded header", () => {
  it("cuts Fantrax's prose definition off the label a column head prints", () => {
    // The rule this league scores a clean sheet by, published on a stat table's
    // header and nowhere else in the payload.
    const cs = columnLabel(column("CS"));
    expect(cs.name).toBe("Clean Sheets On Field");
    expect(cs.definition).toMatch(/^Awarded to a player who played at least 60 minutes/);
  });

  it("gives a column Fantrax defines by its name alone a null definition", () => {
    expect(columnLabel(column("Sv"))).toEqual({ name: "Saves", definition: null });
  });

  it("falls back to the code rather than printing an empty head", () => {
    expect(columnLabel({ code: "GAO", name: "" })).toEqual({ name: "GAO", definition: null });
    expect(columnLabel({ code: "GAO", name: " -- only a rule" })).toEqual({
      name: "GAO",
      definition: "only a rule",
    });
  });
});

describe("bandCategories", () => {
  const line = (code: string, points: number) =>
    ({ code, name: code, definition: null, points, value: null });

  it("names the men behind a category, largest contribution first", () => {
    const bands = bandCategories(
      { saka: [line("G", 6)], isak: [line("G", 12)] },
      { haaland: [line("G", 6)] },
    );
    expect(bands[0].mine).toEqual([
      { fantraxId: "isak", points: 12 },
      { fantraxId: "saka", points: 6 },
    ]);
    expect(bands[0].theirs).toEqual([{ fantraxId: "haaland", points: 6 }]);
  });

  it("leaves the other half EMPTY where that side registered nothing", () => {
    // Empty is the absence: a side of noughts would be a claim the payload never made.
    const bands = bandCategories({ a: [line("G", 6)] }, { b: [line("Sv", 3)] });
    expect(bands.find((band) => band.code === "Sv")?.mine).toEqual([]);
    expect(bands.find((band) => band.code === "G")?.theirs).toEqual([]);
  });

  it("orders bands by what moved the scoreline, deductions last", () => {
    const bands = bandCategories(
      { a: [line("YC", -2), line("Min", 20), line("G", 6)] },
      {},
    );
    expect(bands.map((band) => band.code)).toEqual(["Min", "G", "YC"]);
  });

  it("breaks a band tie on the code, so two renders of one payload agree", () => {
    const bands = bandCategories({ a: [line("Sv", 4), line("A", 4)] }, {});
    expect(bands.map((band) => band.code)).toEqual(["A", "Sv"]);
  });

  it("breaks a MEN tie on the id, which is the common case", () => {
    // Every scorer of one goal is on the same figure, so the tiebreak decides
    // most of a band. It is meaningless to a reader on purpose: it exists so the
    // order is stable, and a caller with names re-sorts equal points by name.
    const bands = bandCategories({ zeta: [line("G", 6)], alpha: [line("G", 6)] }, {});
    expect(bands[0].mine.map((man) => man.fantraxId)).toEqual(["alpha", "zeta"]);
  });

  it("never puts a man in a band he did not register", () => {
    const bands = bandCategories({ a: [line("G", 6)], b: [line("A", 3)] }, {});
    expect(bands.find((band) => band.code === "G")?.mine.map((m) => m.fantraxId)).toEqual(["a"]);
    expect(bands.find((band) => band.code === "A")?.mine.map((m) => m.fantraxId)).toEqual(["b"]);
  });

  it("keeps a man on a real NOUGHT, which is not an absence", () => {
    // `liveBreakdown` drops a category a man never registered, so a line
    // carrying 0 is Fantrax saying it counted and paid nothing.
    const bands = bandCategories({ a: [line("GA", 0)] }, {});
    expect(bands[0].mine).toEqual([{ fantraxId: "a", points: 0 }]);
  });

  it("invents no table for a period nobody has played", () => {
    expect(bandCategories({}, {})).toEqual([]);
  });

  it("names a category as the reader's own side spells it, then his opponent's", () => {
    const mine = { a: [{ code: "G", name: "Goals", definition: null, points: 6, value: "1" }] };
    const theirs = { b: [{ code: "G", name: "GOALS", definition: null, points: 6, value: "1" }] };
    expect(bandCategories(mine, theirs)[0].name).toBe("Goals");
    expect(bandCategories({}, theirs)[0].name).toBe("GOALS");
  });

  it("holds no NAME for a man, only his id — the layer split", () => {
    // A core that knew names would be a core that could leak one.
    const man = bandCategories({ saka: [line("G", 6)] }, {})[0].mine[0];
    expect(Object.keys(man).sort()).toEqual(["fantraxId", "points"]);
  });

  it("says nothing whatever about a side whose breakdown never arrived", () => {
    // THE GATE. A withheld side is handed in as `{}`, and the result must carry
    // no band it alone would have registered and no name from it — the band SET
    // is itself a statement about which categories an eleven registered.
    const bands = bandCategories({ a: [line("G", 6)] }, {});
    expect(bands.every((band) => band.theirs.length === 0)).toBe(true);
    expect(bands.map((band) => band.code)).toEqual(["G"]);
  });
});
