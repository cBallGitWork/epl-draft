import { describe, expect, it } from "vitest";
import { mapPlayerNews } from "./playerNews";

describe("mapPlayerNews", () => {
  const one = {
    stories: [
      {
        scorerFantasy: { scorerId: "0794f" },
        playerNews: {
          id: "abc",
          headlineNoBrief: "Affengruber could be an option for Saturday,...",
          content: "Affengruber (not injury related) could be an option for Saturday's clash.",
          analysis: "He joined late in the window.",
          newsDate: 1788513429000,
        },
      },
    ],
  };

  it("keys a story on the id we join players by", () => {
    expect(mapPlayerNews(one)[0].fantraxId).toBe("0794f");
  });

  it("keeps the story whole, not the truncated headline", () => {
    // This is the difference from `getPlayerProfile`'s `latestNews`, which is one
    // elided sentence with its analysis behind a login.
    const story = mapPlayerNews(one)[0];
    expect(story.content).toContain("could be an option for Saturday's clash.");
    expect(story.content).not.toContain("...");
    expect(story.analysis).toBe("He joined late in the window.");
  });

  it("carries the date as the number it is, never as a Date", () => {
    // A Date is a reading of a clock's timezone and this file is pure.
    expect(mapPlayerNews(one)[0].at).toBe(1788513429000);
  });

  it("falls back to the headline when there is no body", () => {
    const headlineOnly = {
      stories: [{ scorerFantasy: { scorerId: "x" }, playerNews: { headlineNoBrief: "Out for a month" } }],
    };
    expect(mapPlayerNews(headlineOnly)[0].content).toBe("Out for a month");
  });

  it("drops a story with nobody to attribute it to", () => {
    // The join key is the only thing that makes one of these attributable.
    expect(mapPlayerNews({ stories: [{ playerNews: { content: "Somebody is injured" } }] })).toEqual([]);
  });

  it("drops a story with no words in it", () => {
    expect(mapPlayerNews({ stories: [{ scorerFantasy: { scorerId: "x" }, playerNews: {} }] })).toEqual([]);
  });

  it("strips markup Fantrax puts inside its own strings", () => {
    const tagged = {
      stories: [{ scorerFantasy: { scorerId: "x" }, playerNews: { content: "He <b>scored</b><br/>twice." } }],
    };
    expect(mapPlayerNews(tagged)[0].content).toBe("He scored twice.");
  });

  it("survives a payload with nothing in it", () => {
    expect(mapPlayerNews({})).toEqual([]);
    expect(mapPlayerNews({ stories: [] })).toEqual([]);
  });
});
