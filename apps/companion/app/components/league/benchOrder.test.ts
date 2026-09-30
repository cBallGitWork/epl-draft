import { describe, expect, it } from "vitest";
import { benchFrom, orderBench, swapInOrder } from "./benchOrder";

describe("benchFrom", () => {
  it("takes Fantrax's ranks first, then anyone unranked in the order the bench stands", () => {
    expect(benchFrom({ dia: 1, wie: 2, gone: 3 }, ["sch", "wie", "bra", "dia"])).toEqual(["dia", "wie", "sch", "bra"]);
  });

  it("keeps the bench as it stands when Fantrax holds no order", () => {
    expect(benchFrom({}, ["sch", "wie"])).toEqual(["sch", "wie"]);
  });

  it("ignores a rank of nought, which Fantrax uses for a man taken out of the order", () => {
    expect(benchFrom({ wie: 0, dia: 1 }, ["wie", "dia"])).toEqual(["dia", "wie"]);
  });
});

describe("orderBench", () => {
  it("follows the order, drops who has left the bench and appends who has joined it", () => {
    expect(orderBench(["b", "a", "gone"], ["a", "b", "new"])).toEqual(["b", "a", "new"]);
  });
});

describe("swapInOrder", () => {
  it("swaps two men's places", () => {
    expect(swapInOrder(["a", "b", "c"], "a", "c")).toEqual(["c", "b", "a"]);
  });

  it("leaves the order alone when either is not in it", () => {
    expect(swapInOrder(["a", "b"], "a", "z")).toEqual(["a", "b"]);
  });
});
