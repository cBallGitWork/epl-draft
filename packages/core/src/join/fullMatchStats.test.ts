import { describe, expect, it } from "vitest";
import type { MatchParts } from "../football/premierleague/playerMatch";
import { mapLeagueInfo } from "../league/fantrax/map";
import real from "../league/fantrax/__fixtures__/leagueInfoScoringReal.json";
import rehearsal from "../league/fantrax/__fixtures__/leagueInfoScoringRehearsal.json";
import type { LeagueScoring } from "../league/scoring";
import { scoringOf } from "../league/selectors";
import type { Contribution } from "./contribution";
import { fullMatchStats, scoredStats } from "./fullMatchStats";

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
    expect(rows.find((row) => row.key === "DFP")).toMatchObject({ label: "DefCon (DEF)", value: 5 });
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
