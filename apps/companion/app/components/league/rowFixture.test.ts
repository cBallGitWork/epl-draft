import { describe, expect, it } from "vitest";
import { DASH, type FootballPlayer, type Opposition, type RosteredPlayer } from "@epl/core";
import { rowFixture } from "./rowFixture";

const slot = { fantraxId: "a", position: "M", status: "" };
const saka: RosteredPlayer = { slot, player: { clubId: 1 } as FootballPlayer, stats: [] };
const nobody: RosteredPlayer = { slot, unresolved: "unmapped" };
const atHome = [{ club: { shortName: "BRE" }, home: true } as Opposition];

describe("rowFixture", () => {
  it("prints his club's fixture", () => {
    expect(rowFixture({ rostered: saka, opposition: atHome })).toEqual({ text: "BRE (H)", quiet: false });
  });

  it("is the quiet dash, not 'unmapped', for a man whose club sits the gameweek out", () => {
    expect(rowFixture({ rostered: saka, opposition: undefined })).toEqual({ text: DASH, quiet: true });
  });

  it("says 'unmapped' only for a slot with no footballer behind it", () => {
    expect(rowFixture({ rostered: nobody, opposition: undefined })).toEqual({ text: "unmapped", quiet: true });
  });
});
