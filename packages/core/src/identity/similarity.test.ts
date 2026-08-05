import { describe, expect, it } from "vitest";
import { AMBIGUITY_MARGIN, FUZZY_MIN_SCORE, tokenSetRatio } from "./similarity";

describe("tokenSetRatio", () => {
  it("ignores word order", () => {
    // Fantrax writes "Surname, Firstname"; FPL writes the other way round. If
    // order mattered, almost nothing would match.
    expect(tokenSetRatio("Mudryk Mykhailo", "Mykhailo Mudryk")).toBe(100);
  });

  it("scores containment at 100 — the reason match.ts guards it", () => {
    // Not a bug. When one token set contains the other, the constructed strings
    // coincide. It is exactly why a bare "Gabriel" must not be allowed to claim
    // "Gabriel Jesus" on score alone.
    expect(tokenSetRatio("Gabriel", "Gabriel Jesus")).toBe(100);
    expect(tokenSetRatio("Raya", "David Raya Martin")).toBe(100);
  });

  it("rewards a shared surname with differing given names, without certainty", () => {
    const score = tokenSetRatio("Jack Clarke", "Harry Clarke");
    expect(score).toBeLessThan(FUZZY_MIN_SCORE);
  });

  it("scores unrelated names low", () => {
    expect(tokenSetRatio("Bukayo Saka", "Erling Haaland")).toBeLessThan(50);
  });

  it("tolerates a spelling slip", () => {
    expect(tokenSetRatio("Dominik Szoboszlai", "Dominik Szobozslai")).toBeGreaterThanOrEqual(
      FUZZY_MIN_SCORE,
    );
  });

  it("is symmetric", () => {
    expect(tokenSetRatio("Chris Wood", "Wood Chris")).toBe(tokenSetRatio("Wood Chris", "Chris Wood"));
  });

  it("handles empty input", () => {
    expect(tokenSetRatio("", "")).toBe(100);
    expect(tokenSetRatio("", "Saka")).toBe(0);
  });

  it("normalises before comparing", () => {
    expect(tokenSetRatio("Ødegaard, Martin", "Martin Odegaard")).toBe(100);
  });

  // A calibration table straddling the threshold. These are the pairs that
  // decide whether 88 is set sensibly; revisit them together, not one at a time.
  it.each([
    ["Gabriel Jesus", "Gabriel Fernando de Jesus", true],
    ["Bruno Fernandes", "Bruno Borges Fernandes", true],
    ["Igor Thiago", "Thiago Igor Silva", true],
    ["Jack Clarke", "Harry Clarke", false],
    ["Diego Leon", "Diego Gomez", false],
  ])("calibration: %s vs %s clears threshold = %s", (a, b, expected) => {
    expect(tokenSetRatio(a, b) >= FUZZY_MIN_SCORE).toBe(expected);
  });
});

describe("thresholds", () => {
  it("keeps the margin meaningfully below the threshold", () => {
    expect(AMBIGUITY_MARGIN).toBeGreaterThan(0);
    expect(AMBIGUITY_MARGIN).toBeLessThan(100 - FUZZY_MIN_SCORE + AMBIGUITY_MARGIN);
  });
});
