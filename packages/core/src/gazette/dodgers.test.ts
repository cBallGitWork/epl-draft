import { describe, expect, it } from "vitest";
import { NO_SEASON } from "../football/noSeason";
import { DODGERS_SHOWN, dodgers } from "./dodgers";
import type { RosteredTeam } from "../join/roster";
import type { PlayerMatchStats } from "../football/types";

const stats = (over: Partial<PlayerMatchStats> = {}): PlayerMatchStats => ({
  playerId: 1, fixtureId: 1, minutes: 90, goals: 0, assists: 0, cleanSheet: false,
  goalsConceded: 0, ownGoals: 0, penaltiesSaved: 0, penaltiesMissed: 0,
  yellowCards: 0, redCards: 0, saves: 0, bonus: 0, bps: 0,
  defensiveContribution: 0, expectedGoals: 0, expectedAssists: 0,
  ...over,
});

const man = (name: string, status: string, over: Partial<PlayerMatchStats> = {}) => ({
  slot: { fantraxId: name, position: "M", status },
  player: {
    id: 1, code: 1, name, fullName: name, clubId: 1,
    status: "a", news: "", chanceOfPlaying: null, optaCode: null, birthDate: null, joinedClub: null, season: NO_SEASON,
  },
  stats: [stats(over)],
});

const team = (teamId: string, players: ReturnType<typeof man>[]): RosteredTeam => ({
  teamId,
  teamName: teamId,
  players,
});

describe("dodgers", () => {
  it("names the men their own managers left out, and nobody who started", () => {
    const teams = [
      team("t1", [man("Benched", "RESERVE", { goals: 2 }), man("Started", "ACTIVE", { goals: 3 })]),
    ];
    expect(dodgers(teams).map((pick) => pick.playerName)).toEqual(["Benched"]);
  });

  it("leaves out a benched man who did nothing", () => {
    // Otherwise the column is a list of every reserve in the league, which is
    // not a joke, it is a roster.
    const teams = [team("t1", [man("Quiet", "RESERVE"), man("Loud", "RESERVE", { assists: 1 })])];
    expect(dodgers(teams).map((pick) => pick.playerName)).toEqual(["Loud"]);
  });

  it("counts a clean sheet as having done something", () => {
    const teams = [team("t1", [man("Keeper", "RESERVE", { cleanSheet: true })])];
    expect(dodgers(teams)).toHaveLength(1);
  });

  it("stays a column rather than becoming a table", () => {
    const teams = [
      team("t1", Array.from({ length: 9 }, (_, n) => man(`M${n}`, "RESERVE", { goals: 1 }))),
    ];
    expect(dodgers(teams)).toHaveLength(DODGERS_SHOWN);
  });

  it("orders by what they did, worst benching first", () => {
    const teams = [
      team("t1", [man("One", "RESERVE", { goals: 1 }), man("Two", "RESERVE", { goals: 2 })]),
    ];
    expect(dodgers(teams).map((pick) => pick.playerName)).toEqual(["Two", "One"]);
  });
});
