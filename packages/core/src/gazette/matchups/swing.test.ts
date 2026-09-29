import { describe, expect, it } from "vitest";
import type { SideState } from "./state";
import { chaseLines, returnsOf } from "./swing";
import { draftMan } from "./__fixtures__/draftMan";
import type { DraftMan } from "./types";

const man = (name: string, slot: string, left = 1): DraftMan => draftMan(name, slot, null, 0, left, { club: "EVE", played: 0 });
const worth = {
  appearance: 0,
  returns: {
    G: [{ kind: "clean sheet" as const, worth: 4 }],
    D: [{ kind: "goal" as const, worth: 6 }, { kind: "assist" as const, worth: 3 }, { kind: "clean sheet" as const, worth: 4 }],
    M: [{ kind: "goal" as const, worth: 5 }, { kind: "assist" as const, worth: 3 }, { kind: "clean sheet" as const, worth: 1 }],
    F: [{ kind: "goal" as const, worth: 4 }, { kind: "assist" as const, worth: 3 }],
  },
};
const state = (name: string, left: DraftMan[]): SideState => ({ side: { teamId: name, name, total: 0, eleven: left, bench: [], subOrder: [] }, subs: [], total: 0, left });

describe("chaseLines", () => {
  it("names every single return that levels or wins it: a goal, an assist or a clean sheet", () => {
    const lines = chaseLines(state("Dons", [man("Tarkowski", "D"), man("Isak", "F")]), state("Notemail", []), 3, worth);
    expect(lines).toEqual([
      "a goal from Tarkowski (6), a clean sheet for Tarkowski (4) or a goal from Isak (4) would win it",
      "an assist from Tarkowski (3) or an assist from Isak (3) would level it",
    ]);
  });

  it("counts the fewest returns, richest first, and calls a lead beyond reach past the desk's limit", () => {
    const three = [man("A", "F"), man("B", "F"), man("C", "F")];
    expect(chaseLines(state("Dons", three), state("Notemail", []), 8, worth).at(-1)).toBe("Dons need at least 3 returns between them");
    expect(chaseLines(state("Dons", three), state("Notemail", []), 12, worth).at(-1)).toBe("the lead looks beyond Dons: they need at least 4 returns between them");
  });

  it("says when the lead is out of reach, or a draw is the most they can do", () => {
    expect(chaseLines(state("Dons", [man("A", "F")]), state("Notemail", [man("Z", "M")]), 9, worth)).toEqual([
      "the lead is out of reach: every return the men Dons have left could make would come to 7 points, and they need 10 points",
    ]);
    expect(chaseLines(state("Dons", [man("A", "F")]), state("Notemail", []), 7, worth).at(-1)).toMatch(/^the most Dons can do is draw/);
  });

  it("offers a man with two matches left two of each return, and a keeper only a clean sheet", () => {
    expect(returnsOf([man("Double", "M", 2)], worth).map((r) => r.worth)).toEqual([5, 5, 3, 3, 1, 1]);
    expect(returnsOf([man("Pickford", "G")], worth).map((r) => r.kind)).toEqual(["clean sheet"]);
  });

  it("takes both sides' playing time off the gap before it counts returns", () => {
    const paid = { ...worth, appearance: 2 };
    const lines = chaseLines(state("Dons", [man("A", "F"), man("B", "F")]), state("Notemail", [man("Z", "M")]), 5, paid);
    expect(lines).toEqual([
      "a goal from A (4) or a goal from B (4) would win it",
      "an assist from A (3) or an assist from B (3) would level it",
    ]);
    expect(lines.join(" ")).not.toMatch(/playing time|minutes/u);
    expect(chaseLines(state("Dons", [man("A", "F"), man("B", "F")]), state("Notemail", []), 3, paid)).toEqual(["the men Dons have left need only to play to overtake it"]);
  });
});
