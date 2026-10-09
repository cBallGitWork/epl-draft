import { describe, expect, it } from "vitest";
import { SPURS, VILLA, fixture, spursVilla } from "./__fixtures__/spursVilla";
import { reportsCargo } from "./cargo";
import { deskDay } from "./desk";
import { surname } from "./keyStats";

describe("surname", () => {
  it("keeps a particle whatever its case", () => {
    expect(["Enzo Le Fée", "Maxim De Cuyper", "Jan Paul van Hecke", "Sávio"].map(surname)).toEqual(["Le Fée", "De Cuyper", "van Hecke", "Sávio"]);
  });
});

describe("keyStats", () => {
  it("sets Chances created as Most shots is set: the man, the count, then the bracket", () => {
    const desks = deskDay({ day: "2026-09-19", gameweek: 5, matches: [spursVilla()], season: [fixture], clubs: [SPURS, VILLA] });
    const [report] = reportsCargo(desks, { headline: "h", headlines: [], matches: new Map() });
    expect(report.keyStats.find((k) => k.label === "Chances created")?.value).toBe("Sávio 4, Robertson 4 (1 assist)");
  });
});
