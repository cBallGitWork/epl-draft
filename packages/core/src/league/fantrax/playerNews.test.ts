import { describe, expect, it } from "vitest";
import { mapPlayerStories } from "./playerNews";

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
