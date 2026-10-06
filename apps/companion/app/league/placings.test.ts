import { describe, expect, it } from "vitest";
import type { StandingsRow } from "@epl/core";
import { placings } from "./placings";

const row = (teamId: string, rank: number): StandingsRow => ({
  teamId,
  teamName: teamId,
  rank,
  won: 0,
  drawn: 0,
  lost: 0,
  played: 0,
  points: 0,
  pointsFor: 0,
  pointsAgainst: 0,
});

describe("placings", () => {
  it("places each team by its rank in the table", () => {
    expect(placings([row("a", 2), row("b", 1)])).toEqual(new Map([["a", 2], ["b", 1]]));
  });

  it("places nobody when the table could not be read", () => {
    expect(placings({ unavailable: "getStandings → 503" }).size).toBe(0);
  });
});
