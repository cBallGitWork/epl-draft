import { describe, expect, it } from "vitest";
import type { Move } from "@epl/core";
import { swapGroups } from "./moveGroups";

const NAMES: Record<string, string> = { sem: "Semenyo", wie: "Wieffer", dia: "Diarra", bra: "Branthwaite", saka: "Saka" };
const nameOf = (id: string) => NAMES[id] ?? id;
const swap = (fantraxId: string, withId: string, to: string): Move => ({ kind: "swap", fantraxId, withId, to });

describe("swapGroups", () => {
  it("names the reserves who would come on for a man in the side, never the man himself (#161)", () => {
    const moves = [swap("wie", "sem", "M"), swap("dia", "sem", "M"), swap("bra", "sem", "D"), swap("wie", "sem", "D")];
    const groups = swapGroups(moves, "sem", nameOf);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.heading).toBe("Who comes on for him?");
    expect(groups[0]?.options.map((o) => o.label)).toEqual(["Wieffer at M", "Diarra at M", "Branthwaite at D", "Wieffer at D"]);
    expect(new Set(groups[0]?.options.map((o) => o.key)).size).toBe(4);
  });

  it("groups a reserve's swaps by where he would start, naming who comes off", () => {
    const moves = [swap("wie", "saka", "M"), swap("wie", "sem", "M"), swap("wie", "bra", "D")];
    const groups = swapGroups(moves, "wie", nameOf);
    expect(groups.map((g) => g.heading)).toEqual(["Start at M — who comes off?", "Start at D — who comes off?"]);
    expect(groups[0]?.options.map((o) => o.label)).toEqual(["Saka", "Semenyo"]);
  });

  it("ignores moves that are not swaps", () => {
    expect(swapGroups([{ kind: "demote", fantraxId: "sem" }], "sem", nameOf)).toEqual([]);
  });
});
