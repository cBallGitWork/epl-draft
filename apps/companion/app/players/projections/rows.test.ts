import { describe, expect, it } from "vitest";
import type { ProjectedPlayer } from "@epl/core";
import { projectionCategory, projectionRows, projectionSort, sortedProjections, type Known } from "./rows";

function week(gw: number, points: number, minutes = 80) {
  const parts = { goals: points / 2, assists: 1, cleanSheets: 0, bonus: 0, saves: 0, defcon: 0, appearance: 2 };
  return { gw, points, low: null, high: null, minutes, start: 0.9, fixtures: 1, parts };
}

const HAALAND: ProjectedPlayer = { code: 1, club: "MCI", role: "ST", gameweeks: [week(6, 6), week(7, 7.5, 90), week(9, 5)] };
const SAKA: ProjectedPlayer = { code: 2, club: "ARS", role: "RW", gameweeks: [week(6, 5), week(7, 5), week(8, 6)] };
const GHOST: ProjectedPlayer = { code: 3, club: "HUL", role: "CB", gameweeks: [week(6, 9)] };

const known = (name: string): Known => ({ name, fullName: name, fantraxId: null, positions: [] });
const KNOWN = new Map([
  [1, known("Haaland")],
  [2, known("Saka")],
]);
const PLAYERS = new Map([HAALAND, SAKA, GHOST].map((p) => [p.code, p]));

describe("projectionRows", () => {
  const rows = projectionRows(PLAYERS, [6, 7, 8], KNOWN);

  it("lays each man's points on the window, a missing week as a dash", () => {
    expect(rows.find((r) => r.name === "Haaland")?.weeks).toEqual([6, 7.5, null]);
  });

  it("totals the weeks he has and averages the minutes the model expects", () => {
    expect(rows.find((r) => r.name === "Haaland")).toMatchObject({ total: 13.5, minutes: 85 });
  });

  it("leaves out a man we cannot name", () => {
    expect(rows.map((r) => r.name)).not.toContain(undefined);
    expect(rows).toHaveLength(2);
  });
});

describe("sorting", () => {
  const rows = projectionRows(PLAYERS, [6, 7, 8], KNOWN);

  it("opens on the total, and falls back to it for a week the window has lost", () => {
    expect(projectionSort(undefined, [6, 7, 8])).toBe("tot");
    expect(projectionSort("gw11", [6, 7, 8])).toBe("tot");
    expect(projectionSort("gw8", [6, 7, 8])).toBe("gw8");
  });

  it("orders by a week, sinking a man with no reading for it", () => {
    expect(sortedProjections(rows, "gw8", [6, 7, 8], true).map((r) => r.name)).toEqual(["Saka", "Haaland"]);
    expect(sortedProjections(rows, "tot", [6, 7, 8], true).map((r) => r.name)).toEqual(["Saka", "Haaland"]);
  });
});

describe("a category", () => {
  it("shows one category's points in the weeks and the total", () => {
    const [haaland] = projectionRows(PLAYERS, [6, 7, 8], KNOWN, "goals");
    expect(haaland.weeks).toEqual([3, 3.75, null]);
    expect(haaland.total).toBe(6.75);
  });

  it("reads an unknown category as every point", () => {
    expect(projectionCategory("nope")).toBe("points");
    expect(projectionCategory("bonus")).toBe("bonus");
  });
});
