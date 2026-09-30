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
});
