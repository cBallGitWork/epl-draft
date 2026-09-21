import { describe, expect, it } from "vitest";
import { mapPlayerStories, mapPoolNews } from "./playerNews";

const section = (playerNews: unknown[]) => ({ sectionContent: { NEWS_NOTES: { playerNews } } }) as never;

describe("mapPlayerStories", () => {
  const suzuki = section([
    {
      id: "179fsi3z",
      headlineNoBrief: "Suzuki registered one save and allowed one goal in Monday's 1-0 defeat to Arsenal.",
      content: "Suzuki registered one save and allowed one goal in Monday's 1-0 defeat to Arsenal.",
      analysis: "Just a day after Emiliano Martinez joined Chelsea, Suzuki made his debut.",
      newsDate: 1788221819000,
    },
    {
      id: "j9tiwlos",
      headlineNoBrief: "Suzuki has completed a permanent transfer to Aston Villa from Parma.",
      content: "Suzuki has completed a permanent transfer to Aston Villa from Parma.",
      analysis: "He represented Japan at the 2026 World Cup.",
      newsDate: 1787000000000,
    },
  ]);

  it("returns every story, not just the latest", () => {
    // The difference from the pool feed, which files one per player, and from the
    // profile's own `latestNews`, which is one truncated sentence.
    expect(mapPlayerStories(suzuki)).toHaveLength(2);
  });

  it("keeps the analysis the profile puts behind a login", () => {
    expect(mapPlayerStories(suzuki)[0].analysis).toContain("made his debut");
  });

  it("reads newest first", () => {
    expect(mapPlayerStories(suzuki).map((s) => s.id)).toEqual(["179fsi3z", "j9tiwlos"]);
  });

  it("sorts rather than trusting the payload's order", () => {
    const reversed = section([
      { id: "old", content: "Older", newsDate: 1 },
      { id: "new", content: "Newer", newsDate: 2 },
    ]);
    expect(mapPlayerStories(reversed).map((s) => s.id)).toEqual(["new", "old"]);
  });

  it("sinks a story with no date rather than floating it", () => {
    // It cannot be shown to be recent, and putting it on top would claim it is.
    const mixed = section([{ id: "undated", content: "No date" }, { id: "dated", content: "Dated", newsDate: 1 }]);
    expect(mapPlayerStories(mixed).map((s) => s.id)).toEqual(["dated", "undated"]);
  });

  it("carries the date as the number it is", () => {
    expect(mapPlayerStories(suzuki)[0].at).toBe(1788221819000);
  });

  it("falls back to the headline when there is no body", () => {
    expect(mapPlayerStories(section([{ headlineNoBrief: "Out for a month" }]))[0].content).toBe(
      "Out for a month",
    );
  });

  it("drops a story with no words in it", () => {
    expect(mapPlayerStories(section([{ id: "x" }]))).toEqual([]);
  });

  it("strips markup Fantrax puts inside its own strings", () => {
    // `<b>test4</b>` is a real cell value on the transactions section of this
    // same payload.
    expect(mapPlayerStories(section([{ content: "He <b>scored</b><br/>twice." }]))[0].content).toBe(
      "He scored twice.",
    );
  });

  it("survives a payload with no section in it", () => {
    expect(mapPlayerStories({})).toEqual([]);
    expect(mapPlayerStories({ sectionContent: {} })).toEqual([]);
    expect(mapPlayerStories(section([]))).toEqual([]);
  });
});

const pool = (stories: unknown[]) => ({ stories }) as never;

describe("mapPoolNews", () => {
  const story = (scorerId: string, fields: Record<string, unknown>) => ({
    scorerFantasy: { scorerId },
    playerNews: fields,
  });

  const feed = pool([
    story("05g2o", {
      id: "179fsi3z",
      headlineNoBrief: "Isak scored twice in Saturday's 3-1 win over Everton.",
      content: "Isak scored twice in Saturday's 3-1 win over Everton.",
      analysis: "He has five in his last four.",
      newsDate: 1788221819000,
    }),
    story("0646f", {
      id: "j9tiwlos",
      headlineNoBrief: "Gabriel is a doubt for the weekend with a thigh problem.",
      content: "Gabriel is a doubt for the weekend with a thigh problem.",
      newsDate: 1788200000000,
    }),
  ]);

  it("files each story under the man it is about", () => {
    // `scorerId` is our `fantraxId`, which is what lets a roster join against it.
    expect(Object.keys(mapPoolNews(feed)).sort()).toEqual(["05g2o", "0646f"]);
    expect(mapPoolNews(feed)["05g2o"].content).toContain("scored twice");
  });

  it("carries the analysis, and states its absence rather than emptying it", () => {
    expect(mapPoolNews(feed)["05g2o"].analysis).toBe("He has five in his last four.");
    expect(mapPoolNews(feed)["0646f"].analysis).toBeNull();
  });

  it("keeps the FIRST story about a man, which is the newest", () => {
    // The feed arrives newest-first, so a second story about the same man is the
    // older one. Last-wins would quietly age every player who had two.
    const twice = pool([
      story("05g2o", { id: "today", content: "Back in training.", newsDate: 2 }),
      story("05g2o", { id: "yesterday", content: "Limped off.", newsDate: 1 }),
    ]);
    expect(mapPoolNews(twice)["05g2o"].id).toBe("today");
  });

  it("drops a story it cannot put a name to", () => {
    // Nothing can join it, and a story about nobody on a player's card is worse
    // than the card carrying no story.
    expect(mapPoolNews(pool([{ playerNews: { content: "Somebody is injured." } }]))).toEqual({});
    expect(mapPoolNews(pool([story("", { content: "Somebody is injured." })]))).toEqual({});
  });

  it("drops a row with no story on it", () => {
    expect(mapPoolNews(pool([{ scorerFantasy: { scorerId: "05g2o" } }]))).toEqual({});
  });

  it("drops a story with no words in it", () => {
    expect(mapPoolNews(pool([story("05g2o", { id: "x" })]))).toEqual({});
    expect(mapPoolNews(pool([story("05g2o", { id: "x", content: "   " })]))).toEqual({});
  });

  it("falls back to the headline when there is no body", () => {
    const only = mapPoolNews(pool([story("05g2o", { headlineNoBrief: "Out for a month" })]));
    expect(only["05g2o"].content).toBe("Out for a month");
    expect(only["05g2o"].headline).toBe("Out for a month");
  });

  it("says it does not know when the story was filed", () => {
    // No date is not "just now". Nothing may print this one as today's news.
    const undated = mapPoolNews(pool([story("05g2o", { id: "x", content: "Fit again." })]));
    expect(undated["05g2o"].at).toBeNull();
    expect(mapPoolNews(feed)["05g2o"].at).toBe(1788221819000);
  });

  it("strips markup Fantrax puts inside its own strings", () => {
    const marked = mapPoolNews(pool([story("05g2o", { content: "He <b>scored</b><br/>twice." })]));
    expect(marked["05g2o"].content).toBe("He scored twice.");
  });

  it("survives a payload with no stories in it", () => {
    // A quiet seventeen hours, which is all this window ever covers.
    expect(mapPoolNews({})).toEqual({});
    expect(mapPoolNews(pool([]))).toEqual({});
  });
});
