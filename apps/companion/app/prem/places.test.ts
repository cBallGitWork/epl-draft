import { describe, expect, it } from "vitest";
import type { Club, Fixture } from "@epl/core";
import { clubPlaces } from "./places";

const clubs: Club[] = [
  { id: 1, code: 3, name: "Arsenal", shortName: "ARS" },
  { id: 2, code: 7, name: "Aston Villa", shortName: "AVL" },
  { id: 3, code: 8, name: "Chelsea", shortName: "CHE" },
];

const win: Fixture = {
  id: 1,
  code: 1,
  gameweek: 1,
  homeClubId: 2,
  awayClubId: 3,
  kickoff: "2026-08-15T14:00:00.000Z",
  homeScore: 2,
  awayScore: 0,
  status: "finished",
  settled: true,
  minutes: 90,
  homeDifficulty: null,
  awayDifficulty: null,
};

describe("clubPlaces", () => {
  it("places every club by the table's order, keyed by club id", () => {
    const places = clubPlaces([win], clubs);
    expect(places.size).toBe(3);
    expect(places.get(2)).toBe(1);
    expect(places.get(3)).toBe(3);
  });
});
