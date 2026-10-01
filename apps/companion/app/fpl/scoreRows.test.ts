import { describe, expect, it } from "vitest";
import type { FplPick, FplScoreLine } from "@epl/core";
import { minutesOf, scoreRows } from "./scoreRows";

const pick = (multiplier: number, lines: FplScoreLine[]): FplPick => {
  const scored = lines.reduce((sum, line) => sum + line.points, 0);
  return {
    code: 1, slot: 1, line: 4, multiplier, isCaptain: multiplier > 1, isViceCaptain: false,
    points: scored * multiplier, scored, lines,
  };
};

const HAALAND = [
  { identifier: "minutes", value: 90, points: 2 },
  { identifier: "goals_scored", value: 1, points: 4 },
];

describe("scoreRows", () => {
  it("names each line in FPL's words, with what he did and what it paid", () => {
    expect(scoreRows(pick(1, HAALAND)).map((row) => [row.name, row.value, row.points])).toEqual([
      ["Minutes played", "90", 2],
      ["Goals scored", "1", 4],
    ]);
  });

  it("adds the armband's share, so the rows sum to what a captain contributed", () => {
    const captain = pick(2, HAALAND);
    const rows = scoreRows(captain);
    expect(rows.at(-1)).toMatchObject({ name: "Captain", value: "×2", points: 6 });
    expect(rows.reduce((sum, row) => sum + row.points, 0)).toBe(captain.points);
  });

  it("gives a benched man his own lines and no armband row", () => {
    const rows = scoreRows(pick(0, HAALAND));
    expect(rows.map((row) => row.name)).toEqual(["Minutes played", "Goals scored"]);
  });

  it("has no rows for a man who never got on, and no armband on nothing", () => {
    expect(scoreRows(pick(2, [{ identifier: "minutes", value: 0, points: 0 }]))).toEqual([]);
  });
});

describe("minutesOf", () => {
  it("reads his minutes line, and nought when FPL sent none", () => {
    expect(minutesOf(pick(1, HAALAND))).toBe(90);
    expect(minutesOf(pick(1, []))).toBe(0);
  });
});
