import { describe, expect, it } from "vitest";
import { applyFixes, faultySentences } from "./lineEdit";

const never = ["came on", "absent"];
const pieces = new Map([[1, { paragraphs: ["Mukiele came on for Reinildo and brought 0 points. Groß hauled 11."] }]]);

describe("the draft's line edit", () => {
  it("finds the sentences still carrying a banned phrase", () => {
    expect(faultySentences(pieces, never)).toEqual([{ matchup: 1, sentence: "Mukiele came on for Reinildo and brought 0 points.", words: ["came on"] }]);
  });

  it("keeps a clean rewrite with the same figures, and refuses one that changes a figure or keeps the phrase", () => {
    const fixes = faultySentences(pieces, never);
    expect(applyFixes(pieces, fixes, ["Mukiele replaced Reinildo and brought 0 points."], never).get(1)?.paragraphs[0]).toBe("Mukiele replaced Reinildo and brought 0 points. Groß hauled 11.");
    expect(applyFixes(pieces, fixes, ["Mukiele replaced Reinildo and brought 2 points."], never).get(1)?.paragraphs[0]).toContain("came on");
    expect(applyFixes(pieces, fixes, ["Mukiele came on for the absent Reinildo, 0 points."], never).get(1)?.paragraphs[0]).toContain("came on for Reinildo");
  });

  it("reads a man's name as a name, never as a banned word", () => {
    const gray = new Map([[1, { paragraphs: ["Gray played 71 minutes."] }]]);
    expect(faultySentences(gray, ["gray"], ["Gray"])).toEqual([]);
    expect(faultySentences(gray, ["gray"])).toHaveLength(1);
  });

  it("finds an American -ize that no word list names, and refuses a rewrite that keeps one", () => {
    const ize = new Map([[1, { paragraphs: ["Saka capitalized with 11 points. Groß hauled 11."] }]]);
    const fixes = faultySentences(ize, []);
    expect(fixes).toEqual([{ matchup: 1, sentence: "Saka capitalized with 11 points.", words: ["capitalized"] }]);
    expect(applyFixes(ize, fixes, ["Saka finalized 11 points."], []).get(1)?.paragraphs[0]).toContain("capitalized");
    expect(applyFixes(ize, fixes, ["Saka scored 11 points."], []).get(1)?.paragraphs[0]).toBe("Saka scored 11 points. Groß hauled 11.");
  });
});
