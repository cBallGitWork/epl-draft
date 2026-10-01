import { describe, expect, it } from "vitest";
import type { FootballPlayer, LineupDetail, SquadPlayerDetail } from "@epl/core";
import { boardCategories, figureOf, paidIn, sideColumns, sideRows, type ManCounts } from "./sideRows";

const man = (fantraxId: string, points: number | null): SquadPlayerDetail => ({
  rostered: { slot: { fantraxId, position: "M", status: "" }, player: { code: 1, name: fantraxId } as FootballPlayer, stats: [] },
  club: undefined,
  opposition: [],
  points,
});

const counts = { a: { Min: "90", G: "1" }, b: { Min: "90", G: "0" }, c: { Min: "20" } };

describe("sideColumns", () => {
  it("follows an outfielder's rows, adds a keeper's own after, and drops what the league does not name", () => {
    const categories = {
      x: { code: "G", name: "Goals", longCode: null },
      y: { code: "Sv", name: "Saves", longCode: null },
      z: { code: "Min", name: "Minutes Played", longCode: null },
    };
    const men: ManCounts[] = [
      { keeper: true, counts: { Min: "90", Sv: "3" } },
      { keeper: false, counts: { Min: "90", G: "1", XX: "4" } },
    ];
    expect(sideColumns(categories, men).map((c) => c.code)).toEqual(["Min", "G", "Sv"]);
  });

  it("prints the real league's own categories, DefCon and keeper points among them, and not its minutes", () => {
    // The real league's categories as its getLeagueInfo named them on 1 Oct 2026.
    const real = boardCategories({
      "5020#6120": { code: "Min", name: "Minutes Played", longCode: "INDIVIDUAL_MINUTES_PLAYED" },
      "5020#6689": { code: "GKP", name: "Keeper Points", longCode: "INDIVIDUAL_KEEPER_POINTS" },
      "5010#6090": { code: "G", name: "Goals", longCode: "INDIVIDUAL_GOALS" },
      "5010#6362": { code: "AT", name: "Assists (Total)", longCode: "INDIVIDUAL_ASSISTS_TOTAL" },
      "5010#6696": { code: "DFP", name: "Defensive Points", longCode: "INDIVIDUAL_DEFENSIVE_POINTS" },
      "5010#6700": { code: "DFP3", name: "Defensive Points 3", longCode: "INDIVIDUAL_DEFENSIVE_POINTS_3" },
    });
    const men: ManCounts[] = [
      { keeper: true, counts: { Min: "90", GKP: "4" } },
      { keeper: false, counts: { Min: "90", G: "1", AT: "0", DFP: "5", DFP3: "7" } },
    ];
    expect(sideColumns(real, men).map((c) => c.code)).toEqual(["G", "AT", "DFP", "DFP3", "GKP"]);
  });
});

describe("boardCategories", () => {
  it("leaves out minutes played by what the category is, whatever its short code", () => {
    const categories = {
      "5010#6120": { code: "Mins", name: "Minutes Played", longCode: "INDIVIDUAL_MINUTES_PLAYED" },
      "5010#6090": { code: "G", name: "Goals", longCode: "INDIVIDUAL_GOALS" },
    };
    expect(Object.values(boardCategories(categories)).map((c) => c.code)).toEqual(["G"]);
  });
});

describe("figureOf", () => {
  it("reads Fantrax's total under Pts and a stated count elsewhere, a nought included", () => {
    expect(figureOf(man("a", 7), "Pts", counts)).toBe(7);
    expect(figureOf(man("b", 2), "G", counts)).toBe(0);
  });

  it("says nothing where there is no reading", () => {
    expect(figureOf(man("c", 1), "G", counts)).toBeNull();
    expect(figureOf(man("d", null), "Pts", counts)).toBeNull();
  });
});

describe("sideRows", () => {
  const sheet: LineupDetail = {
    rows: [{ position: "M", players: [man("a", 7), man("b", 2), man("d", null)] }],
    bench: [man("c", 1)],
  } as unknown as LineupDetail;

  it("orders the eleven by the column and keeps the bench apart", () => {
    const { eleven, bench } = sideRows(sheet, counts, { head: "Pts", descending: true });
    expect(eleven.map((p) => p.rostered.slot.fantraxId)).toEqual(["a", "b", "d"]);
    expect(bench.map((p) => p.rostered.slot.fantraxId)).toEqual(["c"]);
  });

  it("sinks a man with no reading whichever way the column runs", () => {
    const { eleven } = sideRows(sheet, counts, { head: "Pts", descending: false });
    expect(eleven.map((p) => p.rostered.slot.fantraxId)).toEqual(["b", "a", "d"]);
  });
});

describe("paidIn", () => {
  const line = (code: string, points: number) => ({ code, name: code, definition: null, points, value: "1" });
  const paid = { a: [line("G", 4), line("YC", -1)] };

  it("reads what Fantrax paid him in a column, a deduction signed, and his total under Pts", () => {
    expect(paidIn(paid, man("a", 3), "G")).toBe(4);
    expect(paidIn(paid, man("a", 3), "YC")).toBe(-1);
    expect(paidIn(paid, man("a", 3), "Pts")).toBe(3);
  });

  it("is nought for a count that earned nothing, and for a man Fantrax priced nowhere", () => {
    expect(paidIn(paid, man("a", 3), "GAO")).toBe(0);
    expect(paidIn(paid, man("z", null), "Pts")).toBe(0);
  });
});
