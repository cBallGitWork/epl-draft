import { describe, expect, it } from "vitest";
import {
  COMPETITIONS,
  LEAGUE_COMPETITION,
  KNOCKOUT_ROUNDS,
  type Draw,
  groupTies,
  leagueTies,
  seededTies,
} from "./competitions";
import { tableSeeds } from "./draw";
import type { StandingsRow } from "./types";

const team = (teamId: string, name: string) => ({ teamId, name });

const row = (rank: number, teamId: string, teamName: string): StandingsRow => ({
  teamId,
  teamName,
  rank,
  won: 0,
  drawn: 0,
  lost: 0,
  played: 0,
  points: 0,
  pointsFor: 0,
  pointsAgainst: 0,
});

const table = [row(1, "t1", "Alpha"), row(2, "t2", "Bravo"), row(3, "t3", "Charlie"), row(4, "t4", "Delta")];

describe("leagueTies", () => {
  it("carries Fantrax's pairings through as the league's own competition", () => {
    const [tie] = leagueTies([{ home: team("t1", "Alpha"), away: team("t2", "Bravo") }]);
    expect(tie?.competition).toEqual(LEAGUE_COMPETITION);
    expect(tie?.round).toBeNull();
    expect(tie?.home.team?.teamId).toBe("t1");
    expect(tie?.away.label).toBe("Bravo");
  });
});

const NONE = new Map();
const tableDraw = (rows: StandingsRow[]): Draw => ({
  seeds: (competition) => (competition.seededBy === "table" ? tableSeeds(rows) : NONE),
  totals: () => undefined,
});

describe("seededTies", () => {
  it("draws the playoff final against the table as it stands", () => {
    const [tie] = seededTies(KNOCKOUT_ROUNDS, 38, tableDraw(table));
    expect([tie?.home.label, tie?.away.label]).toEqual(["Alpha", "Bravo"]);
    expect(tie?.round).toBe("Final");
  });

  it("prints the place, not a team, when the table cannot name one", () => {
    const [tie] = seededTies(KNOCKOUT_ROUNDS, 38, tableDraw([]));
    expect(tie?.home).toEqual({ team: null, label: "1st" });
    expect(tie?.away).toEqual({ team: null, label: "2nd" });
  });

  it("declines to name a team the table left blank", () => {
    expect(seededTies(KNOCKOUT_ROUNDS, 38, tableDraw([row(1, "t1", "")]))[0]?.home.label).toBe("1st");
  });

  it("prints a cup seed as a seed before the seeding gameweek is played", () => {
    const [tie] = seededTies(KNOCKOUT_ROUNDS, 10, tableDraw(table));
    expect([tie?.home.label, tie?.away.label]).toEqual(["Seed 7", "Seed 10"]);
  });

  it("leaves a side that is won rather than seeded unnamed until it is won", () => {
    const [tie] = seededTies(KNOCKOUT_ROUNDS, 11, tableDraw(table));
    expect(tie?.away).toEqual({ team: null, label: "Winner OR2" });
  });

  it("answers nothing for a gameweek no round falls in", () => {
    expect(seededTies(KNOCKOUT_ROUNDS, 6, tableDraw(table))).toEqual([]);
  });
});

describe("seededTies, resolved", () => {
  const cup = { id: "cup", name: "Cup", seededBy: { gameweek: 1 } } as const;
  const rounds = [
    { competition: cup, gameweek: 2, name: "Semi-finals", ties: [
      { id: "semi 1", home: 1, away: 4 },
      { id: "semi 2", home: 2, away: 3 },
    ] },
    { competition: cup, gameweek: 3, name: "Final", ties: [
      { id: "final", home: { winner: "semi 1" }, away: { loser: "semi 2" } },
    ] },
  ];
  const seeds = new Map([1, 2, 3, 4].map((seed) => [seed, team(`t${seed}`, `Team ${seed}`)]));
  const drawWith = (gameweek2: Record<string, number | null> | undefined): Draw => ({
    seeds: () => seeds,
    totals: (gameweek) =>
      gameweek === 2 && gameweek2 ? new Map(Object.entries(gameweek2)) : undefined,
  });

  it("names the winner and the loser once their tie is finished", () => {
    const [final] = seededTies(rounds, 3, drawWith({ t1: 40, t4: 55, t2: 60, t3: 30 }));
    expect([final?.home.label, final?.away.label]).toEqual(["Team 4", "Team 3"]);
  });

  it("puts the higher seed through when the points are level", () => {
    const [final] = seededTies(rounds, 3, drawWith({ t1: 50, t4: 50, t2: 60, t3: 30 }));
    expect(final?.home.team?.teamId).toBe("t1");
  });

  it("decides nothing while the tie's gameweek is unfinished or a total is missing", () => {
    expect(seededTies(rounds, 3, drawWith(undefined))[0]?.home.label).toBe("Winner semi 1");
    const missing = seededTies(rounds, 3, drawWith({ t1: 50, t4: null, t2: 60, t3: 30 }));
    expect(missing[0]?.home.label).toBe("Winner semi 1");
    expect(missing[0]?.away.label).toBe("Team 3");
  });
});

describe("COMPETITIONS", () => {
  it("leads with the one Fantrax actually scores", () => {
    expect(COMPETITIONS[0]).toEqual(LEAGUE_COMPETITION);
  });

  it("names every competition the declared rounds belong to", () => {
    const known = new Set(COMPETITIONS.map((competition) => competition.id));
    for (const round of KNOCKOUT_ROUNDS) expect(known.has(round.competition.id)).toBe(true);
  });
});

describe("groupTies", () => {
  const ties = [
    ...seededTies(KNOCKOUT_ROUNDS, 10, tableDraw(table)),
    ...leagueTies([{ home: team("t1", "Alpha"), away: team("t2", "Bravo") }]),
  ];

  it("boxes each competition's ties under it, league first", () => {
    const groups = groupTies(ties);
    expect(groups.map((group) => group.competition.id)).toEqual(["league", "cup"]);
    expect(groups[1]?.ties).toHaveLength(2);
  });

  it("keeps the league's own fixtures out of any round", () => {
    expect(groupTies(ties)[0]?.round).toBeNull();
  });

  it("splits one competition's rounds apart when a gameweek holds two", () => {
    const twoRounds = seededTies(KNOCKOUT_ROUNDS, 13, tableDraw(table));
    expect(groupTies(twoRounds).map((group) => group.round)).toEqual([
      "Semi-finals",
      "Losers' round 2",
    ]);
  });
});

