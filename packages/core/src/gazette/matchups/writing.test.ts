import { describe, expect, it } from "vitest";
import { mergeDraft, readDraftWriting } from "./writing";

describe("readDraftWriting", () => {
  it("reads each piece by its number, drops empty paragraphs, and keeps only puns that name their word", () => {
    const writing = readDraftWriting({
      headlineStory: "123 edged test2",
      headlines: [{ text: "Haaland the last word", playsOn: "last", twoMeanings: "final, and latest" }, { text: "A plain line" }],
      pieces: [{ number: 1, standfirst: "123 beat test2 38-37.", paragraphs: ["One.", "", "Two."] }, { number: "x" }],
    });
    expect(writing.headlines).toEqual(["Haaland the last word"]);
    expect(writing.matchups.get(1)).toEqual({ standfirst: "123 beat test2 38-37.", paragraphs: ["One.", "Two."] });
    expect(writing.matchups.size).toBe(1);
  });
});

describe("mergeDraft", () => {
  const piece = (tag: string) => ({ standfirst: tag, paragraphs: [tag] });
  const writing = (tag: string) => ({ headlines: [], meanings: {}, headlineStory: "", matchups: new Map([[1, piece(tag)], [2, piece(tag)]]) });
  it("keeps a clean first attempt, a better rewrite, and neither when both break a hard rule", () => {
    const first = { writing: writing("first"), faults: [{ section: "2:matchup", check: "x", severity: "send-back" as const, evidence: "" }] };
    const second = { writing: writing("second"), faults: [] };
    expect([...mergeDraft([first, second], 2).values()].map((p) => p.standfirst)).toEqual(["first", "second"]);
    const hard = { section: "1:matchup", check: "x", severity: "hard" as const, evidence: "" };
    expect(mergeDraft([{ ...first, faults: [hard] }, { ...second, faults: [hard] }], 2).has(1)).toBe(false);
  });
});
