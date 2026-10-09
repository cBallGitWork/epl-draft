import { describe, expect, it } from "vitest";
import { banned } from "@epl/core";
import { written } from "./subedit";

// A banned phrase in the HEADLINE sends the column back, though `checks.prose()` leaves the headline out.

describe("what the sub-editor reads", () => {
  it("catches a banned phrase in the headline", () => {
    // A published headline, verbatim; `banned()` reports the entry it matched, lower case.
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

  it("catches one in a team-news row, which is the Team Sheet's substance, and never in a manager's own words", () => {
    // "knock" is banned outright, and a club's line and a man's note are where team news would reach for it.
    const row = { club: "Leeds United", code: 2, line: "Farke has a knock to manage.", men: [{ name: "Daniel James", status: "Doubt", note: "a knock" }] };
    expect(banned(written({ headline: "Thursday Pressers", teamNews: [row] }))).toContain("knock");
    expect(banned(written({ teamNews: [{ ...row, line: "James is a doubt.", men: [{ name: "Daniel James", status: "Doubt", note: "back" }], quote: { text: "He has a knock.", said: "Daniel Farke" } }] }))).toEqual([]);
  });
});

