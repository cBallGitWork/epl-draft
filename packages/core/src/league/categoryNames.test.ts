import { describe, expect, it } from "vitest";
import { ASSIST, DEFCON, DEFENSIVE_POINTS, DEFENSIVE_POINTS_3, KEEPER_WORK, carries, firstScored, idsOf, meaningOf } from "./categoryNames";
import { mapLeagueInfo } from "./fantrax/map";
import real from "./fantrax/__fixtures__/leagueInfoScoringReal.json";
import rehearsal from "./fantrax/__fixtures__/leagueInfoScoringRehearsal.json";

// Both leagues' getLeagueInfo as they stood on 1 Oct 2026, after the real league's scoring moved to AT and GKP.
const realInfo = mapLeagueInfo(real);
const rehearsalInfo = mapLeagueInfo(rehearsal);

describe("firstScored", () => {
  it("finds the real league's assists under AT and the rehearsal's under A", () => {
    expect(firstScored(realInfo.scoringCategories, ASSIST)?.short).toBe("AT");
    expect(firstScored(rehearsalInfo.scoringCategories, ASSIST)?.short).toBe("A");
  });

  it("prefers the total where a league scores the total and its parts", () => {
    const both = { ...rehearsalInfo.scoringCategories, ...realInfo.scoringCategories };
    expect(firstScored(both, ASSIST)?.short).toBe("AT");
  });

  it("matches on the short code where the long one was not carried", () => {
    expect(firstScored({ "5010#6362": { code: "AT", name: "Assists (Total)", longCode: null } }, ASSIST)?.short).toBe("AT");
  });

  it("finds nothing in a league that scores no assist", () => {
    expect(firstScored({}, ASSIST)).toBeNull();
  });
});

describe("idsOf", () => {
  it("reads both halves' ids for a category, by meaning", () => {
    expect([...idsOf(realInfo.scoringCategories, [ASSIST[0]])].sort()).toEqual(["5010#6362", "5020#6362"]);
    expect([...idsOf(rehearsalInfo.scoringCategories, [ASSIST[1]])].sort()).toEqual(["5010#6000", "5020#6000"]);
  });

  it("finds a keeper's work under GKP in the real league and Sv in the rehearsal", () => {
    expect([...idsOf(realInfo.scoringCategories, KEEPER_WORK)]).toEqual(["5020#6689"]);
    expect([...idsOf(rehearsalInfo.scoringCategories, KEEPER_WORK)]).toEqual(["5020#6200"]);
  });

  it("never names the orphan Pen, which the scoring table prices and the settings do not describe", () => {
    expect(Object.values(realInfo.scoringCategories).map((c) => c.code)).not.toContain("Pen");
  });
});

describe("DefCon's lookups, whatever its heads print", () => {
  // The heads say DC and DC+ (categoryWords); reads are still filed under Fantrax's DFP and DFP3.
  it("finds both categories by Fantrax's short code where no long one was carried, and never by a head", () => {
    expect(meaningOf({ code: "DFP", longCode: null }, DEFCON)).toBe(DEFENSIVE_POINTS);
    expect(meaningOf({ code: "DFP3", longCode: null }, DEFCON)).toBe(DEFENSIVE_POINTS_3);
    expect(meaningOf({ code: "DC", longCode: null }, DEFCON)).toBeNull();
    expect([DEFENSIVE_POINTS.short, DEFENSIVE_POINTS_3.short]).toEqual(["DFP", "DFP3"]);
  });

  it("reads the real league's DefCon ids as it did", () => {
    expect([...idsOf(realInfo.scoringCategories, DEFCON)].map((id) => realInfo.scoringCategories[id]?.code)).toEqual(["DFP", "DFP3"]);
  });
});

describe("carries", () => {
  it("keeps a category the reading carries under either of its names", () => {
    expect(carries(new Set(["GAO"]), "GA", "GAO")).toBe(true);
    expect(carries(new Set(["AT"]), "A")).toBe(false);
  });

  it("keeps everything when the reading carried nothing, so an unread league still names its columns", () => {
    expect(carries(new Set(), "A")).toBe(true);
  });
});
