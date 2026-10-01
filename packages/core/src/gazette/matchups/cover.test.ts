import { describe, expect, it } from "vitest";
import { draftMan } from "./__fixtures__/draftMan";
import { contextOf as context } from "./__fixtures__/context";
import { draftSide, eleven } from "./__fixtures__/draftSide";
import { draftFace } from "./cover";
import { benchTurned, lateDecider } from "./__fixtures__/gw5";

describe("draftFace", () => {
  it("is the winner's top scorer, even when the loser had a bigger haul", () => {
    const home = draftSide("123", 38, eleven("h", { 9: draftMan("Haaland", "F", 6, 90, 0, { code: 223094, clubId: 13 }) }));
    const away = draftSide("test2", 37, eleven("a", { 1: draftMan("Hall", "D", 8, 90, 0, { code: 1 }) }));
    expect(draftFace([context(home, away)])).toEqual({ code: 223094, name: "Haaland", clubId: 13, position: "F" });
  });

  it("counts a reserve who came on and not the man he replaced, and breaks a tie on the name", () => {
    const home = draftSide("test3", 33, eleven("h", { 1: draftMan("Dunk", "D", null, 0) }), [draftMan("Vuskovic", "D", 6, 90, 0, { code: 7 })]);
    expect(draftFace([context(home, draftSide("test4", 28, eleven("a")))])?.name).toBe("Vuskovic");
    const tied = draftSide("A", 30, eleven("h", { 2: draftMan("Zola", "D", 5, 90, 0, { club: "Chelsea" }), 3: draftMan("Adams", "D", 5, 90, 0, { club: "Arsenal" }) }));
    expect(draftFace([context(tied, draftSide("B", 20, eleven("a")))])?.name).toBe("Adams");
  });

  it("follows the lead match-up's story: the man it is told through", () => {
    expect(draftFace([lateDecider()])?.name).toBe("Haaland");
    expect(draftFace([benchTurned(), lateDecider()])?.name).toBe("Vuskovic");
  });

  it("is nobody when nobody has scored", () => {
    const blank = (tag: string) => draftSide(tag, 0, eleven(tag).map((m) => ({ ...m, points: 0 })));
    expect(draftFace([context(blank("A"), blank("B"))])).toBeNull();
    expect(draftFace([])).toBeNull();
  });
});
