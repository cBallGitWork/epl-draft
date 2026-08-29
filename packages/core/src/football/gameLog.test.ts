import { describe, expect, it } from "vitest";
import { mapGameLog } from "./gameLog";
import type { RawElementSummary } from "./fpl/raw";
import saka from "./__fixtures__/elementSummary.json";
import unusedSub from "./__fixtures__/elementSummaryUnused.json";

// FPL's own `element-summary` responses, recorded live on 29 Aug 2026: Saka
// (element 12), who played GW1 and has a GW2 row for a match two days away, and
// Arrizabalaga (element 2), an unused substitute in the same GW1 — nought
// minutes in a match that finished 3-0. The pair is the whole reason this
// mapper exists in the shape it does: their two zero rows look identical and
// mean opposite things.

const played = saka as RawElementSummary;
const benched = unusedSub as RawElementSummary;

describe("mapGameLog", () => {
  it("keeps a match he played", () => {
    const log = mapGameLog(played);
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ gameweek: 1, minutes: 67, goals: 1, bps: 36, fplPoints: 9 });
  });

  it("drops the round FPL has already opened a row for but nobody has played", () => {
    // Recorded two days before that kickoff. The row is all zeroes and the only
    // thing separating it from a substitute's is that the fixture has no score.
    expect(played.history.some((h) => h.round === 2)).toBe(true);
    expect(mapGameLog(played).some((row) => row.gameweek === 2)).toBe(false);
  });

  it("keeps an unused substitute's nought, which is a fact about him", () => {
    const log = mapGameLog(benched);
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({ gameweek: 1, minutes: 0, fplPoints: 0 });
  });

  it("reads the four measurements per match rather than per round", () => {
    // The point of the endpoint. `mapLiveStats` can only take these off the
    // gameweek aggregate; here they belong to the fixture.
    expect(mapGameLog(played)[0]).toMatchObject({
      bps: 36,
      defensiveContribution: 7,
      expectedGoals: 0.64,
      expectedAssists: 0.08,
    });
  });

  it("turns the score round so it reads from his club's point of view", () => {
    // Saka was at home in a 3-0; the away side's row for the same match would
    // have to read 0-3, and no reader should have to work that out.
    expect(mapGameLog(played)[0]).toMatchObject({ home: true, scored: 3, conceded: 0 });
  });

  it("says nothing rather than nought when FPL published no measurement", () => {
    const withoutXg: RawElementSummary = {
      history: [{ ...played.history[0], expected_goals: undefined, defensive_contribution: undefined }],
    };
    expect(mapGameLog(withoutXg)[0]).toMatchObject({
      expectedGoals: null,
      defensiveContribution: null,
    });
  });

  it("reads the expected-goals family out of the decimal strings FPL sends", () => {
    // They are strings in the payload, not numbers. Read as numbers they are NaN.
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
    };
    expect(mapGameLog(twice).map((row) => `${row.gameweek}/${row.fixtureId}`)).toEqual([
      "3/31",
      "3/30",
      "1/1",
    ]);
  });

  it("has nothing to say before a ball is kicked", () => {
    expect(mapGameLog({ history: [] })).toEqual([]);
  });
});
