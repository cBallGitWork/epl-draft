import { describe, expect, it } from "vitest";
import { requireLeague } from "./config";

// No league is named in the code: the environment names the one to serve, and an
// edge that would run on nothing refuses instead.
describe("requireLeague", () => {
  it("refuses an unset league, and the blank an unset Actions variable expands to", () => {
    expect(() => requireLeague("")).toThrow(/FANTRAX_LEAGUE_ID/);
    expect(() => requireLeague("  ")).toThrow(/FANTRAX_LEAGUE_ID/);
  });

  it("passes a league id through", () => {
    expect(requireLeague("zbn1z3ukmsgb36sz")).toBe("zbn1z3ukmsgb36sz");
  });
});
