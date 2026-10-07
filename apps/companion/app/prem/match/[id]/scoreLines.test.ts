import { describe, expect, it } from "vitest";
import type { FootballPlayer, MatchSheetLine, PlGoal, SheetRow } from "@epl/core";
import { side } from "./scoreLines";

const line = (code: number, over: Partial<MatchSheetLine> = {}): MatchSheetLine => ({
  playerId: code, side: "home", goals: 0, assists: 0, ownGoals: 0, penaltiesSaved: 0,
  penaltiesMissed: 0, yellowCards: 0, redCards: 0, saves: 0, bps: 0,
  defensiveContribution: 0, ...over,
});
const row = (code: number, over: Partial<MatchSheetLine> = {}): SheetRow => ({
  player: { code } as FootballPlayer,
  line: line(code, over),
});
const goal = (scorer: number, over: Partial<PlGoal> = {}): PlGoal => ({
  minute: 10, teamId: 0, scorer, assister: null, own: false, ...over,
});
const none = new Map<number, number[]>();
const nobodyHurt = new Map<number, number>();

const brighton = [row(1, { goals: 1 }), row(2)];
const villa = [row(9, { ownGoals: 1 })];

describe("side", () => {
  it("puts an own goal on the scoring side's sheet only", () => {
    // Brighton 4-0 Aston Villa printed Lindelöf's own goal on both sheets.
    const goals = [goal(1), goal(9, { own: true, minute: 30 })];
    expect(side(goals, brighton, villa, none, [], new Map(), nobodyHurt).goals.map((g) => g.scorer)).toEqual([1, 9]);
    expect(side(goals, villa, brighton, none, [], new Map(), nobodyHurt).goals).toEqual([]);
  });

  it("places an own goal by a man neither side knows on neither sheet", () => {
    const goals = [goal(77, { own: true })];
    expect(side(goals, brighton, villa, none, [], new Map(), nobodyHurt).goals).toEqual([]);
    expect(side(goals, villa, brighton, none, [], new Map(), nobodyHurt).goals).toEqual([]);
  });

  it("falls back to FPL's scorers only when the Premier League filed no goals for the match", () => {
    const minutes = new Map([[1, [55]]]);
    expect(side([], brighton, villa, minutes, [], new Map(), nobodyHurt).goals.map((g) => [g.scorer, g.minute])).toEqual([[1, 55]]);
    // A side that did not score in a filed match is not an unfiled match.
    expect(side([goal(1)], villa, brighton, minutes, [], new Map(), nobodyHurt).goals).toEqual([]);
  });

  it("keeps a scorer who went off injured as a row of his own", () => {
    // Mitchell scored twice for Palace and was carried off at 74'.
    const hurt = new Map([[1, 74]]);
    expect(side([goal(1)], brighton, villa, none, [], new Map(), hurt).rest.map((r) => r.player.code)).toEqual([1]);
    expect(side([goal(1)], brighton, villa, none, [], new Map(), nobodyHurt).rest).toEqual([]);
  });

  it("names a man for a red card or a missed penalty, never for a booking", () => {
    const rows = [row(3, { yellowCards: 1 }), row(4, { redCards: 1 }), row(5, { penaltiesMissed: 1 })];
    expect(side([goal(99)], rows, villa, none, [], new Map(), nobodyHurt).rest.map((r) => r.player.code).sort()).toEqual([4, 5]);
  });
});
