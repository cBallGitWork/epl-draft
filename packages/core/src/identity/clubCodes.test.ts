import { describe, expect, it } from "vitest";
import { toFantraxClubCode, toFplClubCode } from "./clubCodes";

describe("toFplClubCode", () => {
  it("respells the two codes the providers disagree on", () => {
    // The whole reason the file exists: get these wrong and every Brentford and
    // Nott'm Forest player is matched against someone else's squad.
    expect(toFplClubCode("BRF")).toBe("BRE");
    expect(toFplClubCode("NOT")).toBe("NFO");
  });

  it("leaves the eighteen both providers spell the same way alone", () => {
    expect(toFplClubCode("ARS")).toBe("ARS");
    expect(toFplClubCode("LIV")).toBe("LIV");
    expect(toFplClubCode("NEW")).toBe("NEW");
  });

  it("passes an unseen code through rather than dropping it", () => {
    // A promoted side arrives in Fantrax before this table hears about it. A
    // pass-through puts its players in a pool that may match; an empty string
    // puts them in one that cannot.
    expect(toFplClubCode("LEE")).toBe("LEE");
  });

  it("is idempotent — an FPL spelling fed back in survives unchanged", () => {
    // Guards against the table ever gaining reverse entries, which would send
    // Forest back to NOT on a second pass and match nothing.
    expect(toFplClubCode(toFplClubCode("BRF"))).toBe("BRE");
    expect(toFplClubCode("NFO")).toBe("NFO");
  });
});

describe("toFantraxClubCode", () => {
  it("spells FPL's codes back the way Fantrax does", () => {
    expect(toFantraxClubCode("BRE")).toBe("BRF");
    expect(toFantraxClubCode("NFO")).toBe("NOT");
  });

  it("leaves a code both spell the same way alone, and undoes toFplClubCode", () => {
    expect(toFantraxClubCode("ARS")).toBe("ARS");
    for (const code of ["BRF", "NOT", "MCI"]) expect(toFantraxClubCode(toFplClubCode(code))).toBe(code);
  });
});
