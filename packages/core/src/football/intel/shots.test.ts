import { describe, expect, it } from "vitest";
import type { IntelShots, Shot } from "./shots";
import { assistsOf, shotIntel, shotsInFixture, shotsOf } from "./shots";

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
    assistCode: null,
    pass: null,
    ...over,
  };
}

const file = (shots: Shot[]): IntelShots => ({ manifest: MANIFEST, shots });

describe("shotIntel", () => {
  it("groups a man's shots under his code", () => {
    expect(shotIntel(file([shot(), shot({ minute: 70 })])).get(1)).toHaveLength(2);
  });

  it("drops a shot plotted off the pitch", () => {
    // A mark outside the touchline looks exactly like a real one.
    expect(shotIntel(file([shot({ x: 140 })])).size).toBe(0);
    expect(shotIntel(file([shot({ y: -3 })])).size).toBe(0);
  });

  it("drops a shot with no usable code or fixture", () => {
    expect(shotIntel(file([shot({ code: Number.NaN })])).size).toBe(0);
    expect(shotIntel(file([shot({ fplFixtureId: Number.NaN })])).size).toBe(0);
  });

  it("keeps a shot with no xG rather than losing the mark", () => {
    // A shot with no xG is still a location for the map to draw.
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

describe("the assister and his key pass", () => {
  it("carries both through when the export has them", () => {
    const read = shotIntel(file([shot({ assistCode: 42, pass: { x: 70, y: 30 } })])).get(1)?.[0];
    expect(read?.assistCode).toBe(42);
    expect(read?.pass).toEqual({ x: 70, y: 30 });
  });

  it("reads an older export, which has neither, as no assister and no pass", () => {
    const old = { ...shot() } as Partial<Shot>;
    delete old.assistCode;
    delete old.pass;
    const read = shotIntel(file([old as Shot])).get(1)?.[0];
    expect(read?.assistCode).toBeNull();
    expect(read?.pass).toBeNull();
  });

  it("drops a key pass drawn off the pitch but keeps the shot", () => {
    const read = shotIntel(file([shot({ assistCode: 42, pass: { x: 140, y: 30 } })])).get(1)?.[0];
    expect(read?.pass).toBeNull();
    expect(read?.assistCode).toBe(42);
  });
});

describe("assistsOf", () => {
  it("finds every shot a man set up, whoever struck it", () => {
    const byCode = shotIntel(
      file([
        shot({ code: 10, assistCode: 7, minute: 5 }),
        shot({ code: 11, assistCode: 7, minute: 40 }),
        shot({ code: 7, assistCode: 10, minute: 60 }),
        shot({ code: 12, assistCode: null, minute: 70 }),
      ]),
    );
    expect(assistsOf(byCode, 7).map((each) => each.minute)).toEqual([5, 40]);
    expect(assistsOf(byCode, 99)).toEqual([]);
  });
});
