import { describe, expect, it } from "vitest";
import { AMBIGUITY_MARGIN, FUZZY_MIN_SCORE, nameAgreement, tokenSetRatio } from "./similarity";

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

describe("nameAgreement", () => {
  it("separates a longer name from a contradicting one, where the score cannot", () => {
    // Both score 100 and both clear the surname guard. One is a middle name FPL
    // carries and Fantrax does not; the other is two feeds disagreeing about who
    // the player is. Only this tells them apart.
    expect(tokenSetRatio("Bruno Fernandes", "Bruno Borges Fernandes")).toBe(100);
    expect(nameAgreement("Bruno Fernandes", "Bruno Borges Fernandes")).toBe("contained");
    expect(nameAgreement("Keith Andrews", "Kaine Andrews")).toBe("conflicting");
  });

  it("reads the same name written either way round as identical", () => {
    expect(nameAgreement("Mudryk, Mykhailo", "Mykhailo Mudryk")).toBe("identical");
  });

  it("treats an abbreviated given name as a conflict", () => {
    // "Oli" is not a token-subset of "Oliver", and a human should confirm it
    // rather than the script assuming. Cheap to wave through, expensive to miss.
    expect(nameAgreement("McBurnie, Oliver", "Oli McBurnie")).toBe("conflicting");
  });

  it("calls an empty name a conflict rather than a match", () => {
    // Never the safe bucket: an unnamed row must not be waved through unread.
    expect(nameAgreement("", "Bukayo Saka")).toBe("conflicting");
  });
});
