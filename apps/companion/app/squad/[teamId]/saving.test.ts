import { describe, expect, it } from "vitest";
import { saveAllowed } from "./saving";

// `LINEUP_SAVE` is `on` for every team, a comma-separated list of Fantrax team ids for only those, else off.
describe("saveAllowed", () => {
  it("lets every team save when the flag is on", () => {
    expect(saveAllowed("on", "abc123")).toBe(true);
    expect(saveAllowed("on", "xyz789")).toBe(true);
  });

  it("lets a team on the list save", () => {
    expect(saveAllowed("abc123", "abc123")).toBe(true);
    expect(saveAllowed("abc123,xyz789", "xyz789")).toBe(true);
  });

  it("refuses a team missing from the list", () => {
    expect(saveAllowed("abc123,xyz789", "def456")).toBe(false);
  });

  it("is off when the flag is blank", () => {
    expect(saveAllowed("", "abc123")).toBe(false);
    expect(saveAllowed("  ", "abc123")).toBe(false);
  });

  it("is off when the flag is unset", () => {
    expect(saveAllowed(undefined, "abc123")).toBe(false);
  });

  it("reads ids with whitespace around them", () => {
    expect(saveAllowed(" abc123 , xyz789 ", "xyz789")).toBe(true);
    expect(saveAllowed(" abc123 , xyz789 ", "abc123")).toBe(true);
  });

  it("never matches an empty id through a stray comma", () => {
    expect(saveAllowed("abc123,,", "")).toBe(false);
  });

  it("treats any other word as a list that names no team", () => {
    expect(saveAllowed("off", "abc123")).toBe(false);
  });
});
