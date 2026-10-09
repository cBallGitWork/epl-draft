import { describe, expect, it } from "vitest";
import outfielder from "../football/__fixtures__/plPlayerStats.json";
import { plMatchParts, type MatchParts } from "../football/premierleague/playerMatch";
import type { RawPlPlayerStats } from "../football/premierleague/rawStats";
import { mapLeagueInfo } from "../league/fantrax/map";
import real from "../league/fantrax/__fixtures__/leagueInfoScoringReal.json";
import rehearsal from "../league/fantrax/__fixtures__/leagueInfoScoringRehearsal.json";
import type { LeagueScoring } from "../league/scoring";
import { scoringOf } from "../league/selectors";
import type { Contribution } from "./contribution";
import { attackingStats, fullMatchStats, scoredStats } from "./fullMatchStats";

// Both leagues' getLeagueInfo of 1 Oct 2026: the real one scores AT, DFP, DFP3 and GKP; the rehearsal A, AF and Sv.
function scoring(raw: Parameters<typeof mapLeagueInfo>[0]): LeagueScoring {
  const read = scoringOf(mapLeagueInfo(raw));
  if (read === null) throw new Error("fixture carries no scoring");
  return read;
}
const REAL = scoring(real);
const REHEARSAL = scoring(rehearsal);

const done = (fill: Partial<Contribution> = {}): Contribution => ({
  minutes: 90,
  goals: 0,
  assists: 0,
  cleanSheet: false,
  cleanSheets: 0,
  goalsConceded: 0,
  ownGoals: 0,
  saves: 0,
  penaltiesSaved: 0,
  penaltiesMissed: 0,
  yellowCards: 0,
  redCards: 0,
  ...fill,
});

const PARTS: MatchParts = {
  tacklesWon: 3,
  interceptions: 1,
  blocks: 1,
  clearances: 1,
  recoveries: 11,
  penaltiesWon: 0,
  smothers: 0,
  punches: 0,
  highClaims: 0,
  shots: 3,
  shotsOnTarget: 1,
  chancesCreated: 2,
  bigChancesCreated: 1,
  bigChancesMissed: 0,
  crosses: 3,
  accurateCrosses: 2,
  touchesInBox: 4,
  contests: 2,
  contestsWon: 1,
};

const keys = (scoring: LeagueScoring, position: string) => scoredStats(scoring, position) ?? [];

describe("scoredStats on the real league", () => {
  it("gives a defender the parts of his DefCon and not a midfielder's clearances or recoveries", () => {
    expect(keys(REAL, "D")).toEqual(expect.arrayContaining(["DFP", "tacklesWon", "interceptions", "blocks", "GAO", "CS"]));
    expect(keys(REAL, "D")).not.toContain("clearances");
    expect(keys(REAL, "D")).not.toContain("recoveries");
    expect(keys(REAL, "D")).not.toContain("saves");
  });

  it("gives a forward all five parts of his DefCon, and nothing he concedes", () => {
    expect(keys(REAL, "F")).toEqual(expect.arrayContaining(["DFP3", "clearances", "recoveries"]));
    expect(keys(REAL, "F")).not.toContain("GAO");
    expect(keys(REAL, "F")).not.toContain("CS");
  });

  it("gives a keeper his saves and keeper actions, and no DefCon", () => {
    expect(keys(REAL, "G")).toEqual(expect.arrayContaining(["saves", "smothers", "punches", "highClaims", "PKS", "GAO"]));
    expect(keys(REAL, "G")).not.toContain("tacklesWon");
  });

  it("gives a man filed at two positions what either is paid for", () => {
    expect(keys(REAL, "D/M")).toEqual(expect.arrayContaining(["DFP", "DFP3", "recoveries"]));
  });

  it("is null with no scoring or no position, so the card shows every row", () => {
    expect(scoredStats(null, "D")).toBeNull();
    expect(scoredStats(REAL, null)).toBeNull();
    expect(scoredStats(REAL, "")).toBeNull();
  });
});

describe("scoredStats on a league that prices no DefCon", () => {
  it("shows no tackles to anybody", () => {
    expect(keys(REHEARSAL, "D")).not.toContain("tacklesWon");
    expect(keys(REHEARSAL, "M")).toEqual(expect.arrayContaining(["Min", "G", "AT", "penaltiesWon", "YC", "RC"]));
  });
});

describe("fullMatchStats", () => {
  it("prints his noughts once he has played: zero is a stat", () => {
    const rows = fullMatchStats(done(), PARTS, keys(REAL, "D"));
    expect(rows.find((row) => row.key === "YC")).toEqual({ key: "YC", label: "Yellow cards", value: 0 });
    expect(rows.find((row) => row.key === "DFP")).toMatchObject({ label: "DefCon", value: 5 });
  });

  it("orders minutes first and the cards last", () => {
    const rows = fullMatchStats(done(), PARTS, keys(REAL, "M"));
    expect(rows[0].key).toBe("Min");
    expect(rows.at(-1)?.key).toBe("RC");
  });

  it("dashes the parts when Opta had no line, and keeps FPL's counts", () => {
    const rows = fullMatchStats(done({ goals: 1 }), null, keys(REAL, "F"));
    expect(rows.find((row) => row.key === "tacklesWon")?.value).toBeNull();
    expect(rows.find((row) => row.key === "G")?.value).toBe(1);
  });

  it("shows only his minutes until he has been on the pitch", () => {
    expect(fullMatchStats(done({ minutes: 0 }), null, keys(REAL, "D"))).toEqual([
      { key: "Min", label: "Minutes", value: 0 },
    ]);
  });
});

describe("attackingStats", () => {
  it("reads his shooting down the left column and his making down the right", () => {
    expect(attackingStats(PARTS, "M").map((row) => row.key)).toEqual([
      "shots",
      "shotsOnTarget",
      "bigChancesMissed",
      "touchesInBox",
      "chancesCreated",
      "bigChancesCreated",
      "crosses",
      "contests",
    ]);
  });

  it("gives crosses and take-ons as made of tried, and a count alone otherwise", () => {
    const rows = attackingStats(PARTS, "D/M");
    expect(rows.find((row) => row.key === "crosses")).toEqual({ key: "crosses", label: "Accurate crosses", value: 2, of: 3 });
    expect(rows.find((row) => row.key === "contests")).toEqual({ key: "contests", label: "Dribbles won", value: 1, of: 2 });
    expect(rows.find((row) => row.key === "chancesCreated")).toEqual({
      key: "chancesCreated",
      label: "Chances created",
      value: 2,
      of: null,
    });
  });

  it("reads a metric Opta omitted as nought: zero is a stat", () => {
    // Recorded 6 Oct 2026: Jacob Murphy's line carries no shot on target and no big chance.
    const rows = attackingStats(plMatchParts(outfielder as RawPlPlayerStats), "M");
    expect(rows.find((row) => row.key === "shotsOnTarget")?.value).toBe(0);
    expect(rows.find((row) => row.key === "bigChancesCreated")?.value).toBe(0);
    expect(rows.find((row) => row.key === "shots")?.value).toBe(2);
  });

  it("has no block when Opta has no line for him", () => {
    expect(attackingStats(null, "F")).toEqual([]);
  });

  it("gives a keeper no block", () => {
    expect(attackingStats(PARTS, "G")).toEqual([]);
  });
});
