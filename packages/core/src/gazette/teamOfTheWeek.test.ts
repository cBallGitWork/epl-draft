import { describe, expect, it } from "vitest";
import { NO_SEASON } from "../football/noSeason";
import type { FootballPlayer, PlayerMatchStats } from "../football/types";
import type { RosteredTeam } from "../join/roster";
import { teamOfTheWeek } from "./teamOfTheWeek";

const footballer = (over: Partial<FootballPlayer>): FootballPlayer => ({
  id: 1, code: 1, name: "Player", fullName: "Player", clubId: 1, status: "a", news: "", chanceOfPlaying: null, optaCode: null, birthDate: null, region: null, newsAdded: null, season: NO_SEASON, ...over,
});

const limits = {
  maxTotalPlayers: 15,
  maxActivePlayers: 11,
  maxReservePlayers: 4,
  maxActiveByPosition: { D: 5, F: 3, G: 1, M: 5 }, minActiveByPosition: {},
};

/** Fantrax has priced nobody: the football alone ranks the side. */
const UNPRICED = new Map<string, number>();

const performer = (
  name: string,
  position: string,
  stats: Partial<PlayerMatchStats>,
  teamId = "t1",
  status = "ACTIVE",
): RosteredTeam => ({
  teamId,
  teamName: teamId,
  players: [
    {
      slot: { fantraxId: name, position, status },
      player: footballer({ name }),
      stats: [{
        playerId: 1, fixtureId: 1, minutes: 90, goals: 0, assists: 0, cleanSheet: false,
        goalsConceded: 0, ownGoals: 0, penaltiesSaved: 0, penaltiesMissed: 0, yellowCards: 0,
        redCards: 0, saves: 0, expectedGoals: 0,
        expectedAssists: 0, fplPoints: 0, starts: 1, ...stats,
      }],
    },
  ],
});

