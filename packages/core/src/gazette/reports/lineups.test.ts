import { describe, expect, it } from "vitest";
import { moments, sheets, spursVilla } from "./__fixtures__/spursVilla";
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

describe("lineupOf with marks", () => {
  const men = spursVilla().men;
  const code = (name: string) => men.find((m) => m.name.endsWith(name))!.code;
  const spurs = lineupOf(sheets.home, moments, new Map([[code("Kinsky"), 5.2], [code("Gray"), 6.1]]));

  it("puts each man's mark against him and his replacement, and — where he had none", () => {
    expect(spurs.lines[0][0].mark).toBe(5.2);
    expect(spurs.lines[1].find((m) => m.name === "Porro")).toMatchObject({ mark: null, replacedBy: { name: "Gray", mark: 6.1 } });
  });

  it("leaves marks out altogether when none were read", () => {
    expect("mark" in lineupOf(sheets.home, moments).lines[0][0]).toBe(false);
  });
});
