import { describe, expect, it } from "vitest";
import { requireLeagueInCi } from "./league";

describe("requireLeagueInCi", () => {
  it("refuses a CI firing with no league chosen", () => {
    expect(() => requireLeagueInCi({ CI: "true" })).toThrow(/FANTRAX_LEAGUE_ID/);
  });

  it("refuses the empty string an unset Actions variable expands to", () => {
    expect(() => requireLeagueInCi({ CI: "true", FANTRAX_LEAGUE_ID: "" })).toThrow(/FANTRAX_LEAGUE_ID/);
  });

  it("lets a CI firing with a league through", () => {
    expect(() => requireLeagueInCi({ CI: "true", FANTRAX_LEAGUE_ID: "zbn1z3ukmsgb36sz" })).not.toThrow();
  });

  it("lets a local run fall back to the default league", () => {
    expect(() => requireLeagueInCi({})).not.toThrow();
  });
});
