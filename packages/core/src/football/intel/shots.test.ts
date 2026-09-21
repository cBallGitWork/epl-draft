import { describe, expect, it } from "vitest";
import type { IntelShots, Shot } from "./shots";
import { shotIntel, shotsInFixture, shotsOf } from "./shots";

const MANIFEST = { season: "26-27", gameweek: null, exportedAt: "", rows: 0, sources: [] };

function shot(over: Partial<Shot> = {}): Shot {
  return {
    code: 1,
    fplFixtureId: 8,
    minute: 63,
    x: 88.5,
    y: 50,
    xg: 0.79,
    xgot: 0.9,
    outcome: "goal",
    situation: "penalty",
    bodyPart: "right-foot",
    ...over,
  };
}

const file = (shots: Shot[]): IntelShots => ({ manifest: MANIFEST, shots });

describe("shotIntel", () => {
  it("groups a man's shots under his code", () => {
    expect(shotIntel(file([shot(), shot({ minute: 70 })])).get(1)).toHaveLength(2);
  });

  it("drops a shot plotted off the pitch", () => {
    // A mark outside the touchline looks exactly like a real one, which is the
    // confident wrong answer this app refuses.
    expect(shotIntel(file([shot({ x: 140 })])).size).toBe(0);
    expect(shotIntel(file([shot({ y: -3 })])).size).toBe(0);
  });

  it("drops a shot with no usable code or fixture", () => {
    expect(shotIntel(file([shot({ code: Number.NaN })])).size).toBe(0);
    expect(shotIntel(file([shot({ fplFixtureId: Number.NaN })])).size).toBe(0);
  });

  it("keeps a shot with no xG rather than losing the mark", () => {
    // Five of 824 have no xG. The location is the thing the map is drawing.
    expect(shotIntel(file([shot({ xg: null, xgot: null })])).get(1)).toHaveLength(1);
  });

  it("survives a file that is not there", () => {
    expect(shotIntel(null).size).toBe(0);
  });
});

describe("shotsOf", () => {
  const map = shotIntel(file([shot(), shot({ fplFixtureId: 9 })]));

  it("takes one fixture when asked", () => {
    expect(shotsOf(map.get(1), 9)).toHaveLength(1);
  });

  it("takes the season when not", () => {
    expect(shotsOf(map.get(1), null)).toHaveLength(2);
  });

  it("has nothing to say about a man who is not in the file", () => {
    expect(shotsOf(undefined, null)).toEqual([]);
  });
});

describe("shotsInFixture", () => {
  const map = shotIntel(
    file([
      { ...shot(), code: 9, fplFixtureId: 1, minute: 80 },
      { ...shot(), code: 9, fplFixtureId: 1, minute: 12 },
      { ...shot(), code: 9, fplFixtureId: 2 },
      { ...shot(), code: 7, fplFixtureId: 2 },
    ]),
  );

  it("keeps only the men who shot in that match", () => {
    const here = shotsInFixture(map, 1);
    expect([...here.keys()]).toEqual([9]);
    expect(here.get(9)).toHaveLength(2);
  });

  it("orders a man's shots as he took them", () => {
    expect(shotsInFixture(map, 1).get(9)?.map((shot) => shot.minute)).toEqual([12, 80]);
  });

  it("answers an empty map for a fixture nobody shot in", () => {
    expect(shotsInFixture(map, 99).size).toBe(0);
  });
});
