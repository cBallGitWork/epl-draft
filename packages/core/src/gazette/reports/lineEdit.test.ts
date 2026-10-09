import { describe, expect, it } from "vitest";
import type { ReportsDraft } from "./draft";
import { applyFixes, faultySentences } from "./lineEdit";

const draft: ReportsDraft = {
  headline: "",
  headlines: [],
  matches: new Map([[1, { standfirst: "Villa won 3-2.", account: "Kudus had one chalked off on the hour. Jackson scored.", sections: [] }]]),
};

describe("the line edit", () => {
  it("finds the sentence still breaking the words, and names them", () => {
    expect(faultySentences(draft, [])).toEqual([{ code: 1, sentence: "Kudus had one chalked off on the hour.", words: ["chalked off"] }]);
  });

  it("keeps a fix that clears the words and states the same figures", () => {
    const fixes = faultySentences(draft, []);
    const fixed = applyFixes(draft, fixes, ["Kudus had one ruled out on the hour."]);
    expect(fixed.matches.get(1)?.account).toBe("Kudus had one ruled out on the hour. Jackson scored.");
  });

  it("refuses a fix that still breaks a word or changes a figure", () => {
    const fixes = faultySentences(draft, []);
    expect(applyFixes(draft, fixes, ["Kudus had one chalked off, twice."]).matches.get(1)?.account).toContain("chalked off on the hour");
    expect(applyFixes(draft, fixes, ["Kudus had two ruled out on the hour."]).matches.get(1)?.account).toContain("chalked off on the hour");
  });

  it("keeps a fix that names a man whose name is a word the paper bans: Archie Gray is no American spelling", () => {
    const gray: ReportsDraft = { ...draft, matches: new Map([[1, { standfirst: "Spurs won 1-0.", account: "Archie Gray scored a dramatic winner.", sections: [] }]]) };
    const fixes = faultySentences(gray, ["Archie Gray"]);
    expect(fixes.map((fix) => fix.words)).toEqual([["dramatic"]]);
    expect(applyFixes(gray, fixes, ["Archie Gray scored the winner."]).matches.get(1)?.account).toBe("Archie Gray scored the winner.");
  });
});
