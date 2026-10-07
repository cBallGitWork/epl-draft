import { describe, expect, it } from "vitest";
import type { Fixture } from "@epl/core";
import { stateLine } from "./matchState";

const fixture = (over: Partial<Fixture>): Fixture => ({
  id: 51,
  code: 2562001,
  gameweek: 6,
  homeClubId: 1,
  awayClubId: 2,
  kickoff: "2026-10-10T11:30:00Z",
  homeScore: null,
  awayScore: null,
  status: "upcoming",
  settled: false,
  minutes: 0,
  homeDifficulty: null,
  awayDifficulty: null,
  ...over,
});

const NIL_NIL = { halfTime: { home: 0, away: 0 } };

describe("stateLine", () => {
  it("prints no half-time score before kick-off, though the Premier League sends one at 0–0", () => {
    expect(stateLine({ fixture: fixture({}), live: false, finished: false }, NIL_NIL)).toBe("Gameweek 6 · 12:30");
  });

  it("prints the half-time score once the match is played", () => {
    const played = fixture({ status: "finished", homeScore: 3, awayScore: 0, minutes: 90 });
    expect(stateLine({ fixture: played, live: false, finished: true }, NIL_NIL)).toBe("Gameweek 6 · FT · HT 0–0");
  });

  it("prints the running minute while live, and TBC where FPL has no gameweek or kick-off", () => {
    const live = fixture({ status: "live", homeScore: 1, awayScore: 0, minutes: 67 });
    expect(stateLine({ fixture: live, live: true, finished: false }, null)).toBe("Gameweek 6 · Live 67′");
    const undated = fixture({ gameweek: null, kickoff: null });
    expect(stateLine({ fixture: undated, live: false, finished: false }, null)).toBe("Gameweek TBC · Kick-off TBC");
  });
});
