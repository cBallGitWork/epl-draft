import { describe, expect, it } from "vitest";
import { banned } from "@epl/core";
import { written } from "./subedit";

// The fix's whole claim is that a banned phrase in the HEADLINE gets the column
// sent back. `checks.prose()` deliberately omits the headline — right for the
// stranger check, wrong for this one — so the surface this reads is the
// regression worth guarding.

describe("what the sub-editor reads", () => {
  it("catches a banned phrase in the headline", () => {
    // Verbatim from `data/editions/paper.json`. It is published, it was filed
    // while the check warned and filed anyway, and it is why this exists.
    // `banned()` returns the BANNED entry it matched, lower case, not the text
    // as printed — the match is case-insensitive, so "Banks" reports "banks".
    expect(banned(written({ headline: "test3 Banks a City Slicker" }))).toContain("banks");
  });

  it("catches one in the deck and in the body", () => {
    expect(banned(written({ deck: "He banked eleven." }))).toContain("banked");
    expect(banned(written({ body: "A afternoon of banking points." }))).toContain("banking");
  });

  it("does not fire on a surname that contains one", () => {
    // `banned()` matches whole words, which is the answer to the fear that kept
    // this a warning: refusing "would throw away a good story over a surname".
    expect(banned(written({ headline: "Bankole Keeps It Out" }))).toEqual([]);
  });

  it("reads a clean column as clean", () => {
    expect(banned(written({ headline: "Cherki Sharp", deck: "Five goals.", body: "He scored." }))).toEqual([]);
  });

  it("ignores non-string members rather than stringifying them", () => {
    // The column is the model's own JSON and a member may be anything. Joining
    // an object in would put "[object Object]" into the checked text.
    expect(written({ headline: "A Clean Line", ranks: [{ line: "x" }], extras: null })).toBe("A Clean Line");
  });
});
