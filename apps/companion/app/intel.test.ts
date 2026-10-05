import { describe, expect, it } from "vitest";
import { intelSetPieces, intelStrength } from "./intel";

describe("the committed set-piece orders", () => {
  it("name every club by FPL's short name, which is what every screen looks them up by", () => {
    const clubs = [...intelStrength.values()].map((club) => club.shortName).sort();
    expect(Object.keys(intelSetPieces.clubs).sort()).toEqual(clubs);
  });
});
