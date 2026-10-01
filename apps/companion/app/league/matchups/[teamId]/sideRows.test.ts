import { describe, expect, it } from "vitest";
import type { FootballPlayer, LineupDetail, SquadPlayerDetail } from "@epl/core";
import { figureOf, sideColumns, sideRows, type ManCounts } from "./sideRows";

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
