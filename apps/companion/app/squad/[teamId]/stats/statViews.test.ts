import { describe, expect, it } from "vitest";
import type { PlayerStatLine } from "@epl/core";
import { measuresFor, readingOf } from "./statViews";

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
const realGross = line({ G: 3, AT: 4, YC: 2, RC: 0, Pen: 0, DFP: 10, DFP3: 24, PKM: 0, OG: 0, GAO: 5, CS: 3 });
const rehearsalGross = line({ G: 3, A: 3, AF: 1, YC: 2, RC: 0, DFP: 10, PKM: 0, OG: 0, GAO: 5, CS: 3 });
const realKeys = new Set([...Object.keys(realGross.stats), "GA", "PKS", "GKP"]);
const rehearsalKeys = new Set([...Object.keys(rehearsalGross.stats), "GA", "PKS", "Sv"]);

describe("the squad board's total", () => {
  it("counts the real league's assists, so one man totals the same in both leagues", () => {
    expect(readingOf(realGross, undefined, "pts")).toBe(17);
    expect(readingOf(rehearsalGross, undefined, "pts")).toBe(17);
  });

  it("counts a keeper's GKP in the real league", () => {
    expect(readingOf(line({ CS: 3, GA: 4, GKP: 30, YC: 1, PKS: 1 }), undefined, "pts")).toBe(39);
  });

  it("never adds A and AF to the AT they make up, in a league that scores all three", () => {
    expect(readingOf(line({ G: 3, A: 3, AF: 1, AT: 4 }), undefined, "pts")).toBe(7);
  });
});

describe("the squad board's columns", () => {
  const heads = (scored: ReadonlySet<string>) => measuresFor("fantasy", scored).map((measure) => measure.head);

  it("draws the real league's AT and GKP, and not the A, AF and Sv it no longer scores", () => {
    expect(heads(realKeys)).toEqual(["G", "AT", "PKM", "CS", "GKP", "PKS", "GA", "YC", "RC", "OG", "Pts"]);
  });

  it("draws the rehearsal league's columns as it always has", () => {
    expect(heads(rehearsalKeys)).toEqual(["G", "A", "AF", "PKM", "CS", "Sv", "PKS", "GA", "YC", "RC", "OG", "Pts"]);
  });

  it("reads the AT column off the line", () => {
    expect(readingOf(realGross, undefined, "AT")).toBe(4);
  });
});
