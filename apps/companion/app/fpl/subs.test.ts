import { describe, expect, it } from "vitest";
import type { Fixture, Opposition, PlManMatch } from "@epl/core";
import { kickedOffFixtures, subMarksByCode, type PickFixtures } from "./subs";

const fixture = (code: number, status: Fixture["status"]): Fixture => ({
  id: code, code, gameweek: 5, homeClubId: 1, awayClubId: 2, kickoff: null,
  homeScore: null, awayScore: null, status, settled: false, minutes: 0,
  homeDifficulty: 2, awayDifficulty: 3,
});

const against = (f: Fixture): Opposition => ({
  club: { id: 2, code: 2, name: "B", shortName: "B" }, home: true, difficulty: null, fixture: f,
});

const man = (code: number, ...fixtures: Fixture[]): PickFixtures => ({ code, opposition: fixtures.map(against) });

const did = (onAt: number | null, offAt: number | null): PlManMatch =>
  ({ onAt, offAt, booked: null, sentOff: null, goals: [] }) as unknown as PlManMatch;

describe("kickedOffFixtures", () => {
  it("names each kicked-off fixture once and leaves the upcoming and the blank out", () => {
    const played = fixture(10, "finished");
    const men = [man(1, played), man(2, played, fixture(11, "live")), man(3, fixture(12, "upcoming")), { code: 4, opposition: undefined }];
    expect(kickedOffFixtures(men)).toEqual([10, 11]);
  });
});

describe("subMarksByCode", () => {
  const played = fixture(10, "finished");

  it("marks a man who went off with the minute, pointing down", () => {
    const events = new Map([[10, new Map([[1, did(null, 82)]])]]);
    expect(subMarksByCode([man(1, played)], events)).toEqual({ 1: { minute: 82, off: true } });
  });

  it("marks a man who came on, and coming on beats going off", () => {
    const events = new Map([[10, new Map([[1, did(64, 88)]])]]);
    expect(subMarksByCode([man(1, played)], events)).toEqual({ 1: { minute: 64, off: false } });
  });

  it("leaves a man who played it all, never played, or has no events unmarked", () => {
    const events = new Map([[10, new Map([[1, did(null, null)]])]]);
    expect(subMarksByCode([man(1, played), man(2, played), man(3)], events)).toEqual({});
  });

  it("takes the later fixture on a double", () => {
    const second = fixture(11, "finished");
    const events = new Map([
      [10, new Map([[1, did(null, 60)]])],
      [11, new Map([[1, did(70, null)]])],
    ]);
    expect(subMarksByCode([man(1, played, second)], events)).toEqual({ 1: { minute: 70, off: false } });
  });
});
