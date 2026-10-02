import { describe, expect, it } from "vitest";
import { COMPETITIONS, LEAGUE_COMPETITION, cupTies, groupTies, leagueTies, seededIn } from "./competitions";

const team = (teamId: string, name: string) => ({ teamId, name });

describe("leagueTies", () => {
  it("carries Fantrax's pairings through as the league's own competition", () => {
    const [tie] = leagueTies([{ home: team("t1", "Alpha"), away: team("t2", "Bravo") }]);
    expect(tie?.competition).toEqual(LEAGUE_COMPETITION);
    expect(tie?.round).toBeNull();
    expect(tie?.home.team?.teamId).toBe("t1");
    expect(tie?.away.label).toBe("Bravo");
  });
});

describe("cupTies", () => {
  it("opens the Timbeibs Cup on GW10 with two ties still to be drawn", () => {
    const ties = cupTies(10, 10);
    expect(ties.map((tie) => [tie.competition.id, tie.round, tie.home.label, tie.away.label])).toEqual([
      ["timbeibs", "Round 1", "To be drawn", "To be drawn"],
      ["timbeibs", "Round 1", "To be drawn", "To be drawn"],
    ]);
    expect(ties.every((tie) => tie.home.team === null && tie.away.team === null)).toBe(true);
  });

  it("answers nothing for a gameweek no cup plays in", () => {
    expect(cupTies(10, 9)).toEqual([]);
    expect(cupTies(10, 6)).toEqual([]);
  });

  it("belongs every tie to a competition the schedule knows", () => {
    const known = new Set(COMPETITIONS.map((competition) => competition.id));
    for (let gameweek = 1; gameweek <= 38; gameweek++) {
      for (const tie of cupTies(10, gameweek)) expect(known.has(tie.competition.id)).toBe(true);
    }
  });
});

describe("seededIn", () => {
  it("names the Timbeibs Cup on GW9, whose points set its seeds", () => {
    expect(seededIn(9)?.id).toBe("timbeibs");
  });

  it("names no cup on any other gameweek, the group-seeded cup included", () => {
    for (let gameweek = 1; gameweek <= 38; gameweek++) {
      if (gameweek !== 9) expect(seededIn(gameweek)).toBeUndefined();
    }
  });
});

describe("COMPETITIONS", () => {
  it("leads with the one Fantrax actually scores", () => {
    expect(COMPETITIONS[0]).toEqual(LEAGUE_COMPETITION);
  });
});

describe("groupTies", () => {
  const ties = [...cupTies(10, 13), ...leagueTies([{ home: team("t1", "Alpha"), away: team("t2", "Bravo") }])];

  it("boxes each competition's ties under it, league first", () => {
    expect(groupTies(ties).map((group) => group.competition.id)).toEqual(["league", "timbeibs", "timbeibs"]);
  });

  it("keeps the league's own fixtures out of any round, and splits a cup's two rounds in one week", () => {
    expect(groupTies(ties).map((group) => group.round)).toEqual([null, "Round 3", "Losers' round 2"]);
  });
});
