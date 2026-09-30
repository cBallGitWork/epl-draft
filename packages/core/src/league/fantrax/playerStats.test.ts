import { describe, expect, it } from "vitest";
import pool from "./__fixtures__/poolWindow.json";
import sheet from "./__fixtures__/statsWindow.json";
import { mapPlayerStats } from "./playerStats";

// Two date-window reads, 18 Sep to 8 Oct 2026: the rehearsal league's free agents with its points, and the
// stats league's outfield sheet with every category it tracks.

describe("mapPlayerStats over a date window", () => {
  const men = new Map(mapPlayerStats(pool).map((man) => [man.name, man]));

  it("reads Fantrax's points for the window", () => {
    expect(men.get("Jay da Silva")?.points).toBe(12);
    expect(men.get("Johan Manzambi")?.points).toBe(11);
  });

  it("reads the position his points are priced at, not the first letter he is listed under", () => {
    expect(men.get("Jaidon Anthony")?.position).toBe("M,F");
    expect(men.get("Jaidon Anthony")?.defaultPosition).toBe("F");
    expect(men.get("Walter Benítez")?.defaultPosition).toBe("G");
  });

  it("names nobody as owner of a free agent", () => {
    expect([...men.values()].every((man) => man.ownerTeamId === null)).toBe(true);
  });

  it("reads the stats league's shots and chances for the same window", () => {
    const jackson = mapPlayerStats(sheet).find((man) => man.name === "Nicolas Jackson");
    expect(jackson?.stats.S).toBe(6);
    expect(jackson?.stats.SOT).toBe(2);
    expect(jackson?.stats.KP).toBe(1);
  });
});
