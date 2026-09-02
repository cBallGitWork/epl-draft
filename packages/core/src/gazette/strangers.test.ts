import { describe, expect, it } from "vitest";
import { strangers } from "./strangers";

const BRIEF = [
  "THE 10 MANAGERS: 123 [a], test2 [b], test31121 [c]",
  "THE TEAM OF THE WEEK (3-5-3), best first.",
  "- B.Fernandes (M), owned by 123 [R1, pick 1]: 3 goals, 1 assists",
  "- Groß (M), owned by 123 [R2, pick 20]: 1 goals, 1 assists",
  "- Gibbs-White (M), owned by test3: 1 goals, 1 assists",
  "- João Pedro (F), owned by test211: 1 goals, 1 assists",
  "- Tarkowski (D), owned by testf [R1, pick 10]: 1 goals",
  "- Calafiori (D), owned by test3 [R1, pick 3]: 1 assists, clean sheet",
  "- Davis (D), owned by test4 [R6, pick 57]: 1 goals",
].join("\n");

describe("strangers", () => {
  it("catches a man the brief never named", () => {
    // Dedić stands in for the shape of the bug, not an instance of it: on
    // 2 Sep he turned out to be a real rostered player the brief did name.
    // What the check answers is narrow and useful — "is this name in this
    // brief" — and a human reads the answer.
    const prose = "At the back Tarkowski scored, while Dedić and Calafiori paired a clean sheet with an assist.";
    expect(strangers(prose, BRIEF)).toContain("Dedić");
  });

  it("passes prose that only names men the brief named", () => {
    const prose = [
      "B.Fernandes ran it: three goals, one assist.",
      "Groß chipped a goal and an assist for 123.",
      "Gibbs-White and João Pedro both posted a goal and an assist.",
      "Davis scored for test4.",
    ].join("\n");
    expect(strangers(prose, BRIEF)).toEqual([]);
  });

  it("knows a surname the brief printed with an initial", () => {
    // The brief says "B.Fernandes"; a paper writes "Fernandes". Same man.
    expect(strangers("Fernandes took the armband with him.", BRIEF)).toEqual([]);
  });

  it("does not report sentence openers or hyphenated names it was given", () => {
    const prose = "Across the middle Gibbs-White posted a return. When the whistle went, Three points.";
    expect(strangers(prose, BRIEF)).toEqual([]);
  });

  it("forgives a forename the brief spelled as an initial", () => {
    // The brief prints "B.Fernandes"; the paper writes "Bruno Fernandes". The
    // same man, correctly named — not a stranger.
    expect(strangers("Bruno Fernandes ran it.", BRIEF)).toEqual([]);
  });

  it("still reports a forename when the surname beside it is also unknown", () => {
    // Two unknown words together is a whole man we were never given, which is
    // exactly the case the forename rule must not swallow.
    expect(strangers("Amar Dedić kept a clean sheet.", BRIEF)).toEqual(["Amar", "Dedić"]);
  });

  it("does not report a possessive of a man the brief named", () => {
    expect(strangers("Tarkowski's goal was the only one.", BRIEF)).toEqual([]);
  });

  it("reports each stranger once, sorted, however often it appears", () => {
    const prose = "At the back Dedić held firm. Groß found Dedić again, alongside Isak.";
    expect(strangers(prose, BRIEF)).toEqual(["Dedić", "Isak"]);
  });

  it("forgives an opener followed by a figure or a hyphen", () => {
    // "Fifty-six to 45 over testf", "Sits 76 to 35", "Ninety-four scored" —
    // all sentence openers the check reported as footballers, because the rule
    // only forgave a following LOWERCASE word and a figure is neither.
    const prose = [
      "Groß scored. Fifty-six to 45 over testf.",
      "The pair banked twelve. Sits 76 to 35 over test31121.",
      "Nothing to show. Ninety-four scored and beaten by eleven.",
    ].join("\n");
    expect(strangers(prose, BRIEF)).toEqual([]);
  });

  it("treats the start of a line as the start of a sentence", () => {
    // A power ranking's rows arrive one per line. "Top of the table..." opens
    // a line rather than following a full stop, and reported as a stranger
    // until the check learned that a newline opens a sentence too.
    const prose = "League-high 103 and third.\nTop of the table, 96 scored.";
    expect(strangers(prose, BRIEF)).toEqual([]);
  });

  it("forgives a capitalised word that only ever opens a sentence", () => {
    // "Losing" tripped the check on its first live run. A stop-list of openers
    // always lags the prose, so the shape decides: a word found only after a
    // full stop and followed by lowercase is doing an opener's job. A man the
    // brief never named turns up mid-sentence, because that is where a paper
    // reports what he did.
    const prose = "Losing to test4 by 11 is no disgrace. Elsewhere the margins were tighter.";
    expect(strangers(prose, BRIEF)).toEqual([]);
  });
});
