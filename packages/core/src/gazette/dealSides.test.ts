import { describe, expect, it } from "vitest";
import type { Deal, DealSide } from "./types";
import { kindOf, movement } from "./dealSides";

const side = (playerName: string, teamId: string | null): DealSide => ({
  playerName,
  teamId,
  position: "M",
  club: "ARS",
});

const deal = (over: Partial<Deal>): Deal => ({
  setId: "s1",
  kind: "claim",
  inbound: [],
  outbound: [],
  processedAt: "Wed Aug 12, 2026, 9:14AM",
  period: 1,
  ...over,
});

describe("movement", () => {
  it("reads a two-way swap from this manager's side", () => {
    // `deals()` files each half under the team that GAINED that player, so A's
    // loss is B's inbound row. Filtering outbound to A alone finds nothing.
    const swap = deal({
      kind: "trade",
      inbound: [side("P1", "A"), side("P2", "B")],
    });
    const m = movement(swap, "A");
    expect(m.in.map((s) => s.playerName)).toEqual(["P1"]);
    expect(m.out.map((s) => s.playerName)).toEqual(["P2"]);
    expect(m.partners).toEqual(["B"]);
  });

  it("names every partner in a three-way trade, not just the first", () => {
    // THE BUG. `inbound.find(theirs)` named one team on a deal with two, so A's
    // row attributed both B's and C's gains to B alone.
    const three = deal({
      kind: "trade",
      inbound: [side("P1", "A"), side("P2", "B"), side("P3", "C")],
    });
    expect(movement(three, "A").partners).toEqual(["B", "C"]);
  });

  it("has no partner on a claim off the pool", () => {
    expect(movement(deal({ inbound: [side("P1", "A")] }), "A").partners).toEqual([]);
  });

  it("counts a manager appearing twice as one partner", () => {
    const two = deal({
      kind: "trade",
      inbound: [side("P1", "A"), side("P2", "B"), side("P3", "B")],
    });
    expect(movement(two, "A").partners).toEqual(["B"]);
  });
});

describe("kindOf", () => {
  it("calls a claim with a drop beside it a Waiver", () => {
    expect(kindOf(deal({ kind: "claim" }), 1, 1)).toBe("Waiver");
  });

  it("calls a claim that cost nobody a Bin Pick Up", () => {
    expect(kindOf(deal({ kind: "claim" }), 1, 0)).toBe("Bin Pick Up");
  });

  it("calls a bare drop To The Bin", () => {
    // THE BUG. `deals()` maps a drop to kind "claim" and files it outbound, so
    // this read as a waiver claim that claimed nobody — an em dash in the In
    // column under the word Waiver.
    expect(kindOf(deal({ kind: "claim" }), 0, 1)).toBe("To The Bin");
  });

  it("names a trade a trade whichever way the rows fell", () => {
    expect(kindOf(deal({ kind: "trade" }), 1, 1)).toBe("Trade");
    expect(kindOf(deal({ kind: "trade" }), 1, 0)).toBe("Trade");
  });

  it("keeps Fantrax's other kinds distinguishable", () => {
    expect(kindOf(deal({ kind: "lineup" }), 0, 0)).toBe("Lineup");
    expect(kindOf(deal({ kind: "unknown" }), 0, 0)).toBe("Move");
  });
});
