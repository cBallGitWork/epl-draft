import { describe, expect, it } from "vitest";
import { mapLeagueInfo, periodPairings } from "@epl/core";
import type { ReadableSquads } from "../../squads";
import { NOT_DRAFTED, NO_PAIRINGS, headToHeadQuiet } from "./headToHead";

// The rehearsal league's getLeagueInfo shape: periods 1-3 carry an empty `matchupList`.
const info = mapLeagueInfo({
  teamInfo: {
    a: { id: "a", name: "test4" },
    b: { id: "b", name: "test2" },
  },
  matchups: [
    { period: 1, matchupList: [] },
    { period: 2, matchupList: [] },
    { period: 3, matchupList: [] },
    { period: 4, matchupList: [{ home: { id: "a", name: "test4" }, away: { id: "b", name: "test2" } }] },
  ],
});

// Only `info` and `roundPeriod` are read on the way to the pairings.
const drafted = { info, roundPeriod: 1 } as unknown as ReadableSquads;

describe("headToHeadQuiet", () => {
  it("says nothing to post for a drafted league whose period has no pairings", () => {
    const pairings = periodPairings(info.matchups, info.teams, 1);
    expect(pairings).toEqual([]);
    expect(headToHeadQuiet(drafted, pairings)).toBe(NO_PAIRINGS);
  });

  it("is silent when the period has pairings to post", () => {
    expect(headToHeadQuiet(drafted, periodPairings(info.matchups, info.teams, 4))).toBeNull();
  });

  it("says the league has not drafted when Fantrax has no teams", () => {
    expect(headToHeadQuiet({ undrafted: "getTeamRosters → NO_TEAMS" }, [])).toBe(NOT_DRAFTED);
  });

  it("blames Fantrax rather than the league when it will not answer", () => {
    const quiet = headToHeadQuiet({ unavailable: "getTeamRosters → HTTP 503" }, []);
    expect(quiet).toContain("Fantrax is not answering");
    expect(quiet).not.toBe(NO_PAIRINGS);
  });

  it("never lets the two empty sentences share the smoke's marker", () => {
    expect(NO_PAIRINGS).not.toContain("The league has not drafted yet");
    expect(NOT_DRAFTED).toContain("The league has not drafted yet");
  });
});
