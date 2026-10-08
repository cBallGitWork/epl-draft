import { describe, expect, it } from "vitest";
import type { PublishedStory } from "../gazette/story";
import { presserNews } from "./pressers";

const href = (slug: string) => `/paper/${slug}`;

function story(over: Partial<PublishedStory>): PublishedStory {
  return {
    slug: "gw6-presser-2026-10-08",
    kind: "presser",
    leagueId: "real",
    period: 6,
    gameweek: 6,
    filedAt: "2026-10-08T17:00:00.000Z",
    expiresAt: null,
    edition: "The Team Sheet",
    byline: "The Team Sheet",
    headline: "Thursday Pressers",
    deck: "Daniel James a doubt for Leeds United with a back problem",
    body: "Leeds United. Daniel James has a back problem.",
    subjects: ["presser:gw6:2026-10-08"],
    image: null,
    face: null,
    ...over,
  };
}

describe("presserNews", () => {
  it("writes one letter per Team Sheet column, from the column, pointing at it", () => {
    expect(presserNews([story({})], href)).toEqual([
      {
        id: "presser:gw6-presser-2026-10-08",
        category: "message",
        at: "2026-10-08T17:00:00.000Z",
        gameweek: 6,
        headline: "Thursday Pressers",
        body: "Daniel James a doubt for Leeds United with a back problem",
        from: "The Team Sheet",
        about: null,
        teamId: null,
        mark: null,
        urgent: false,
        link: { href: "/paper/gw6-presser-2026-10-08", label: "Read the article" },
      },
    ]);
  });

  it("keeps each conference day's column, and nothing else the paper filed", () => {
    const friday = story({ slug: "gw6-presser-2026-10-09", headline: "Friday Pressers" });
    const lawro = story({ slug: "gw6-predictions", kind: "predictions" });
    expect(presserNews([story({}), lawro, friday], href).map((item) => item.id)).toEqual([
      "presser:gw6-presser-2026-10-08",
      "presser:gw6-presser-2026-10-09",
    ]);
  });
});
