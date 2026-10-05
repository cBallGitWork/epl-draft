import { describe, expect, it } from "vitest";
import type { ProjectedPlayer } from "../../football/intel/projections";
import type { LeagueProjectionRow, SlotPricing } from "../../join/leagueProjectionFile";
import { seasonMan } from "./men";

const pricing = (perGw: (number | null)[]) => ({ total: 0, perGw, perMatch: null }) as unknown as SlotPricing;
const row = {
  fantraxId: "f1",
  fplCode: 101,
  name: "Saka",
  eligible: ["F", "M"],
  positions: { F: pricing([4, 6, null]), M: pricing([5, 7, 3]) },
} as unknown as LeagueProjectionRow;
const band = {
  code: 101,
  gameweeks: [
    { gw: 6, points: 5, low: 2, high: 8.29 },
    { gw: 7, points: 4, low: 1, high: 6.632 },
    { gw: 8, points: 0, low: 0, high: 0 },
  ],
} as unknown as ProjectedPlayer;

describe("seasonMan", () => {
  it("prices each period at every slot he may fill, a blank reading as nought", () => {
    const man = seasonMan(row, band, [6, 7, 8], new Map([[6, [6]], [7, [7, 8]]]), 1.645);
    expect(man.periods.get(6)).toEqual({ F: 4, M: 5 });
    expect(man.periods.get(7)).toEqual({ F: 6, M: 10 });
    expect(man.season).toBe(15);
  });

  it("carries his average gameweek past the window", () => {
    const man = seasonMan(row, band, [6, 7, 8], new Map([[20, [20]]]), 1.645);
    expect(man.periods.get(20)).toEqual({ F: 5, M: 5 });
  });

  it("reads his spread off the band's upper half, in deviations of his mean", () => {
    const man = seasonMan(row, band, [6, 7, 8], new Map([[6, [6]]]), 1.645);
    expect(man.spread).toBeCloseTo(0.4, 3);
    expect(seasonMan(row, undefined, [6], new Map([[6, [6]]]), 1.645).spread).toBe(0);
  });
});
