import { describe, expect, it } from "vitest";
import type { TeamForm } from "../../league/form";
import type { EditionTie } from "../published";
import { predictionRecord, type CalledColumn } from "./record";

const tie = (home: string, away: string, calls: string | null, over: Partial<EditionTie> = {}): EditionTie => ({
  homeTeamId: home,
  awayTeamId: away,
  line: "A line.",
  callsTeamId: calls,
  ...over,
});

/** Fantrax's settled rounds for a team, from its side. */
const form = (teamId: string, games: [period: number, result: "W" | "D" | "L", pf: number, pa: number][]): TeamForm => ({
  teamId,
  run: games.map(([period, result, pointsFor, pointsAgainst]) => ({ period, result, pointsFor, pointsAgainst })),
});

describe("predictionRecord", () => {
  const gw6: CalledColumn = {
    period: 6,
    gameweek: 6,
    ties: [
      tie("a", "b", "a"),
      tie("c", "d", "c", { instinct: "doubt" }),
      tie("e", "f", null),
      tie("g", "h", "g"),
    ],
  };
  const settled = [
    form("a", [[6, "W", 52, 38]]),
    form("c", [[6, "L", 41, 49]]),
    form("e", [[6, "W", 40, 30]]),
    // g's round is still being played: nothing in its run for period 6.
    form("g", []),
  ];

  it("marks the calls a settled round can mark, with the gut calls apart", () => {
    const record = predictionRecord([gw6], settled);
    expect(record.last?.marks?.all).toEqual({ right: 1, called: 2 });
    expect(record.last?.marks?.gut).toEqual({ right: 0, called: 1 });
    // The miss carries the real score, winner first.
    expect(record.last?.marks?.misses).toEqual([
      { gameweek: 6, calledTeamId: "c", winnerTeamId: "d", loserTeamId: "c", winnerPoints: 49, loserPoints: 41, gut: true },
    ]);
  });

  it("counts nothing for a declined call, a dead heat or an unsettled tie", () => {
    const column: CalledColumn = { period: 7, gameweek: 7, ties: [tie("a", "b", "a"), tie("e", "f", null)] };
    const record = predictionRecord([column], [form("a", [[7, "D", 40, 40]]), form("e", [[7, "W", 40, 30]])]);
    // Settled, every call level: nothing to mark, and still not an unsettled round.
    expect(record.last).toEqual({ gameweek: 7, marks: { all: { right: 0, called: 0 }, gut: null, level: { all: 1, gut: 0 }, misses: [] } });
    expect(record.season).toEqual({ all: null, gut: null });
    expect(predictionRecord([column], [form("e", [[7, "W", 40, 30]])]).last).toEqual({ gameweek: 7, marks: null });
  });

  it("knows a gut call that ended level from no gut call at all", () => {
    const column: CalledColumn = { period: 7, gameweek: 7, ties: [tie("a", "b", "a"), tie("c", "d", "d", { instinct: "doubt" })] };
    const marks = predictionRecord([column], [form("a", [[7, "W", 50, 40]]), form("c", [[7, "D", 45, 45]])]).last?.marks;
    expect(marks).toMatchObject({ all: { right: 1, called: 1 }, gut: null, level: { all: 1, gut: 1 } });
  });

  it("sums the season across columns and owns the newest", () => {
    const gw7: CalledColumn = { period: 7, gameweek: 7, ties: [tie("a", "c", "c")] };
    const record = predictionRecord([gw7, gw6], [...settled, form("a", [[6, "W", 52, 38], [7, "L", 30, 44]])]);
    expect(record.last?.gameweek).toBe(7);
    expect(record.last?.marks?.all).toEqual({ right: 1, called: 1 });
    expect(record.season.all).toEqual({ right: 2, called: 3 });
    expect(record.season.gut).toEqual({ right: 0, called: 1 });
  });

  it("marks a double header's tie against its own opponent, never the period's other game", () => {
    // h beat a1 50-40 and lost to a2 50-60 in one period: Fantrax gives h one total for both.
    const column: CalledColumn = { period: 29, gameweek: 34, ties: [tie("h", "a1", "h"), tie("a2", "x", "x")] };
    const double = [form("h", [[29, "W", 50, 40], [29, "L", 50, 60]]), form("a1", [[29, "L", 40, 50]]), form("a2", [[29, "W", 60, 50], [29, "W", 60, 30]]), form("x", [[29, "L", 30, 60]])];
    const record = predictionRecord([column], double);
    expect(record.last?.marks?.all).toEqual({ right: 1, called: 2 });
    expect(record.last?.marks?.misses).toEqual([{ gameweek: 34, calledTeamId: "x", winnerTeamId: "a2", loserTeamId: "x", winnerPoints: 60, loserPoints: 30, gut: false }]);
  });

  it("has no record before his first column", () => {
    expect(predictionRecord([], settled)).toEqual({ last: null, season: { all: null, gut: null } });
  });
});
