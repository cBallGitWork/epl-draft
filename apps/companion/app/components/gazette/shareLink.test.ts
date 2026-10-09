import { describe, expect, it } from "vitest";
import { articleMetadata, shareOf } from "./shareLink";

const story = { slug: "gw6-predicted-xi", headline: "Predicted Line-Ups: Gameweek 6", deck: "Every club's expected starting eleven.", filedAt: "2026-10-09T17:00:00.000Z" };

describe("shareOf", () => {
  it("shares the headline and the article's absolute address", () => {
    expect(shareOf(story, "https://example.app")).toEqual({
      title: "Predicted Line-Ups: Gameweek 6",
      url: "https://example.app/paper/gw6-predicted-xi",
    });
  });

  it("takes the origin as given, port and all", () => {
    expect(shareOf(story, "http://localhost:3049").url).toBe("http://localhost:3049/paper/gw6-predicted-xi");
  });
});

describe("articleMetadata", () => {
  it("titles every card with the headline and describes it with the deck", () => {
    const meta = articleMetadata(story, "example.app");
    expect(meta.title).toBe(story.headline);
    expect(meta.description).toBe(story.deck);
    expect(meta.openGraph).toMatchObject({ type: "article", title: story.headline, description: story.deck, url: "/paper/gw6-predicted-xi" });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", title: story.headline, description: story.deck });
  });

  it("resolves the article's address against the production domain", () => {
    const meta = articleMetadata(story, "example.app");
    expect(String(meta.metadataBase)).toBe("https://example.app/");
    expect(meta.alternates?.canonical).toBe("/paper/gw6-predicted-xi");
  });

  it("prints no address without a production domain, never localhost's", () => {
    for (const host of [undefined, ""]) {
      const meta = articleMetadata(story, host);
      expect(meta.metadataBase).toBeUndefined();
      expect(meta.alternates).toBeUndefined();
      expect(meta.openGraph).not.toHaveProperty("url");
    }
  });

  it("leaves out an empty deck rather than describing a card with nothing", () => {
    const meta = articleMetadata({ ...story, deck: "" }, "example.app");
    expect(meta.description).toBeUndefined();
    expect(meta.openGraph?.description).toBeUndefined();
  });

  it("dates the article by its filing", () => {
    expect(articleMetadata(story, undefined).openGraph).toMatchObject({ publishedTime: story.filedAt });
  });
});
