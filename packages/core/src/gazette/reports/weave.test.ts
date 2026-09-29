import { describe, expect, it } from "vitest";
import type { ReportsDraft } from "./draft";
import { weaveBrief } from "./weave";

describe("weaveBrief", () => {
  it("hands the senior writer the facts and only the matches asked for, accounts as paragraphs", () => {
    const draft: ReportsDraft = {
      headline: "",
      headlines: [],
      matches: new Map([
        [1, { standfirst: "One won.", account: "First.\nSecond.", sections: [{ head: "h", pitch: "p", stake: "s" }] }],
        [2, { standfirst: "Two won.", account: "Other.", sections: [] }],
      ]),
    };
    const brief = weaveBrief("THE FACTS", draft, [1]);
    expect(brief.startsWith("THE FACTS")).toBe(true);
    const filed = JSON.parse(brief.slice(brief.indexOf("{")));
    expect(filed.matches).toEqual([{ fixture: 1, standfirst: "One won.", account: ["First.", "Second."], sections: [{ head: "h", pitch: "p", stake: "s" }] }]);
  });
});
