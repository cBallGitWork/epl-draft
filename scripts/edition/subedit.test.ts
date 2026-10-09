import { describe, expect, it } from "vitest";
import { NEWS_GAPS, banned } from "@epl/core";
import { presserFaults, sendBackPresser, written } from "./subedit";

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

describe("the Team Sheet's send-back", () => {
  // The Team Sheet of 9 Oct 2026, verbatim.
  const filed = {
    deck: "Nobel Mendy back in contention for Hull City",
    body: "Nobel Mendy is back in contention for Hull City, and that is all that was said about him. No complaint was named and no manager was attached to the update, so whether he starts is left open.",
    teamNews: [
      { club: "Arsenal", code: 3, line: "William Saliba and Christos Tzolis stay sidelined, with no manager attached to the update.", men: [{ name: "Cristhian Mosquera", status: "FIT", note: "muscle" }] },
      { club: "Tottenham Hotspur", code: 6, line: "Pedro Porro and the rest of the sidelined five gain no fresh word before the deadline." },
    ],
  };

  it("sends back a column written about absent managers and absent news, and a fit man's bare complaint", () => {
    const faults = presserFaults(filed);
    expect(faults.phrases).toEqual(expect.arrayContaining(["no manager", "attached to the update", "no fresh", "all that was said", "no complaint", "left open", "whether he starts"]));
    expect(faults.fit).toEqual(["Cristhian Mosquera"]);
    const words = sendBackPresser(faults);
    expect(words).toContain("Cristhian Mosquera");
    expect(words).toContain('"no manager"');
  });

  it("passes a column that says who is out and who is back", () => {
    const clean = presserFaults({
      deck: "Nobel Mendy back for Hull City",
      body: "Nobel Mendy is back in contention for Hull City.",
      teamNews: [{ club: "Arsenal", code: 3, line: "William Saliba and Christos Tzolis are out.", men: [{ name: "Cristhian Mosquera", status: "FIT", note: "back from a muscle injury" }] }],
    });
    expect(clean).toEqual({ phrases: [], fit: [], lines: [], quotes: [], notes: [] });
    expect(sendBackPresser(clean)).toBe("");
  });

  // Friday 9 Oct 2026, verbatim: Arsenal printed four men and no line, no quote of the three offered, and Forest's
  // Milenković went out with no note though his manager said he would miss the game.
  it("sends back a club with news but no line, a quote offered and not printed, and a man with no note", () => {
    const friday = {
      teamNews: [
        { club: "Arsenal", code: 3, men: [{ name: "Christos Tzolis", status: "OUT", note: "hamstring" }] },
        { club: "Nottingham Forest", code: 17, men: [{ name: "Igor Jesus", status: "OUT", note: "calf" }, { name: "Nikola Milenković", status: "FIT", note: "" }] },
      ],
    };
    const expected = {
      reported: [{ code: 3, club: "Arsenal" }, { code: 17, club: "Nottingham Forest" }],
      quoted: [{ code: 3, club: "Arsenal" }],
      noted: ["Christos Tzolis", "Nikola Milenković"],
    };
    const faults = presserFaults(friday, expected);
    expect(faults).toMatchObject({ lines: ["Arsenal", "Nottingham Forest"], quotes: ["Arsenal"], notes: ["Nikola Milenković"] });
    const words = sendBackPresser(faults);
    expect(words).toContain("THESE CLUBS HAD NEWS AND NO LINE: Arsenal, Nottingham Forest");
    expect(words).toContain("THESE CLUBS WERE GIVEN A QUOTE WITH A FACT AND PRINTED NONE: Arsenal");
    expect(words).toContain("THESE MEN HAVE AN EMPTY NOTE: Nikola Milenković");
    expect(banned(words, NEWS_GAPS)).toEqual([]);
  });
});

