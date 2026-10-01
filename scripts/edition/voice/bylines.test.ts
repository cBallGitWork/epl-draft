import { describe, expect, it } from "vitest";
import { STAFF_WRITERS, STORY_KINDS } from "@epl/core";
import { COLUMNIST, editionName } from "./bylines";

describe("who a story runs under", () => {
  it("gives every kind one writer: a staff writer, or a columnist under his own name", () => {
    for (const kind of STORY_KINDS) expect([STAFF_WRITERS[kind], COLUMNIST[kind]].filter(Boolean), kind).toHaveLength(1);
  });
});

describe("editionName for a match-day report", () => {
  it("is named for the day the matches were played, not the day it filed", () => {
    // Saturday's matches, filed on Sunday morning.
    expect(editionName("match-report", "2026-09-20T07:15:00Z", "2026-09-19T11:30:00Z")).toBe("Saturday Prem Report");
    expect(editionName("match-report", "2026-09-20T21:00:00Z", "2026-09-20T15:30:00Z")).toBe("Sunday Prem Report");
    expect(editionName("match-report", "2026-09-23T06:15:00Z", "2026-09-22T19:30:00Z")).toBe("Tuesday Prem Report");
    expect(editionName("draft-report", "2026-09-19T22:00:00Z", "2026-09-19")).toBe("Saturday Draft Report");
  });

  it("reads the day in London: a 20:00 BST kick-off on Friday is Friday's", () => {
    expect(editionName("match-report", "2026-09-19T07:00:00Z", "2026-09-18T19:00:00Z")).toBe("Friday Prem Report");
  });
});

describe("editionName for the Bin XI", () => {
  it("goes out the night the bins do, whatever the hour it files on Tuesday", () => {
    expect(editionName("bin-xi", "2026-09-29T06:15:00Z")).toBe("Bins Out");
    expect(editionName("bin-xi", "2026-09-28T23:30:00Z")).toBe("Bins Out");
  });
});
