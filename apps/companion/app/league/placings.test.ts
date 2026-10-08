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
  it("places each team by its rank in the table, as the blue block prints it", () => {
    expect(placings([row("a", 2), row("b", 1)])).toEqual(new Map([["a", "2nd"], ["b", "1st"]]));
  });

  it("marks a place two teams share", () => {
    expect(placings([row("a", 1), row("b", 1), row("c", 3)])).toEqual(new Map([["a", "=1st"], ["b", "=1st"], ["c", "3rd"]]));
  });

  it("places nobody when the table could not be read", () => {
    expect(placings({ unavailable: "getStandings → 503" }).size).toBe(0);
  });
});
