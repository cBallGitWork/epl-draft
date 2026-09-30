import { describe, expect, it } from "vitest";
import { moments, sheets } from "./__fixtures__/spursVilla";
import { lineupOf } from "./lineups";

describe("lineupOf on Tottenham 2-3 Aston Villa", () => {
  const spurs = lineupOf(sheets.home, moments);
  const villa = lineupOf(sheets.away, moments);

  it("prints the shape keeper first, as the sheet draws it", () => {
    expect(spurs.formation).toBe("4-2-3-1");
    expect(spurs.lines.map((line) => line.length)).toEqual([1, 4, 2, 3, 1]);
    expect(spurs.lines[0][0].name).toBe("Kinsky");
  });

  it("puts each change against the man replaced, with the minute", () => {
    const porro = spurs.lines[1].find((m) => m.name === "Porro");
    expect(porro?.replacedBy).toEqual({ name: "Gray", minute: "19", booked: false });
    const jackson = villa.lines.flat().find((m) => m.name === "Jackson");
    expect(jackson).toMatchObject({ booked: true, replacedBy: { name: "Abraham", minute: "88" } });
  });

  it("marks a booking on the man who came on, and lists the substitutes not used", () => {
    const wanBissaka = villa.lines.flat().find((m) => m.name === "Wan-Bissaka");
    expect(wanBissaka?.replacedBy).toEqual({ name: "Cash", minute: "46", booked: true });
    expect(spurs.unused.length).toBeGreaterThan(0);
    expect(spurs.unused).not.toContain("Gray");
  });
});
