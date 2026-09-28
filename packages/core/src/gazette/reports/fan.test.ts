import { describe, expect, it } from "vitest";
import type { ReportsDraft } from "./draft";
import { fanFaults } from "./fan";

const draft: ReportsDraft = {
  headline: "x",
  headlines: [],
  matches: new Map([[1, { standfirst: "Villa won 3-2 at Tottenham.", account: "Spurs were never in it until the end.", sections: [{ head: "Kudus", pitch: "Kudus came on.", stake: "Nobody holds him." }] }]]),
};

describe("fanFaults", () => {
  it("turns a word-for-word quote into a send-back, never a hard fault", () => {
    const faults = fanFaults({ flags: [{ fixture: 1, part: "account", quote: "were never  in it", tag: "not so", why: "20 shots" }] }, draft, 3);
    expect(faults).toEqual([{ section: "1:account", check: "a supporter would not say this: not so", severity: "send-back", evidence: '"were never  in it" (20 shots)' }]);
  });

  it("drops a paraphrase, an unknown part and an unknown match", () => {
    expect(fanFaults({ flags: [
      { fixture: 1, part: "account", quote: "Spurs were out of it" },
      { fixture: 1, part: "s9", quote: "Kudus" },
      { fixture: 2, part: "account", quote: "Spurs" },
    ] }, draft, 3)).toEqual([]);
  });

  it("reads a section's head, football and stake together, and caps each part", () => {
    const flags = ["Kudus came on", "Nobody holds him", "Kudus"].map((quote) => ({ fixture: 1, part: "s1", quote }));
    expect(fanFaults({ flags }, draft, 2)).toHaveLength(2);
  });

  it("files a flag on the day's headline under the headline", () => {
    expect(fanFaults({ flags: [{ fixture: 0, part: "headline", quote: "x", tag: "not so" }] }, draft, 3)).toMatchObject([{ section: "headline" }]);
  });

  it("has nothing to say when he has nothing to say", () => {
    expect(fanFaults({ flags: [] }, draft, 3)).toEqual([]);
    expect(fanFaults({}, draft, 3)).toEqual([]);
  });
});

describe("fanHeadline", () => {
  it("takes the candidate he numbered, and none for null or a number not offered", async () => {
    const { fanHeadline } = await import("./fan");
    expect(fanHeadline({ headline: 2 }, ["a", "b"])).toBe("b");
    expect(fanHeadline({ headline: null }, ["a"])).toBeNull();
    expect(fanHeadline({ headline: 3 }, ["a", "b"])).toBeNull();
  });
});
