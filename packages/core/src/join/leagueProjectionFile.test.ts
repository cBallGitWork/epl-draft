import { describe, expect, it } from "vitest";
import { leagueProjectionIntel, type LeagueProjectionFile, type LeagueProjectionRow, type SlotPricing } from "./leagueProjectionFile";

const parts = { goals: 1, assists: 0, cleanSheets: 0, appearance: 2, conceded: 0, defcon: 0.5, keeper: 0 };
const slot = (perGw: (number | null)[]): SlotPricing => ({
  total: 0,
  perGw,
  perMatch: null,
  parts,
  partsPerGw: { ...Object.fromEntries(Object.keys(parts).map((part) => [part, perGw.map(() => 0)])), goals: [1, null] } as SlotPricing["partsPerGw"],
  rates: { defcon: 0.5, keeper: 0 },
});
const row = (over: Partial<LeagueProjectionRow>): LeagueProjectionRow =>
  ({ fantraxId: "04y92", fplCode: 223340, club: "ARS", fplClub: "ARS", pricedAt: "M", minutesPerGw: [80, null], positions: { F: slot([3, null]), M: slot([4, null]) }, ...over }) as LeagueProjectionRow;
const file = (players: LeagueProjectionRow[]) => ({ gameweeks: [6, 7], players }) as unknown as LeagueProjectionFile;

describe("leagueProjectionIntel", () => {
  it("reads each man at the slot that pays him most, a week with no reading as null", () => {
    const saka = leagueProjectionIntel(file([row({})])).get(223340);
    expect(saka).toMatchObject({ fantraxId: "04y92", club: "ARS", slot: "M" });
    expect(saka?.gameweeks).toEqual([
      { gw: 6, points: 4, minutes: 80, parts: { goals: 1, assists: 0, cleanSheets: 0, appearance: 0, conceded: 0, defcon: 0, keeper: 0 } },
      { gw: 7, points: null, minutes: null, parts: { goals: null, assists: 0, cleanSheets: 0, appearance: 0, conceded: 0, defcon: 0, keeper: 0 } },
    ]);
  });

  it("drops a row with no code or no pricing at its own slot, and an absent file", () => {
    expect(leagueProjectionIntel(file([row({ fplCode: undefined }), row({ pricedAt: "D" })])).size).toBe(0);
    expect(leagueProjectionIntel(null).size).toBe(0);
  });
});
