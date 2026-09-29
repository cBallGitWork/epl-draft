import { describe, expect, it } from "vitest";
import { draftMan } from "./__fixtures__/draftMan";
import { worthOf } from "./__fixtures__/worth";
import type { SideState } from "./state";
import { chaseLines, possibleReturns } from "./swing";
import type { DraftMan } from "./types";

const man = (name: string, slot: string, left = 1): DraftMan => draftMan(name, slot, null, 0, left, { played: 0 });
const worth = worthOf();
const state = (name: string, left: DraftMan[]): SideState => ({ side: { teamId: name, name, total: 0, eleven: left, bench: [], subOrder: [] }, subs: [], total: 0, left });

describe("chaseLines", () => {
  it("names each man once, with the returns that would win or level it and no figures", () => {
    expect(chaseLines(state("Dons", [man("Tarkowski", "D"), man("Isak", "F")]), state("Notemail", []), 3, worth)).toEqual([
      "a goal or a clean sheet from Tarkowski or a goal from Isak would win it",
      "an assist from Tarkowski or an assist from Isak would level it",
    ]);
  });

  it("counts the returns it would take, and says when they cannot catch up or can only draw", () => {
    const three = [man("A", "F"), man("B", "F"), man("C", "F")];
    expect(chaseLines(state("Dons", three), state("Notemail", []), 8, worth)).toEqual(["Dons need 3 returns to win it"]);
    expect(chaseLines(state("Dons", [man("A", "F")]), state("Notemail", []), 9, worth)).toEqual(["Dons cannot catch Notemail"]);
    expect(chaseLines(state("Dons", [man("A", "F")]), state("Notemail", []), 7, worth)).toEqual(["Dons can draw at best"]);
  });

  it("counts a defensive bonus in the ceiling before calling a lead out of reach", () => {
    expect(chaseLines(state("Dons", [man("A", "F")]), state("Notemail", []), 8, { ...worth, extra: { F: 2 } })).toEqual(["Dons need every return their men left could make"]);
  });

  it("takes both sides' minutes off the gap, and says nothing when minutes alone close it", () => {
    const paid = worthOf(2);
    expect(chaseLines(state("Dons", [man("A", "F"), man("B", "F")]), state("Notemail", [man("Z", "M")]), 5, paid)).toEqual(["a goal from A or a goal from B would win it", "an assist from A or an assist from B would level it"]);
    expect(chaseLines(state("Dons", [man("A", "F"), man("B", "F")]), state("Notemail", []), 3, paid)).toEqual([]);
  });

  it("offers a man with two matches two of each return, and a keeper only a clean sheet", () => {
    expect(possibleReturns([man("Double", "M", 2)], worth).map((r) => r.worth)).toEqual([5, 5, 3, 3, 1, 1]);
    expect(possibleReturns([man("Pickford", "G")], worth).map((r) => r.kind)).toEqual(["clean sheet"]);
  });
});
