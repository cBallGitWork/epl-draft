import { describe, expect, it } from "vitest";
import { NO_SEASON } from "../football/noSeason";
import type { PlayerMatchStats } from "../football/types";
import recorded from "../league/fantrax/__fixtures__/scoringSystem.json";
import { mapScoringRules } from "../league/fantrax/scoring";
import type { RawScoringSystem } from "../league/fantrax/scoring";
import { pendingCleanSheets } from "./cleanSheets";
import type { RosteredPlayer, RosteredTeam } from "./roster";

const rules = mapScoringRules(recorded as RawScoringSystem)!;

const stat = (over: Partial<PlayerMatchStats> = {}): PlayerMatchStats => ({
  playerId: 1, fixtureId: 100, minutes: 90, goals: 0, assists: 0, cleanSheet: true,
  goalsConceded: 0, ownGoals: 0, penaltiesSaved: 0, penaltiesMissed: 0, yellowCards: 0,
  redCards: 0, saves: 0, expectedGoals: 0,
  expectedAssists: 0, fplPoints: 0, starts: 1, ...over,
});

const player = (
  position: string | null,
  stats: PlayerMatchStats[],
  status = "ACTIVE",
): RosteredPlayer => ({
  slot: { fantraxId: `f${position}${stats.length}${status}`, position, status },
  player: {
    id: 1, code: 1, name: "N", fullName: "N", clubId: 1, status: "a", news: "", chanceOfPlaying: null, optaCode: null, birthDate: null, region: null, newsAdded: null, season: NO_SEASON,
  },
  stats,
});

const team = (players: RosteredPlayer[]): RosteredTeam => ({
  teamId: "t1",
  teamName: "Team",
  players,
});

const IN_PLAY = new Set([100]);

describe("pendingCleanSheets", () => {
  it("prices each position from the league's own table", () => {
    // Four for the defender, one for the midfielder, four for the keeper.
    const squad = team([player("D", [stat()]), player("M", [stat()]), player("G", [stat()])]);
    expect(pendingCleanSheets(squad, rules, IN_PLAY)).toEqual({ points: 9, players: 3 });
  });

  it("waits for the hour, as FPL does", () => {
    // The whole point of the preview is that it appears when a manager watching
    // the match expects it to.
    const squad = team([player("D", [stat({ minutes: 59 })])]);
    expect(pendingCleanSheets(squad, rules, IN_PLAY).points).toBe(0);
    expect(pendingCleanSheets(team([player("D", [stat({ minutes: 60 })])]), rules, IN_PLAY).points).toBe(4);
  });

  it("stops the moment a goal goes in", () => {
    const squad = team([player("D", [stat({ cleanSheet: false, goalsConceded: 1 })])]);
    expect(pendingCleanSheets(squad, rules, IN_PLAY)).toEqual({ points: 0, players: 0 });
  });

  it("trusts FPL's verdict over a goals-conceded count of zero", () => {
    // On a double, `explain` omits a goals-conceded line worth nought, so one conceded reads as zero.
    const squad = team([player("D", [stat({ cleanSheet: false, goalsConceded: 0 })])]);
    expect(pendingCleanSheets(squad, rules, IN_PLAY)).toEqual({ points: 0, players: 0 });
  });

  it("drops a clean sheet once the match is over", () => {
    // Fantrax credits it at the whistle, so counting a finished fixture here
    // would show the same four points twice.
    const squad = team([player("D", [stat()])]);
    expect(pendingCleanSheets(squad, rules, new Set()).points).toBe(0);
  });

  it("ignores reserves, who cannot score at all", () => {
    const squad = team([player("D", [stat()], "RESERVE")]);
    expect(pendingCleanSheets(squad, rules, IN_PLAY).points).toBe(0);
  });

  it("owes a forward nothing, and does not count him as owed", () => {
    // Priced at zero by the league rather than unpriced — a real answer, and
    // "3 clean sheets pending" must not include a striker.
    const squad = team([player("F", [stat()])]);
    expect(pendingCleanSheets(squad, rules, IN_PLAY)).toEqual({ points: 0, players: 0 });
  });

  it("counts a player whose double gameweek has one match in play", () => {
    const squad = team([
      player("D", [stat({ fixtureId: 99, cleanSheet: false, goalsConceded: 2 }), stat({ fixtureId: 100 })]),
    ]);
    expect(pendingCleanSheets(squad, rules, IN_PLAY).points).toBe(4);
  });

  it("says nothing for a slot with no position", () => {
    const squad = team([player(null, [stat()])]);
    expect(pendingCleanSheets(squad, rules, IN_PLAY).points).toBe(0);
  });

  it("owes nothing before a ball is kicked", () => {
    expect(pendingCleanSheets(team([player("D", [])]), rules, IN_PLAY)).toEqual({
      points: 0,
      players: 0,
    });
  });
});
