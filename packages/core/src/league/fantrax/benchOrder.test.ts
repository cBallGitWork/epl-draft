import { describe, expect, it } from "vitest";
import { benchByPoints, mapBenchOrder, type RawTeamRosterInfo } from "./benchOrder";

// The rehearsal league's roster page shape: a keeper table then an outfield table, each with an FPts column,
// and empty slots scorerless.
const header = { cells: [{ key: "opponent" }, { key: "fpts" }] };
const row = (id: string, status: string, fpts: string) => ({ statusId: status, scorer: { scorerId: id }, cells: [{ content: "EVE" }, { content: fpts }] });
const raw = (order: Record<string, number> = {}): RawTeamRosterInfo => ({
  miscData: { autoSubsOrderingType: "USER", autoSubOrderMap: order },
  tables: [
    { header, rows: [row("gk1", "1", "40"), row("gk2", "2", "12"), { statusId: "2" }] },
    { header, rows: [row("d1", "1", "50"), row("d2", "2", "31"), row("m2", "2", "8"), row("f2", "2", "31")] },
  ],
});

describe("mapBenchOrder", () => {
  it("orders an unnumbered bench by total fantasy points, as the deadline does, ties in the page's order", () => {
    expect(mapBenchOrder(raw())).toEqual({ order: ["d2", "f2", "gk2", "m2"], by: "points" });
  });

  it("follows the manager's numbers when he set them, and leaves out a reserve he did not number", () => {
    expect(mapBenchOrder(raw({ m2: 1, d2: 2, ghost: 3 }))).toEqual({ order: ["m2", "d2"], by: "manager" });
  });

  it("reads a nought as unnumbered, as the save writes it for a man taken off the bench", () => {
    expect(mapBenchOrder(raw({ m2: 1, d2: 2, f2: 0 }))).toEqual({ order: ["m2", "d2"], by: "manager" });
    expect(mapBenchOrder(raw({ f2: 0 }))).toEqual({ order: ["d2", "f2", "gk2", "m2"], by: "points" });
  });
});

describe("benchByPoints", () => {
  it("orders by total points whatever the manager numbered", () => {
    expect(benchByPoints(raw({ m2: 1 }))).toEqual(["d2", "f2", "gk2", "m2"]);
  });

  it("puts a reserve with no points reading after every man with one, a negative total included", () => {
    const bench = (fpts: string | undefined) => ({
      tables: [{ header, rows: [row("neg", "2", "-2"), { statusId: "2", scorer: { scorerId: "none" }, cells: [{ content: "EVE" }, ...(fpts === undefined ? [] : [{ content: fpts }])] }, row("zero", "2", "0")] }],
    });
    expect(benchByPoints(bench(undefined))).toEqual(["zero", "neg", "none"]);
    expect(benchByPoints(bench(""))).toEqual(["zero", "neg", "none"]);
    expect(benchByPoints(bench("-"))).toEqual(["zero", "neg", "none"]);
  });
});
