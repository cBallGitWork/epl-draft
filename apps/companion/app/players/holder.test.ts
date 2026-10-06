import { describe, expect, it } from "vitest";
import { holderOf } from "./holder";

const names = new Map([["l5kunst8msgbirdf", "The Raccoons"]]);

describe("holderOf", () => {
  it("names a rival holder by Fantrax's name, then by its id", () => {
    expect(holderOf({ ownerTeamId: "l5kunst8msgbirdf", status: "T" }, names, null)).toEqual({
      text: "The Raccoons",
      title: "The Raccoons",
      tone: "rival",
    });
    expect(holderOf({ ownerTeamId: "demo", status: "T" }, new Map([["demo", "Ctrl Alt Defeat"]]), null)?.text).toBe("Ctrl Alt Defeat");
    expect(holderOf({ ownerTeamId: "demo", status: "T" }, new Map(), null)?.text).toBe("demo");
  });

  it("says Yours for the reader's own man", () => {
    expect(holderOf({ ownerTeamId: "l5kunst8msgbirdf", status: "T" }, names, "l5kunst8msgbirdf")).toMatchObject({ text: "Yours", tone: "yours" });
  });

  it("prints a free man's status code, titled in words", () => {
    expect(holderOf({ ownerTeamId: null, status: "FA" }, names, null)).toEqual({ text: "FA", title: "Free agent", tone: "free" });
    expect(holderOf({ ownerTeamId: null, status: "WW" }, names, null)?.title).toBe("Waivers");
  });

  it("prints nothing for a man with neither a holder nor a status", () => {
    expect(holderOf({ ownerTeamId: null, status: "" }, names, null)).toBeNull();
  });
});
