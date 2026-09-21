import { describe, expect, it } from "vitest";
import { normalizeExtras } from "./extras";

// The team-news row is the article, so what this lets through is what prints.
describe("normalizeExtras — teamNews", () => {
  const row = { club: "Chelsea", code: 8, line: "Alonso would not commit." };

  it("keeps a club with a line and no men", () => {
    expect(normalizeExtras({ teamNews: [row] })?.teamNews?.[0].men).toBeUndefined();
  });

  it("drops a club with no line, because the crest alone says nothing", () => {
    expect(normalizeExtras({ teamNews: [{ club: "Chelsea", code: 8, line: "" }] })).toBeUndefined();
  });

  it("prints no crest rather than a wrong one", () => {
    const out = normalizeExtras({ teamNews: [{ ...row, code: "8" }] });
    expect(out?.teamNews?.[0].code).toBeNull();
  });

  it("reads a status it knows and defaults the rest to a doubt", () => {
    const men = [
      { name: "Dan Burn", status: "OUT", note: "ankle" },
      { name: "Nico González", status: "sidelined", note: "head" },
    ];
    const out = normalizeExtras({ teamNews: [{ ...row, men }] })?.teamNews?.[0].men;
    expect(out?.map((man) => man.status)).toEqual(["OUT", "Doubt"]);
  });

  it("omits the owner when nobody holds him", () => {
    const men = [{ name: "Kaye Furo", status: "OUT", note: "", owner: "" }];
    expect(normalizeExtras({ teamNews: [{ ...row, men }] })?.teamNews?.[0].men?.[0].owner).toBeUndefined();
  });

  it("drops a half-attributed quote, which is a sentence with no author", () => {
    const quote = { text: "He is getting closer." };
    expect(normalizeExtras({ teamNews: [{ ...row, quote }] })?.teamNews?.[0].quote).toBeUndefined();
  });

  it("keeps a whole quote", () => {
    const quote = { text: "He is getting closer.", said: "Xabi Alonso" };
    expect(normalizeExtras({ teamNews: [{ ...row, quote }] })?.teamNews?.[0].quote).toEqual(quote);
  });

  it("files one row per club", () => {
    const out = normalizeExtras({ teamNews: [row, { ...row, line: "Again." }] });
    expect(out?.teamNews).toHaveLength(1);
  });
});

describe("normalizeExtras — what the writer may not smuggle through", () => {
  const row = { club: "Chelsea", code: 8, line: "Alonso would not commit." };

  it("publishes the contract's fields and nothing else", () => {
    const out = normalizeExtras({ teamNews: [{ ...row, manager: "Alonso", verdict: "start him" }] });
    expect(Object.keys(out?.teamNews?.[0] ?? {}).sort()).toEqual(["alsoOut", "club", "code", "fixture", "line", "men", "quote"]);
  });

  it("refuses a club code that is not a real one", () => {
    expect(normalizeExtras({ teamNews: [{ ...row, code: -1 }] })?.teamNews?.[0].code).toBeNull();
    expect(normalizeExtras({ teamNews: [{ ...row, code: 1.5 }] })?.teamNews?.[0].code).toBeNull();
  });

  it("treats whitespace as absent", () => {
    expect(normalizeExtras({ teamNews: [{ ...row, line: "   " }] })).toBeUndefined();
  });
});
