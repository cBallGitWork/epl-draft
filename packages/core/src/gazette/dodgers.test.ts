import { describe, expect, it } from "vitest";
import { DODGERS } from "../config";
import { NO_SEASON } from "../football/noSeason";
import type { MomentKind, PlMoment } from "../football/premierleague/moments";
import type { Fixture, PlayerMatchStats } from "../football/types";
import type { RosteredTeam } from "../join/roster";
import type { ScoringRules } from "../league/scoring";
import { dodgers, type DodgerMatch } from "./dodgers";

const CITY = 1;
const RIVALS = 2;
const SCORING: ScoringRules = { goalie: { CS: { G: 4 } }, outfield: { CS: { D: 4, M: 1, F: 0 } }, goaliePosition: "G" };

const stats = (over: Partial<PlayerMatchStats> = {}): PlayerMatchStats => ({
  playerId: 1, fixtureId: 1, minutes: 90, goals: 0, assists: 0, cleanSheet: false,
  goalsConceded: 0, ownGoals: 0, penaltiesSaved: 0, penaltiesMissed: 0,
  yellowCards: 0, redCards: 0, saves: 0,
  expectedGoals: 0, expectedAssists: 0, fplPoints: 0, starts: 1, ...over,
});

const man = (code: number, position: string, over: Partial<PlayerMatchStats> = {}, status = "ACTIVE") => ({
  slot: { fantraxId: `f${code}`, position, status },
  player: {
    id: code, code, name: `Man${code}`, fullName: `Man ${code}`, clubId: CITY,
    status: "a", news: "", chanceOfPlaying: null, optaCode: null, birthDate: null, region: null, newsAdded: null, season: NO_SEASON,
  },
  stats: [stats(over)],
});

const teams = (...players: ReturnType<typeof man>[]): RosteredTeam[] => [{ teamId: "t1", teamName: "test2", players }];

const moment = (kind: MomentKind, minute: string, shooter: number | null, maker: number | null = null, from: string | null = null): PlMoment => ({
  id: 0, minute, half: Number.parseInt(minute, 10) <= 45 ? 1 : 2, kind, men: [shooter, maker],
  shot: { foot: null, from, to: null, supply: null, situation: kind.startsWith("penalty") ? "penalty" : null },
  injury: false, addedMinutes: null, varCall: null,
});

const fixture = { id: 1, code: 1, gameweek: 5, homeClubId: CITY, awayClubId: RIVALS } as Fixture;
const match = (...moments: PlMoment[]): DodgerMatch[] => [{ fixture, moments }];
// Men 1-9 play for City; 50 plays for the other side.
const clubOfCode = new Map([...Array.from({ length: 9 }, (_, n) => [n + 1, CITY] as const), [50, RIVALS] as const]);

const run = (squads: RosteredTeam[], matches: DodgerMatch[]) => dodgers({ teams: squads, matches, scoring: SCORING, clubOfCode });

