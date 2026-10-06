import { describe, expect, it } from "vitest";
import { mapGameLog, totalsOver } from "./gameLog";
import type { RawElementSummary } from "./fpl/raw";
import saka from "./__fixtures__/elementSummary.json";
import unusedSub from "./__fixtures__/elementSummaryUnused.json";

// Recorded `element-summary` responses: Saka, who played GW1 and has an unplayed GW2 row, and Arrizabalaga,
// an unused GW1 substitute. Their zero rows look identical and mean opposite things.

const played = saka as RawElementSummary;
const benched = unusedSub as RawElementSummary;

describe("mapGameLog", () => {
  it("keeps a match he played", () => {
    const log = mapGameLog(played);
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ gameweek: 1, minutes: 67, goals: 1, fplPoints: 9 });
  });

  it("drops the round FPL has already opened a row for but nobody has played", () => {
    // All zeroes, like a substitute's row; only the missing score tells them apart.
    expect(played.history.some((h) => h.round === 2)).toBe(true);
    expect(mapGameLog(played).some((row) => row.gameweek === 2)).toBe(false);
  });

  it("keeps an unused substitute's nought, which is a fact about him", () => {
    const log = mapGameLog(benched);
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ gameweek: 1, minutes: 0, fplPoints: 0 });
  });

  it("reads the measurements per match rather than per round", () => {
    // `mapLiveStats` has only the gameweek aggregate; here they belong to the fixture.
    expect(mapGameLog(played)[0]).toMatchObject({
      defensiveContribution: 7,
      expectedGoals: 0.64,
      expectedAssists: 0.08,
    });
  });

  it("turns the score round so it reads from his club's point of view", () => {
    // Saka was at home in a 3-0.
    expect(mapGameLog(played)[0]).toMatchObject({ home: true, scored: 3, conceded: 0 });
  });

  it("says nothing rather than nought when FPL published no measurement", () => {
    const withoutXg: RawElementSummary = {
      history: [{ ...played.history[0], expected_goals: undefined, defensive_contribution: undefined }],
      history_past: [],
    };
    expect(mapGameLog(withoutXg)[0]).toMatchObject({
      expectedGoals: null,
      defensiveContribution: null,
    });
  });

  it("reads the expected-goals family out of the decimal strings FPL sends", () => {
    // Strings in the payload, not numbers.
    expect(typeof played.history[0].expected_goals).toBe("string");
    expect(mapGameLog(played)[0].expectedGoals).toBeCloseTo(0.64);
  });

  it("reads most recent first, and puts both halves of a double under one round", () => {
    const twice: RawElementSummary = {
      history: [
        { ...played.history[0], round: 1, fixture: 1 },
        { ...played.history[0], round: 3, fixture: 30 },
        { ...played.history[0], round: 3, fixture: 31 },
      ],
      history_past: [],
    };
    expect(mapGameLog(twice).map((row) => `${row.gameweek}/${row.fixtureId}`)).toEqual([
      "3/31",
      "3/30",
      "1/1",
    ]);
  });

  it("has nothing to say before a ball is kicked", () => {
    expect(mapGameLog({ history: [], history_past: [] })).toEqual([]);
  });
});

describe("the defending the ledger rates", () => {
  it("reads starts, tackles, CBI, recoveries and xGC per match", () => {
    expect(mapGameLog(played)[0]).toMatchObject({
      starts: 1,
      tackles: 1,
      clearancesBlocksInterceptions: 2,
      recoveries: 4,
      expectedGoalsConceded: 0.06,
    });
  });
});

describe("totalsOver", () => {
  const log = mapGameLog(played);
  const second = { ...log[0], gameweek: 3, fixtureId: 99, minutes: 90, tackles: 3, expectedGoals: null };

  it("adds up the matches in the window and nothing outside it", () => {
    const totals = totalsOver([log[0], second], new Set([1, 3]));
    expect(totals).toMatchObject({ minutes: 157, starts: 2, tackles: 4, expectedGoals: 0.64 });
    expect(totalsOver([log[0], second], new Set([3])).minutes).toBe(90);
  });

  it("is a season of nought over a window he did not play in", () => {
    expect(totalsOver(log, new Set([7])).minutes).toBe(0);
  });
});
