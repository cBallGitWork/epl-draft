import { describe, expect, it } from "vitest";
import type { LeagueProjection } from "@epl/core";
import type { PoolRow } from "../pool";
import { knownMen, projectionCategory, projectionRows, projectionSort, sortedProjections, type Known } from "./rows";

function week(gw: number, points: number, minutes = 80) {
  const parts = { goals: points / 2, assists: 1, cleanSheets: 0, appearance: 2, conceded: 0, defcon: 0, keeper: 0 };
  return { gw, points, minutes, parts };
}

const man = (code: number, club: string, gameweeks: LeagueProjection["gameweeks"]): LeagueProjection => ({ code, fantraxId: String(code), club, slot: "M", gameweeks });
const HAALAND = man(1, "MCI", [week(6, 6), week(7, 7.5, 90), week(9, 5)]);
const SAKA = man(2, "ARS", [week(6, 5), week(7, 5), week(8, 6)]);
const GHOST = man(3, "HUL", [week(6, 9)]);

const known = (name: string): Known => ({ name, fullName: name, fantraxId: null, positions: [], ownerTeamId: null, status: "" });
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
    expect(projectionCategory("bonus")).toBe("points");
    expect(projectionCategory("defcon")).toBe("defcon");
  });
});

describe("knownMen", () => {
  const pooled = (code: number, displayName: string, ownerTeamId: string | null, status: string) =>
    ({ fplCode: code, stats: null, entry: { player: { fantraxId: `f${code}`, displayName }, eligiblePositions: ["F"], ownerTeamId, status } }) as unknown as PoolRow;
  const men = knownMen(
    [{ code: 1, name: "Haaland" }, { code: 2, name: "Saka" }, { code: 3, name: "Ghost" }],
    [pooled(1, "Erling Haaland", "l5kunst8msgbirdf", "T"), pooled(2, "Bukayo Saka", null, "FA")],
  );

  // Craig, 6 Oct 2026: "this section needs the manager name in the row too".
  it("carries who holds each man the pool has, and his status where nobody does", () => {
    expect(men.get(1)).toMatchObject({ fullName: "Erling Haaland", fantraxId: "f1", positions: ["F"], ownerTeamId: "l5kunst8msgbirdf" });
    expect(men.get(2)).toMatchObject({ ownerTeamId: null, status: "FA" });
  });

  it("names a man the pool lacks by FPL's name, held by nobody", () => {
    expect(men.get(3)).toEqual({ name: "Ghost", fullName: "Ghost", fantraxId: null, positions: [], ownerTeamId: null, status: "" });
  });
});
