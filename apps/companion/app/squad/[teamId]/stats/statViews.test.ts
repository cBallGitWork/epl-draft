import { describe, expect, it } from "vitest";
import type { PlayerStatLine } from "@epl/core";
import { VIEWS, measuresFor, readingOf } from "./statViews";

const line = (stats: Record<string, number | null>): PlayerStatLine => ({
  fantraxId: "x",
  name: "Pascal Gross",
  club: null,
  clubShort: null,
  position: "M",
  ownerTeamId: null,
  defaultPosition: "M",
  points: null,
  stats,
});

// Pascal Gross's five gameweeks off getPlayerStats on 1 Oct 2026, in each league's own columns: AT is A plus AF.
const realGross = line({ GP: 5, Min: 450, G: 3, AT: 4, YC: 2, RC: 0, Pen: 0, DFP: 10, DFP3: 24, PKM: 0, OG: 0, GAO: 5, CS: 3 });
const rehearsalGross = line({ GP: 5, Min: 450, G: 3, A: 3, AF: 1, YC: 2, RC: 0, DFP: 10, DFP3: 24, PKM: 0, OG: 0, GAO: 5, CS: 3 });
const realKeys = new Set([...Object.keys(realGross.stats), "GA", "PKS", "GKP"]);
const rehearsalKeys = new Set([...Object.keys(rehearsalGross.stats), "GA", "PKS", "Sv"]);
// The stats league's columns for him, which carry everything and score nothing.
const statsGross = { GP: 5, GS: 5, Min: 450, G: 3, A: 3, AF: 1, AT: 4, S: 11, SOT: 4, KP: 14, BCC: 2, TkW: 6, Int: 3, CLR: 4, BR: 20, FC: 5, Sv: null };
const statsKeys = new Set([...Object.keys(statsGross), "GA", "PKS"]);
const views = VIEWS.map((view) => view.key);

describe("the squad board's total", () => {
  // The categories are raw counts, so a sum of them added goals conceded and cards as if they were points.
  it("draws no total in any view, and sorts by none", () => {
    for (const view of views) expect(measuresFor(view, realKeys, statsKeys, true).map((measure) => measure.key)).not.toContain("pts");
    expect(readingOf(realGross, { statsLeague: statsGross }, "pts")).toBeNull();
  });
});

describe("the squad board's sources", () => {
  // Craig, 1 Oct 2026: "dont use the term fpl", "remove bps".
  it("names no view for FPL and draws no BPS", () => {
    expect(VIEWS.map((view) => view.label).join(" ")).not.toMatch(/fpl/i);
    for (const view of views) expect(measuresFor(view, realKeys, statsKeys, true).map((measure) => measure.head)).not.toContain("BPS");
  });

  it("reads a count off the served league where its read has the column, and off the stats league where not", () => {
    expect(readingOf(realGross, { statsLeague: { ...statsGross, G: 99 } }, "G")).toBe(3);
    expect(readingOf(realGross, { statsLeague: statsGross }, "A")).toBe(3);
    expect(readingOf(realGross, { statsLeague: statsGross }, "KP")).toBe(14);
  });

  it("dashes a stats-league column for a man the stats league has no row for", () => {
    expect(readingOf(realGross, {}, "KP")).toBeNull();
    expect(readingOf(realGross, {}, "G")).toBe(3);
  });
});

describe("the squad board's columns", () => {
  const heads = (view: (typeof views)[number], served: ReadonlySet<string>, stats: ReadonlySet<string> = statsKeys, priced = false) =>
    measuresFor(view, served, stats, priced).map((measure) => measure.head);

  it("scores the real league's minutes, AT, DefCon and GKP, and not the A, AF and Sv it no longer scores", () => {
    expect(heads("scoring", realKeys)).toEqual(["Min", "G", "AT", "PKM", "CS", "DC", "DC+", "GKP", "PKS", "GA", "YC", "RC", "OG"]);
    // Headed DC and DC+, still read by Fantrax's codes.
    expect([readingOf(realGross, {}, "DFP"), readingOf(realGross, {}, "DFP3")]).toEqual([10, 24]);
  });

  it("scores the rehearsal league's columns", () => {
    expect(heads("scoring", rehearsalKeys)).toEqual(["Min", "G", "A", "AF", "PKM", "CS", "DC", "DC+", "Sv", "PKS", "GA", "YC", "RC", "OG"]);
  });

  it("puts the stats league's counts beneath each group, and never in Scoring", () => {
    // Headed as League › Team Stats and a player's Data page head them, never Fantrax's S, SOT and CLR.
    expect(heads("attacking", realKeys)).toEqual(["G", "AT", "A", "AF", "PKM", "Sh", "SoT", "KP", "BCC"]);
    expect(heads("defensive", realKeys)).toEqual(["CS", "DC", "DC+", "Sv", "GKP", "PKS", "GA", "OG", "TkW", "Int", "Clr", "BR"]);
    expect(heads("discipline", realKeys)).toEqual(["YC", "RC", "FC"]);
    expect(heads("appearances", realKeys)).toEqual(["Min", "GP", "GS"]);
  });

  it("keeps the served league's own columns when the stats league did not answer", () => {
    expect(heads("attacking", realKeys, new Set())).toEqual(["G", "AT", "PKM"]);
    expect(heads("appearances", realKeys, new Set())).toEqual(["Min", "GP"]);
  });
});

describe("the squad board's key", () => {
  // Plain football words, never Fantrax's "Assists (Total)" nor "Ours, not Fantrax's".
  it("says each of the real league's columns in plain words", () => {
    const keys = measuresFor("scoring", realKeys, statsKeys, true).map((measure) => measure.label);
    expect(keys.filter((key) => /\((total|fantasy|official)\)|not fantrax/i.test(key) || /Points/.test(key))).toEqual([]);
    expect(keys).toContain("Assists, official and extra");
    expect(keys).toContain("Keeper actions: saves, smothers, punches and high claims won");
  });
});

describe("the squad board's DefCon points", () => {
  // Craig, 1 Oct 2026: "scoring missing our defcon stats".
  it("draws ours after the DefCon counts in Scoring when the league prices DefCon, and nowhere else", () => {
    expect(measuresFor("scoring", realKeys, statsKeys, true).map((measure) => measure.head)).toEqual(
      ["Min", "G", "AT", "PKM", "CS", "DC", "DC+", "DCP", "GKP", "PKS", "GA", "YC", "RC", "OG"],
    );
    expect(measuresFor("scoring", realKeys, statsKeys, false).map((measure) => measure.head)).not.toContain("DCP");
    expect(measuresFor("defensive", realKeys, statsKeys, true).map((measure) => measure.head)).not.toContain("DCP");
  });

  it("reads our figure, inks it as ours, keys it in plain words, and never heads it FPts", () => {
    const ours = measuresFor("scoring", realKeys, statsKeys, true).find((measure) => measure.key === "DCP");
    expect(ours?.derived).toBe(true);
    expect(ours?.head).not.toBe("FPts");
    expect(ours?.label).toBe("DefCon points, worked out per match");
    expect(readingOf(realGross, { defcon: 3 }, "DCP")).toBe(3);
    expect(readingOf(realGross, {}, "DCP")).toBeNull();
  });
});
