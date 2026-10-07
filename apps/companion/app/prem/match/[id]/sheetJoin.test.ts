import { describe, expect, it } from "vitest";
import type { FootballPlayer, MatchSheetLine, PlManMatch, PlSquadMan, PlayerMatchStats } from "@epl/core";
import { appeared, cameOn, forCode, joinOf, ordered } from "./sheetJoin";

const man = (code: number, position: string | null): PlSquadMan => ({
  code,
  name: `man${code}`,
  shirt: null,
  position,
  captain: false,
});

const sheet = {
  teamId: 1,
  lineup: [man(9, "F"), man(1, "G"), man(4, "D"), man(8, "M")],
  substitutes: [man(19, "M"), man(13, "G"), man(99, null)],
  formation: "4-3-3",
  shape: null,
};

describe("ordered", () => {
  it("runs the eleven keeper to attack, then the bench keeper to attack", () => {
    // A position it does not know sorts to the FRONT of its half, to be looked at.
    const rows = ordered(sheet, new Map());
    expect(rows.map((row) => [row.man.code, row.bench])).toEqual([
      [1, false], [4, false], [8, false], [9, false],
      [99, true], [13, true], [19, true],
    ]);
  });

  it("carries each man's events, and nothing for a man nothing happened to", () => {
    const came: PlManMatch = { onAt: 70, offAt: null, booked: null, sentOff: null, goals: [], assists: [], ownGoals: [] };
    const rows = ordered(sheet, new Map([[19, came]]));
    expect(rows.find((row) => row.man.code === 19)?.did).toBe(came);
    expect(rows.find((row) => row.man.code === 1)?.did).toBeUndefined();
  });
});

describe("joinOf", () => {
  const match = {
    sheet: { fixtureId: 5, lines: [{ playerId: 70 } as MatchSheetLine] },
    byCode: new Map([[7, { id: 70 } as FootballPlayer]]),
    figures: new Map([[70, { fplPoints: 9 } as PlayerMatchStats]]),
  };

  it("finds FPL's line and points for a man by his code", () => {
    const join = joinOf(match);
    expect(join.line(7)?.playerId).toBe(70);
    expect(join.points(7)).toBe(9);
  });

  it("gives no line and nought points for a man FPL does not know", () => {
    const join = joinOf(match);
    expect(join.line(8)).toBeUndefined();
    expect(join.points(null)).toBe(0);
  });
});

describe("appeared", () => {
  const on = { onAt: 64 } as PlManMatch;

  it("counts the eleven and the men who came on, and not the men who sat", () => {
    expect(appeared({ man: man(1, "G"), did: undefined, bench: false })).toBe(true);
    expect(appeared({ man: man(19, "M"), did: on, bench: true })).toBe(true);
    expect(appeared({ man: man(13, "G"), did: undefined, bench: true })).toBe(false);
  });

  it("reads coming on off the minute, not off the bench flag", () => {
    expect(cameOn({ man: man(19, "M"), did: on, bench: true })).toBe(true);
    expect(cameOn({ man: man(9, "F"), did: { offAt: 70 } as PlManMatch, bench: false })).toBe(false);
  });
});

describe("forCode", () => {
  it("looks a man up by his code, and finds nothing for a man with none", () => {
    const owners = new Map([[7, "Raccoons"]]);
    expect(forCode(owners, 7)).toBe("Raccoons");
    expect(forCode(owners, 8)).toBeUndefined();
    expect(forCode(owners, null)).toBeUndefined();
  });
});