describe("dodgers", () => {
  it("names a man who hit the woodwork and got nothing, whether or not he was benched", () => {
    const found = run(teams(man(1, "F", { expectedGoals: 0.2 }, "RESERVE")), match(moment("woodwork", "34", 1)));
    expect(found.map((d) => [d.playerName, d.misses, d.shots])).toEqual([["Man1", [{ kind: "woodwork", minute: "34" }], 1]]);
  });

  it("leaves out a man who got every kind of points he nearly got", () => {
    const woodwork = match(moment("woodwork", "34", 1));
    expect(run(teams(man(1, "F", { goals: 1, expectedGoals: 2 })), woodwork)).toEqual([]);
  });

  it("names a man with high expected assists and no assist, though he scored", () => {
    const found = run(teams(man(1, "M", { goals: 1, expectedGoals: 2, expectedAssists: DODGERS.from.assist })), match(moment("woodwork", "10", 1)));
    expect(found[0]).toMatchObject({ goals: 1, assists: 0, misses: [] });
    expect(found[0].nearness).toBeCloseTo(DODGERS.from.goal);
  });

  it("keeps a scorer's shots off his near misses and an assister's chances off his", () => {
    const found = run(teams(man(1, "F", { assists: 1, expectedGoals: 0.2, expectedAssists: 3 })), match(moment("woodwork", "34", 1), moment("woodwork", "50", 2, 1)));
    expect(found[0].misses).toEqual([{ kind: "woodwork", minute: "34" }]);
    expect(found[0].nearness).toBeCloseTo(0.2 + DODGERS.weight.woodwork);
  });

  it("counts a clean sheet as points only where the league pays one, and never as a goal", () => {
    const woodwork = match(moment("woodwork", "34", 1), moment("woodwork", "40", 2));
    const found = run(teams(man(1, "D", { cleanSheet: true, expectedGoals: 0.2 }), man(2, "F", { cleanSheet: true, expectedGoals: 0.2 })), woodwork);
    expect(found.map((d) => [d.playerName, d.cleanSheet])).toEqual([["Man1", true], ["Man2", false]]);
  });

  it("names a defender whose only goal against came late, with its minute", () => {
    const found = run(teams(man(1, "D", { goalsConceded: 1 })), match(moment("goal", "88", 50)));
    expect(found[0].misses).toEqual([{ kind: "clean-sheet-lost", minute: "88" }]);
  });

  it("finds no lost clean sheet in an early goal, a late substitute, a forward, or two goals against", () => {
    expect(run(teams(man(1, "D")), match(moment("goal", "30", 50)))).toEqual([]);
    expect(run(teams(man(1, "D", { minutes: 20 })), match(moment("goal", "88", 50)))).toEqual([]);
    expect(run(teams(man(1, "F")), match(moment("goal", "88", 50)))).toEqual([]);
    expect(run(teams(man(1, "D")), match(moment("goal", "60", 50), moment("goal", "88", 50)))).toEqual([]);
  });

  it("counts a goal Opta cancelled twice at one minute once, and drops its clock's padding", () => {
    const found = run(teams(man(1, "D", { cleanSheet: true })), match(moment("ruled-out", "07", 1), moment("ruled-out", "07", 1)));
    expect(found[0].misses).toEqual([{ kind: "ruled-out", minute: "7" }]);
  });

  it("reads an own goal as one against the scorer's own side", () => {
    const found = run(teams(man(1, "G")), match(moment("own-goal", "90+2", 2)));
    expect(found[0].misses).toEqual([{ kind: "clean-sheet-lost", minute: "90+2" }]);
  });

  it("credits the maker of a shot off the woodwork, and never a penalty as a chance made", () => {
    const found = run(teams(man(1, "M", { expectedAssists: 0.3 })), match(moment("woodwork", "12", 50, 1, "from inside the box"), moment("penalty-missed", "70", 50, 1)));
    expect(found[0]).toMatchObject({ chancesMade: 1, chancesInBox: 1, misses: [{ kind: "set-up-woodwork", minute: "12" }] });
  });

  it("counts a goal ruled out, a penalty missed and close-range shots", () => {
    const found = run(
      teams(man(1, "F", { expectedGoals: 0.1 })),
      match(moment("ruled-out", "20", 1), moment("penalty-missed", "55", 1), moment("saved", "70", 1, null, "from close range")),
    );
    expect(found[0]).toMatchObject({ shots: 2, onTarget: 1, inBox: 1, close: 1 });
    expect(found[0].misses.map((m) => m.kind)).toEqual(["ruled-out", "penalty-missed"]);
  });

  it("leaves out a man who was never near enough", () => {
    const quiet = man(1, "F", { expectedGoals: DODGERS.from.goal / 2, expectedAssists: DODGERS.from.assist / 4 });
    expect(run(teams(quiet), match(moment("missed", "10", 1)))).toEqual([]);
  });

  it("names the nearest first and stays a column", () => {
    const squad = teams(...Array.from({ length: 8 }, (_, n) => man(n + 1, "F", { expectedGoals: 1 + n / 10 })));
    const found = run(squad, match());
    expect(found).toHaveLength(DODGERS.shown);
    expect(found[0].playerName).toBe("Man8");
  });
});
