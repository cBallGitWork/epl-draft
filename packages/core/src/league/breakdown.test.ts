import { describe, expect, it } from "vitest";
import { liveBreakdown, bandCategories } from "./breakdown";

describe("liveBreakdown", () => {
  const names = {
    "5010#6090": { code: "G", name: "Goals", longCode: "INDIVIDUAL_GOALS" },
    "5010#6120": { code: "Min", name: "Minutes Played", longCode: "INDIVIDUAL_MINUTES_PLAYED" },
    "5010#6280": { code: "YC", name: "Yellow Cards", longCode: "INDIVIDUAL_YELLOW_CARDS" },
    "5010#6362": { code: "AT", name: "Assists (Total)", longCode: "INDIVIDUAL_ASSISTS_TOTAL" },
    "5020#6689": { code: "GKP", name: "Keeper Points", longCode: "INDIVIDUAL_KEEPER_POINTS" },
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
      { code: "G", name: "Goals", points: 5, value: "1" },
      { code: "Min", name: "Minutes", points: 2, value: "90" },
      { code: "YC", name: "Yellow cards", points: -1, value: "1" },
    ]);
  });

  it("names the real league's assists and keeper work in plain words, not Fantrax's captions", () => {
    const lines = liveBreakdown(
      [
        { category: "5010#6362", points: 3, value: "1" },
        { category: "5020#6689", points: 2, value: "7" },
      ],
      names,
    );
    expect(lines.map((line) => line.name)).toEqual(["Assists", "Keeper actions"]);
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

describe("bandCategories", () => {
  const line = (code: string, points: number) =>
    ({ code, name: code, points, value: null });

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
    const mine = { a: [{ code: "G", name: "Goals", points: 6, value: "1" }] };
    const theirs = { b: [{ code: "G", name: "GOALS", points: 6, value: "1" }] };
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