describe("teamOfTheWeek", () => {
  it("ranks by Fantrax's points for the period, the football breaking a tie", () => {
    const picked = teamOfTheWeek(
      [
        performer("Scorer", "F", { goals: 2 }),
        performer("Provider", "M", { assists: 1 }),
        performer("Stopper", "D", { cleanSheet: true }),
        performer("Header", "D", { goals: 1 }),
      ],
      limits,
      new Map([["Scorer", 6], ["Provider", 11], ["Stopper", 6], ["Header", 6]]),
    );
    expect(picked.picks.map((p) => p.playerName)).toEqual(["Provider", "Scorer", "Header", "Stopper"]);
    expect(picked.picks.map((p) => p.points)).toEqual([11, 6, 6, 6]);
  });

  it("prints no points for a man Fantrax has not priced", () => {
    const picked = teamOfTheWeek([performer("Unpriced", "F", { goals: 1 })], limits, UNPRICED);
    expect(picked.picks[0].points).toBeNull();
  });

  it("ranks goals above assists above a clean sheet", () => {
    const picked = teamOfTheWeek(
      [
        performer("Scorer", "F", { goals: 2 }),
        performer("Provider", "M", { assists: 2 }),
        performer("Stopper", "D", { cleanSheet: true }),
      ],
      limits,
      UNPRICED,
    );
    expect(picked.picks.map((p) => p.playerName)).toEqual(["Scorer", "Provider", "Stopper"]);
  });

  it("obeys the league's own position caps rather than a formation we chose", () => {
    // Two keepers both had a good week; the league allows one on the field.
    const picked = teamOfTheWeek(
      [
        performer("Keeper A", "G", { saves: 8, cleanSheet: true }, "t1"),
        performer("Keeper B", "G", { saves: 7, cleanSheet: true }, "t2"),
      ],
      limits,
      UNPRICED,
    );
    expect(picked.picks.map((p) => p.playerName)).toEqual(["Keeper A"]);
  });

  it("fields a keeper and every line, however well the outfield did, when the league publishes no minimum", () => {
    const outfield = [..."DDDDD"].map((p, i) => performer(`D${i}`, p, { goals: 1 }, `d${i}`))
      .concat([..."MMMMM"].map((p, i) => performer(`M${i}`, p, { goals: 1 }, `m${i}`)))
      .concat([..."FFF"].map((p, i) => performer(`F${i}`, p, { goals: 1 }, `f${i}`)));
    const squads = [...outfield, performer("Keeper", "G", { saves: 1 }, "g")];
    const picked = teamOfTheWeek(squads, limits, UNPRICED);
    expect(picked.picks.map((p) => p.position).filter((p) => p === "G")).toEqual(["G"]);
    expect(picked.shape).toBe("1-5-4-1");
    expect(teamOfTheWeek(squads, { ...limits, minActiveByPosition: { G: 1, D: 3, M: 2, F: 1 } }, UNPRICED).shape).toBe("1-5-4-1");
  });

  it("never picks more than may take the field", () => {
    const squads = Array.from({ length: 14 }, (_, i) =>
      performer(`M${i}`, "M", { assists: 1 }, `t${i}`),
    );
    expect(teamOfTheWeek(squads, limits, UNPRICED).picks.length).toBeLessThanOrEqual(11);
  });

  it("names the owner, which is the entire joke", () => {
    const picked = teamOfTheWeek([performer("Haaland", "F", { goals: 3 }, "someone")], limits, UNPRICED);
    expect(picked.picks[0].ownerTeamId).toBe("someone");
    expect(picked.picks[0].ownerName).toBe("someone");
  });

  it("marks a player his own manager benched", () => {
    // The best story on the page: he scored twice from the reserves.
    const picked = teamOfTheWeek(
      [performer("Benched", "F", { goals: 2 }, "t1", "RESERVE")],
      limits,
      UNPRICED,
    );
    expect(picked.picks[0].started).toBe(false);
  });

  it("leaves out anyone who did not play", () => {
    expect(teamOfTheWeek([performer("Unused", "F", { minutes: 0 })], limits, UNPRICED).picks).toEqual([]);
  });

  it("counts the shape back to front, not alphabetically", () => {
    // One keeper, two defenders, three forwards. The caps arrive keyed D, F, G,
    // M, so reading them in payload order would say "2-3-1" — a formation with
    // the keeper up front. Back to front it is "1-2-3".
    const picked = teamOfTheWeek(
      [
        performer("K", "G", { cleanSheet: true, saves: 6 }, "t1"),
        performer("D1", "D", { goals: 1 }, "t2"),
        performer("D2", "D", { assists: 1 }, "t3"),
        performer("F1", "F", { goals: 3 }, "t4"),
        performer("F2", "F", { goals: 2 }, "t5"),
        performer("F3", "F", { goals: 1, assists: 1 }, "t6"),
      ],
      limits,
      UNPRICED,
    );
    expect(picked.shape).toBe("1-2-3");
  });

  it("will not fill a position the league sets no cap for", () => {
    // A commissioner adding "W" for wingers has not said how many may play, and
    // inventing that number is inventing a rule.
    const picked = teamOfTheWeek([performer("Winger", "W", { goals: 3 })], limits, UNPRICED);
    expect(picked.picks).toEqual([]);
  });

  it("stands the eleven up in lines, keeper first, and counts the shape off them", () => {
    const picked = teamOfTheWeek(
      [
        performer("Keeper", "G", { saves: 6, cleanSheet: true }),
        performer("Back", "D", { cleanSheet: true }),
        performer("Runner", "M", { goals: 1 }),
        performer("Striker", "F", { goals: 2 }),
      ],
      limits,
      UNPRICED,
    );
    // Not the payload's alphabetical D-F-G-M, which would put the keeper third.
    expect(picked.lines.map((line) => line.position)).toEqual(["G", "D", "M", "F"]);
    expect(picked.shape).toBe("1-1-1-1");
    expect(picked.lines.flatMap((line) => line.picks)).toHaveLength(picked.picks.length);
  });

  it("has nothing to say before a ball is kicked", () => {
    expect(teamOfTheWeek([], limits, UNPRICED)).toEqual({ picks: [], lines: [], shape: "" });
  });

  it("names nobody when the league has published no cap on the XI", () => {
    // Not a team of whatever the position caps add up to. Fourteen is as
    // invented as eleven when the league has said neither.
    expect(
      teamOfTheWeek(
        [performer("Haaland", "F", { goals: 3 })],
        { ...limits, maxActivePlayers: null },
        UNPRICED,
      ),
    ).toEqual({ picks: [], lines: [], shape: "" });
  });
});
