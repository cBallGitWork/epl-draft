import { describe, expect, it } from "vitest";
import { conferenceArticle, conferenceTimes } from "./presserArticle";
import { classify, clauses } from "./presserSignals";

// The parser decides whether a real footballer is reported as out. Every case
// here is a sentence the 17 Sep 2026 article actually contains, or the shape
// that put a wrong one in print.
describe("clauses", () => {
  it("splits where the subject changes, so a tag cannot cross", () => {
    // This exact sentence filed two fit, praised defenders as doubts, in a club
    // row whose own quote said "all other players will be fit".
    const said =
      "Jair's possible recovery could mean a headache at centre-half, with Ola Aina and Ousmane Diomande performing well there last Saturday.";
    const parts = clauses(said);
    expect(parts).toHaveLength(2);
    expect(classify(parts[0])).toBe("injury_scare");
    expect(classify(parts[1])).toBeNull();
  });

  it("separates a return from an absence in one sentence", () => {
    const parts = clauses("Caicedo returns to the squad but Reece James will miss the trip.");
    expect(classify(parts[0])).toBe("available");
    expect(classify(parts[1])).toBe("ruled_out");
  });

  it("never splits a list of names, which a comma also separates", () => {
    const said = "Nico Gonzalez, Jacob Ramsey and Amar Dedic are all out.";
    expect(clauses(said)).toEqual([said]);
  });
});

describe("classify", () => {
  it("reads a negated absence as a doubt, never as a fact", () => {
    // Alonso's own words. Read straight, this ruled three Chelsea men out.
    expect(classify("So no one is ruled out for us for Friday.")).toBe("injury_scare");
  });

  it("says nothing about a sentence that reports no availability", () => {
    expect(classify("He scored twice at Elland Road on Monday.")).toBeNull();
  });
});

describe("clauses — additive joins", () => {
  it("keeps 'along with' in one clause, because it continues the subject", () => {
    // The real sentence. Splitting here filed Joelinton, Burn, Jaouen and Osula
    // as doubts when Jaissle had ruled all eight out.
    const said =
      "All four look set to sit out Gameweek 5, along with Joelinton (unspecified), Dan Burn (ankle), Ewen Jaouen (ankle) and Will Osula (foot).";
    expect(clauses(said)).toHaveLength(1);
    expect(classify(said)).toBe("ruled_out");
  });

  it("still splits a plain 'with' that changes subject", () => {
    const said = "Jair's possible recovery could mean a headache, with Aina performing well there.";
    expect(clauses(said)).toHaveLength(2);
  });
});

describe("conferenceTimes", () => {
  const thursday =
    "THURSDAY'S PRESS CONFERENCE TIMES Thursday's FPL Press Conferences! 8.30am – Lampard 1pm – Jakirovic 1.30pm – Andrews 2pm – Glasner 2.30pm – Jaissle";

  it("reads the hour each manager actually spoke", () => {
    const times = conferenceTimes(thursday);
    expect(times.get("lampard")).toEqual({ hour: 8, minute: 30 });
    expect(times.get("jakirovic")).toEqual({ hour: 13, minute: 0 });
    expect(times.get("jaissle")).toEqual({ hour: 14, minute: 30 });
  });

  it("keeps a compound surname whole, and findable by its last word", () => {
    const times = conferenceTimes("PRESS CONFERENCE TIMES 12pm – De Zerbi 1.30pm – Le Bris");
    expect(times.get("de zerbi")).toEqual({ hour: 12, minute: 0 });
    expect(times.get("bris")).toEqual({ hour: 13, minute: 30 });
  });

  it("returns nothing when the article publishes no block", () => {
    expect(conferenceTimes("CHELSEA Xabi Alonso was evasive.").size).toBe(0);
  });
});

describe("classify — a man declared fit", () => {
  it("reads 'able to play' as available, not as the knock it mentions", () => {
    // Hurzeler on Jaouen Hadjam. Filed as a doubt because the sentence contains
    // "knock", when it says the opposite.
    const said = 'Jaouen Hadjam is "able to play" after taking a knock in midweek.';
    expect(clauses(said).map(classify).find((t) => t !== null)).toBe("available");
  });

  it("reads 'is fine' the same way", () => {
    expect(classify("Luka Vuskovic is also fine after suffering merely from cramp.")).toBe("available");
  });
});

describe("conferenceArticle", () => {
  it("takes the live conferences article over a predicted line-ups page that sorts first", () => {
    // 18 Sep 2026's folder after the 7 Oct scrape filed GW6's line-ups pages into it.
    const names = [
      "bournemouth-v-liverpool-predicted-line-ups-fpl-team-news-2.html",
      "cash-bizot-gomes-aston-villa-injury-latest-for-fpl-gameweek-5.html",
      "fpl-gameweek-5-team-news-fridays-live-injury-updates-3.html",
      "fulham-v-man-united-predicted-line-ups-fpl-team-news-2.html",
      "index.html",
    ];
    expect(conferenceArticle(names)).toBe("fpl-gameweek-5-team-news-fridays-live-injury-updates-3.html");
  });

  it("reads every weekday's spelling", () => {
    expect(conferenceArticle(["fpl-gameweek-8-team-news-thursdays-injury-updates-alderete-latest.html"])).toBeDefined();
    expect(conferenceArticle(["fpl-gameweek-1-team-news-wednesdays-injury-updates.html"])).toBeDefined();
  });

  it("refuses a day with only line-ups, early team news or a match's team sheet", () => {
    const names = [
      "aston-villa-v-arsenal-predicted-line-ups-fpl-team-news-2.html",
      "early-fpl-gameweek-1-team-news-for-all-20-premier-league-clubs.html",
      "3pm-team-news-ndiaye-garner-start-awoniyi-in-for-simms.html",
    ];
    expect(conferenceArticle(names)).toBeUndefined();
  });
});
