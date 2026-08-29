import { describe, expect, it } from "vitest";
import {
  COMPETITIONS,
  LEAGUE_COMPETITION,
  PLACEHOLDER_ROUNDS,
  groupTies,
  leagueTies,
  seededTies,
} from "./competitions";
import type { StandingsRow } from "./types";

const team = (teamId: string, name: string) => ({ teamId, name });

const row = (rank: number, teamId: string, teamName: string): StandingsRow => ({
  teamId,
  teamName,
  rank,
  won: 0,
  drawn: 0,
  lost: 0,
  points: 0,
  pointsFor: 0,
  gamesBack: null,
  winPercentage: null,
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

describe("seededTies", () => {
  it("draws a seeded round against the table as it stands", () => {
    const ties = seededTies(PLACEHOLDER_ROUNDS, table, 4);
    expect(ties).toHaveLength(2);
    expect(ties.map((tie) => [tie.home.label, tie.away.label])).toEqual([
      ["Alpha", "Delta"],
      ["Bravo", "Charlie"],
    ]);
    expect(ties[0]?.round).toBe("Semi-finals");
  });

  it("prints the place, not a team, when the table cannot name one", () => {
    // Every day until the draft. A final between "1st" and "2nd" is a true
    // statement about an undrafted league; one between two invented names is not.
    const ties = seededTies(PLACEHOLDER_ROUNDS, [], 38);
    expect(ties[0]?.home).toEqual({ team: null, label: "1st" });
    expect(ties[0]?.away).toEqual({ team: null, label: "2nd" });
  });

  it("leaves a side that is won rather than seeded unnamed", () => {
    // The cup final's sides come out of the semi-finals, and seeding them from
    // the table would put a team in a final it has not reached.
    const ties = seededTies(PLACEHOLDER_ROUNDS, table, 5);
    expect(ties[0]?.home).toEqual({ team: null, label: "Winner, semi-final 1" });
  });

  it("answers nothing for a gameweek no round falls in", () => {
    expect(seededTies(PLACEHOLDER_ROUNDS, table, 6)).toEqual([]);
  });

  it("declines to name a team the table left blank", () => {
    expect(seededTies(PLACEHOLDER_ROUNDS, [row(1, "t1", "")], 38)[0]?.home.label).toBe("1st");
  });
});

describe("COMPETITIONS", () => {
  it("leads with the one Fantrax actually scores", () => {
    expect(COMPETITIONS[0]).toEqual(LEAGUE_COMPETITION);
  });

  it("names every competition the placeholder rounds belong to", () => {
    const known = new Set(COMPETITIONS.map((competition) => competition.id));
    for (const round of PLACEHOLDER_ROUNDS) expect(known.has(round.competition.id)).toBe(true);
  });
});

describe("groupTies", () => {
  const ties = [
    ...seededTies(PLACEHOLDER_ROUNDS, table, 4),
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
    const twoRounds = seededTies(
      [
        { competition: { id: "cup", name: "Cup" }, gameweek: 9, name: "Quarter-finals", ties: [[1, 2]] },
        { competition: { id: "cup", name: "Cup" }, gameweek: 9, name: "Semi-finals", ties: [[3, 4]] },
      ],
      table,
      9,
    );
    expect(groupTies(twoRounds).map((group) => group.round)).toEqual([
      "Quarter-finals",
      "Semi-finals",
    ]);
  });
});

