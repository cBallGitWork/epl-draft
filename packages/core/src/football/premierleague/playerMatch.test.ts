import { describe, expect, it } from "vitest";
import recordedFixture from "../__fixtures__/plFixture.json";
import outfielder from "../__fixtures__/plPlayerStats.json";
import keeper from "../__fixtures__/plPlayerStatsKeeper.json";
import type { RawPlFixture } from "./raw";
import type { RawPlPlayerStats } from "./rawStats";
import { plMatchParts, plPlayerId, sumParts } from "./playerMatch";

// Recorded 6 Oct 2026: Jacob Murphy in Newcastle v Hull and Alisson in Bournemouth v Liverpool, both GW5.
const MURPHY = outfielder as RawPlPlayerStats;
const ALISSON = keeper as RawPlPlayerStats;

describe("plMatchParts", () => {
  it("reads an outfielder's DefCon parts and the penalty he won", () => {
    expect(plMatchParts(MURPHY)).toMatchObject({
      tacklesWon: 2,
      clearances: 3,
      recoveries: 3,
      penaltiesWon: 1,
    });
  });

  it("reads a metric Opta omitted as nought, since it omits every nought", () => {
    expect(plMatchParts(MURPHY)).toMatchObject({ interceptions: 0, blocks: 0, smothers: 0 });
  });

  it("reads a keeper's smothers, punches and high claims", () => {
    expect(plMatchParts(ALISSON)).toMatchObject({ smothers: 1, punches: 2, highClaims: 3 });
  });

  it("has no line for a match he was not on the pitch in", () => {
    expect(plMatchParts({ stats: [] })).toBeNull();
    expect(plMatchParts({})).toBeNull();
  });
});

describe("sumParts", () => {
  it("adds a double gameweek's two matches up", () => {
    const one = plMatchParts(MURPHY);
    expect(one).not.toBeNull();
    if (one === null) return;
    expect(sumParts([one, one])).toMatchObject({ tacklesWon: 4, penaltiesWon: 2 });
  });

  it("is null with no match to add", () => {
    expect(sumParts([])).toBeNull();
  });
});

describe("plPlayerId", () => {
  const DETAIL = recordedFixture as unknown as RawPlFixture;

  it("finds a man on either team sheet by his Opta code", () => {
    expect(plPlayerId(DETAIL, "p116535")).toBe(20559);
  });

  it("is null for a man neither side named", () => {
    expect(plPlayerId(DETAIL, "p1")).toBeNull();
    expect(plPlayerId({ ...DETAIL, teamLists: [null, null] }, "p116535")).toBeNull();
  });
});
