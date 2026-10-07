import { describe, expect, it } from "vitest";
import type { Fixture, FootballPlayer, PlManMatch, SquadPlayerDetail } from "@epl/core";
import { fixturesOf, subMarks } from "./subs";

const fixture = (code: number, status: Fixture["status"]): Fixture => ({
  id: code, code, gameweek: 5, homeClubId: 1, awayClubId: 2, kickoff: null,
  homeScore: null, awayScore: null, status, settled: false, minutes: 0,
  homeDifficulty: 2, awayDifficulty: 3,
});

const man = (fantraxId: string, code: number, ...fixtures: Fixture[]): SquadPlayerDetail => ({
  rostered: {
    slot: { fantraxId, position: "M", status: "" },
    player: { code, name: fantraxId } as FootballPlayer,
    stats: [],
  },
  club: undefined,
  opposition: fixtures.map((f) => ({ club: { id: 2, code: 2, name: "B", shortName: "B" }, home: true, difficulty: null, fixture: f })),
  points: null,
  minutes: [],
});

const did = (onAt: number | null, offAt: number | null): PlManMatch =>
  ({ onAt, offAt, booked: null, sentOff: null, goals: [] }) as unknown as PlManMatch;

describe("fixturesOf", () => {
  it("names each kicked-off fixture once and leaves the rest out", () => {
    const played = fixture(10, "finished");
    const squad = [man("a", 1, played), man("b", 2, played, fixture(11, "live")), man("c", 3, fixture(12, "upcoming"))];
    expect(fixturesOf(squad)).toEqual([10, 11]);
  });
});

describe("subMarks", () => {
  const played = fixture(10, "finished");

  it("marks a man who went off with the minute, pointing down", () => {
    const events = new Map([[10, new Map([[1, did(null, 71)]])]]);
    expect(subMarks([man("a", 1, played)], events)).toEqual({ a: { minute: 71, off: true } });
  });

  it("marks a man who came on, and coming on beats going off", () => {
    const events = new Map([[10, new Map([[1, did(64, 88)]])]]);
    expect(subMarks([man("a", 1, played)], events)).toEqual({ a: { minute: 64, off: false } });
  });

  it("leaves a man who played it all, or never played, unmarked", () => {
    const events = new Map([[10, new Map([[1, did(null, null)]])]]);
    expect(subMarks([man("a", 1, played), man("b", 2, played)], events)).toEqual({});
  });

  it("takes the later fixture on a double", () => {
    const second = fixture(11, "finished");
    const events = new Map([
      [10, new Map([[1, did(null, 60)]])],
      [11, new Map([[1, did(70, null)]])],
    ]);
    expect(subMarks([man("a", 1, played, second)], events)).toEqual({ a: { minute: 70, off: false } });
  });
});
