import { describe, expect, it } from "vitest";
import { SPURS, VILLA, fixture, spursVilla } from "./__fixtures__/spursVilla";
import { plainStandfirst, reportsCargo } from "./cargo";
import { normalizeReports } from "./cargoRead";
import { deskDay } from "./desk";

const places = new Map([[6, 18], [7, 9]]);
const desks = deskDay({ day: "2026-09-19", gameweek: 5, matches: [spursVilla()], season: [fixture], clubs: [SPURS, VILLA], standing: { attack: places, defence: places } });
const [report] = reportsCargo(desks, { headline: "h", headlines: [], matches: new Map() });

describe("reportsCargo", () => {
  it("builds the header as BBC Sport sets it: goals and assists by side, half-time, venue and attendance", () => {
    expect(report.home).toMatchObject({ code: 6, score: 2, goals: ["Gallagher 86", "van Hecke 90+8"], assists: ["Kudus 86", "Robertson 90+8"] });
    expect(report.away.goals).toEqual(["Manzambi 45+4", "Jackson 67", "Buendía 79"]);
    expect(report.away.assists).toEqual(["Kamara 45+4", "Manzambi 67", "McGinn 79"]);
    expect([report.halfTime, report.venue, report.attendance]).toEqual([{ home: 0, away: 1 }, "Tottenham Hotspur Stadium", 60920]);
  });

  it("carries both line-ups and the key stats with figures", () => {
    expect(report.home.lineup?.formation).toBe("4-2-3-1");
    expect(report.keyStats.map((k) => k.label)).toEqual(expect.arrayContaining(["Shots", "Most shots", "Chances created"]));
    expect(report.keyStats.find((k) => k.label === "Most shots")?.value).toBe("Jackson 6 (2 on target, 1 goal)");
  });

  it("prints the timeline in the paper's words, the injury marked on the change", () => {
    expect(report.rows[0]).toEqual({ minute: "19", kind: "Sub", side: "home", text: "Gray for Porro, injured" });
    expect(report.rows.find((r) => r.kind === "VAR")).toMatchObject({ minute: "60", text: "Kudus goal ruled out" });
    expect(report.rows.find((r) => r.minute === "45+4")).toMatchObject({ kind: "Goal", text: "Manzambi (Kamara)" });
  });

  it("falls back to the desk's plain standfirst when a match's piece failed twice", () => {
    expect(report.standfirst).toBe("Aston Villa won 3-2 at Tottenham Hotspur.");
    expect(report.sections).toEqual([]);
    expect(plainStandfirst(desks[0])).toBe(report.standfirst);
  });
});

describe("normalizeReports", () => {
  it("round-trips what the desk built", () => {
    expect(normalizeReports(JSON.parse(JSON.stringify([report])))).toEqual([report]);
  });

  it("refuses a match with one side, and a row of a kind it does not know", () => {
    expect(normalizeReports([{ ...report, away: null }])).toBeUndefined();
    const odd = normalizeReports([{ ...report, rows: [{ minute: "9", kind: "Tackle", side: "home", text: "x" }], video: "not a video id!" }]);
    expect(odd?.[0].rows).toEqual([]);
    expect(odd?.[0].video).toBeNull();
  });
});
