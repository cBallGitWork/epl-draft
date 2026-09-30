import { describe, expect, it } from "vitest";
import type { PeriodRosters } from "@epl/core";
import { walkLeague } from "./league";

type TeamRoster = PeriodRosters["teams"][number];

const team = (teamId: string, teamName: string, players: string[]): TeamRoster =>
  ({ teamId, teamName, slots: players.map((fantraxId) => ({ fantraxId })) }) as unknown as TeamRoster;

describe("walkLeague", () => {
  it("names no team when there are none", () => {
    expect(walkLeague([])).toEqual({ state: "no teams", teamId: null, teamName: null, playerId: null });
  });

  // The real league on 25 Sep: seven managers, a draft order, nobody picked.
  it("does not call teams with empty squads drafted", () => {
    const walk = walkLeague([team("a", "its_ohi", []), team("b", "RichyN", [])]);
    expect(walk.state).toBe("no squads");
    expect(walk.teamName).toBe("its_ohi");
    expect(walk.playerId).toBeNull();
  });

  it("is drafted once any team holds a player, and takes the player from that team", () => {
    const walk = walkLeague([team("a", "its_ohi", []), team("b", "RichyN", ["06qsd"])]);
    expect(walk).toEqual({ state: "drafted", teamId: "a", teamName: "its_ohi", playerId: "06qsd" });
  });
});
