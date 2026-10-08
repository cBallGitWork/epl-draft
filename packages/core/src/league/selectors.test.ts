import { describe, expect, it } from "vitest";
import { headToHead, leaguePool, leagueSeason, nextPairedPeriod, pairingInvolves, periodPairings } from "./selectors";
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
      slot: "M",
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

describe("headToHead", () => {
  it("puts the team asked about first, whichever side of the schedule it is on", () => {
    // t1 is home in period 1 and the same team is away in nothing — but t2 is
    // away, and both must read as "you, then them".
    expect(headToHead(schedule, leagueTeams, 1, "t1")).toEqual({
      team: leagueTeams[0],
      opponent: leagueTeams[1],
      home: leagueTeams[0],
    });
    expect(headToHead(schedule, leagueTeams, 1, "t2")).toEqual({
      team: leagueTeams[1],
      opponent: leagueTeams[0],
      home: leagueTeams[0],
    });
  });

  it("keeps the side Fantrax's schedule puts at home, whichever side is asked about", () => {
    expect(headToHead(schedule, leagueTeams, 1, "t2")?.home.teamId).toBe("t1");
  });

  it("selects the period, not just the team", () => {
    // t1 plays t2 in period 1 and t3 in period 2. Reading the wrong one names
    // the wrong opponent on a squad screen, which is the bug this prevents.
    expect(headToHead(schedule, leagueTeams, 2, "t1")?.opponent).toEqual(leagueTeams[2]);
  });

  it("has no answer for a team with no pairing this period", () => {
    // A bye, a period the schedule does not cover, and a team id from another
    // league all land here — none of them is a fault.
    expect(headToHead(schedule, leagueTeams, 2, "t2")).toBeUndefined();
    expect(headToHead(schedule, leagueTeams, 3, "t1")).toBeUndefined();
    expect(headToHead(schedule, leagueTeams, 1, "t9")).toBeUndefined();
  });

  it("has no answer when the pairing names a team the league does not carry", () => {
    // Half a head-to-head is not one. `periodPairings` drops the pairing whole
    // and this inherits that rather than rendering a side against nobody.
    const stranger: LeagueMatchup[] = [{ period: 1, homeTeamId: "t1", awayTeamId: "t9" }];
    expect(headToHead(stranger, leagueTeams, 1, "t1")).toBeUndefined();
  });
});

describe("pairingInvolves", () => {
  const pairing = { home: leagueTeams[0], away: leagueTeams[1] };

  it("finds a manager at either end of his own pairing", () => {
    expect(pairingInvolves(pairing, "t1")).toBe(true);
    expect(pairingInvolves(pairing, "t2")).toBe(true);
  });

  it("leaves a manager out of somebody else's", () => {
    expect(pairingInvolves(pairing, "t3")).toBe(false);
  });

  it("gives a reader who has not signed in the neutral list", () => {
    // Null is not a team that happens to match nothing — it is nobody, and the
    // list it produces is the broadcaster's rather than a manager's.
    expect(pairingInvolves(pairing, null)).toBe(false);
  });
});

describe("nextPairedPeriod", () => {
  it("finds the team's first pairing after the period asked about", () => {
    // Before the real league's first head-to-head, the round on screen has none.
    expect(nextPairedPeriod(schedule, leagueTeams, 0, "t1")).toBe(1);
    expect(nextPairedPeriod(schedule, leagueTeams, 1, "t1")).toBe(2);
  });

  it("skips a period where only other teams play", () => {
    expect(nextPairedPeriod(schedule, leagueTeams, 0, "t3")).toBe(1);
    expect(nextPairedPeriod(schedule, leagueTeams, 1, "t4")).toBeUndefined();
  });

  it("has no answer once the schedule has run out", () => {
    expect(nextPairedPeriod(schedule, leagueTeams, 2, "t1")).toBeUndefined();
  });
});

describe("leagueSeason", () => {
  // The real league's calendar as getLeagueInfo sent it on 6 Oct 2026: periods from 21 Aug, pairings from period 6.
  const periods = [
    { number: 1, start: "2026-08-21T15:00:00.0-0400", end: "2026-08-28T14:59:59.0-0400" },
    { number: 5, start: "2026-09-18T15:00:00.0-0400", end: "2026-10-09T05:59:59.0-0400" },
    { number: 6, start: "2026-10-09T06:00:00.0-0400", end: "2026-10-16T05:59:59.0-0400" },
    { number: 7, start: "2026-10-16T06:00:00.0-0400", end: "2026-10-23T14:59:59.0-0400" },
  ];
  const paired = [
    { period: 7, homeTeamId: "t1", awayTeamId: "t2" },
    { period: 6, homeTeamId: "t1", awayTeamId: "t3" },
  ];

  it("opens at the first period with a head-to-head, not the calendar's first", () => {
    expect(leagueSeason({ matchups: paired, scoringPeriods: periods, endDate: "2027-05-30" })).toEqual({
      firstPeriod: 6,
      startDate: "2026-10-09",
      endDate: "2027-05-30",
    });
  });

  it("has no season of its own until the schedule pairs somebody", () => {
    expect(leagueSeason({ matchups: [], scoringPeriods: periods, endDate: "2027-05-30" })).toBeNull();
  });
});
