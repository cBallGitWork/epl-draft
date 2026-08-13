import { describe, expect, it } from "vitest";
import { leaguePool, periodPairings } from "./selectors";
import type {
  LeagueMatchup,
  LeaguePlayer,
  LeaguePlayerState,
  LeagueTeam,
  PeriodRosters,
} from "./types";

// Small hand-built inputs rather than a trimmed capture: every case below is a
// disagreement BETWEEN the three payloads, and a fixture that happens to be
// consistent cannot express one.

const player = (fantraxId: string, displayName: string): LeaguePlayer => ({
  fantraxId,
  rawName: displayName,
  displayName,
  clubCode: "ARS",
  position: "M",
  rotowireId: null,
});

const pool = [player("c", "Cole"), player("a", "Adams"), player("b", "Bell")];

const states: LeaguePlayerState[] = [
  { fantraxId: "a", eligiblePositions: ["F", "M"], status: "T" },
  { fantraxId: "b", eligiblePositions: ["D"], status: "FA" },
];

const rosters: PeriodRosters = {
  period: 1,
  teams: [{ teamId: "t1", teamName: "test3", slots: [{ fantraxId: "a", position: "M", status: "ACTIVE" }] }],
};

describe("leaguePool", () => {
  it("reads eligibility and status from the league, and ownership from the rosters", () => {
    const [adams] = leaguePool(pool, states, rosters);
    expect(adams).toEqual({
      player: pool[1],
      eligiblePositions: ["F", "M"],
      status: "T",
      ownerTeamId: "t1",
    });
  });

  it("says nobody owns a player no roster holds, whatever his status", () => {
    // "WW" is a transaction rule, not an owner. An undrafted league marks all 697
    // waiver-wire and none of them belong to anyone, and reading the letter as
    // ownership would give every team in that league a full squad.
    const undrafted = leaguePool(
      pool,
      pool.map((p) => ({ fantraxId: p.fantraxId, eligiblePositions: ["M"], status: "WW" })),
      { period: null, teams: [] },
    );
    expect(undrafted.every((entry) => entry.ownerTeamId === null)).toBe(true);
    expect(undrafted.every((entry) => entry.status === "WW")).toBe(true);
  });

  it("keeps a player the league has said nothing about, claiming nothing about him", () => {
    const cole = leaguePool(pool, states, rosters).find((e) => e.player.fantraxId === "c");
    expect(cole).toMatchObject({ eligiblePositions: [], status: "" });
  });

  it("orders by the name a person would look for", () => {
    expect(leaguePool(pool, states, rosters).map((e) => e.player.displayName)).toEqual([
      "Adams",
      "Bell",
      "Cole",
    ]);
  });
});

const leagueTeams: LeagueTeam[] = [
  { teamId: "t1", name: "123" },
  { teamId: "t2", name: "test2" },
  { teamId: "t3", name: "test3" },
  { teamId: "t4", name: "test4" },
];

const schedule: LeagueMatchup[] = [
  { period: 1, homeTeamId: "t1", awayTeamId: "t2" },
  { period: 1, homeTeamId: "t3", awayTeamId: "t4" },
  { period: 2, homeTeamId: "t1", awayTeamId: "t3" },
];

describe("periodPairings", () => {
  it("selects one period and resolves both sides to the teams that hold them", () => {
    expect(periodPairings(schedule, leagueTeams, 1)).toEqual([
      { home: leagueTeams[0], away: leagueTeams[1] },
      { home: leagueTeams[2], away: leagueTeams[3] },
    ]);
  });

  it("answers empty for a league with no teams", () => {
    // The real league today: a schedule can exist before anyone has joined it,
    // and every pairing in it names a team nobody holds.
    expect(periodPairings(schedule, [], 1)).toEqual([]);
  });

  it("answers empty for a period the schedule does not cover", () => {
    // A bye is a real state, not a fault — and whether the real league's
    // schedule starts at period 1 or period 6 is still an open question.
    expect(periodPairings(schedule, leagueTeams, 3)).toEqual([]);
  });

  it("drops a pairing whose team the league does not carry, and keeps the rest", () => {
    const withStranger: LeagueMatchup[] = [
      ...schedule,
      { period: 1, homeTeamId: "t9", awayTeamId: "t2" },
    ];
    expect(periodPairings(withStranger, leagueTeams, 1)).toEqual([
      { home: leagueTeams[0], away: leagueTeams[1] },
      { home: leagueTeams[2], away: leagueTeams[3] },
    ]);
  });
});
