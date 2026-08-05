import { describe, expect, it } from "vitest";
import { fplNameVariants, normalizeName, surname, tokens } from "./normalize";

describe("normalizeName", () => {
  it("folds glyphs NFKD cannot decompose", () => {
    // The bug this table exists for: stripping rather than folding turns
    // "Ødegaard" into "degaard", which matches nothing anyone else writes.
    expect(normalizeName("Ødegaard")).toBe("odegaard");
    expect(normalizeName("Odegaard")).toBe("odegaard");
    expect(normalizeName("Groß")).toBe("gross");
    expect(normalizeName("Đurić")).toBe("duric");
    expect(normalizeName("Łukasz")).toBe("lukasz");
  });

  it("strips ordinary diacritics", () => {
    expect(normalizeName("Raya Martín")).toBe("raya martin");
    expect(normalizeName("Nuno Tavares")).toBe("nuno tavares");
    expect(normalizeName("Höjlund")).toBe("hojlund");
  });

  it("reduces punctuation and hyphens to spaces", () => {
    expect(normalizeName("Harriman-Annous")).toBe("harriman annous");
    expect(normalizeName("B.Fernandes")).toBe("b fernandes");
    expect(normalizeName("N'Golo  Kanté")).toBe("n golo kante");
  });

  it("is idempotent", () => {
    const once = normalizeName("Ødegaard, Martin");
    expect(normalizeName(once)).toBe(once);
  });

  it("survives empty and punctuation-only input", () => {
    expect(normalizeName("")).toBe("");
    expect(normalizeName("---")).toBe("");
    expect(tokens("---")).toEqual([]);
  });
});

describe("surname", () => {
  it("takes the last token", () => {
    expect(surname("Gabriel Jesus")).toBe("jesus");
    expect(surname("Bruno Borges Fernandes")).toBe("fernandes");
  });

  it("is the whole name when there is only one token", () => {
    expect(surname("Ronaldo")).toBe("ronaldo");
  });
});

describe("fplNameVariants", () => {
  it("generates the spellings other providers actually use", () => {
    const variants = fplNameVariants({
      firstName: "Bruno",
      secondName: "Borges Fernandes",
      webName: "B.Fernandes",
    });
    expect(variants).toContain("bruno borges fernandes");
    expect(variants).toContain("borges fernandes");
    expect(variants).toContain("b fernandes");
  });

  it("covers the bare-surname web name", () => {
    const variants = fplNameVariants({
      firstName: "David",
      secondName: "Raya Martín",
      webName: "Raya",
    });
    expect(variants).toContain("raya");
    expect(variants).toContain("david raya martin");
  });

  it("deduplicates and drops empties", () => {
    const variants = fplNameVariants({ firstName: "", secondName: "Ronaldo", webName: "Ronaldo" });
    expect(variants).toEqual(["ronaldo"]);
  });
});
