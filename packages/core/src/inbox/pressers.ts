import type { PublishedStory } from "../gazette/story";
import type { InboxItem } from "./types";

// The Team Sheet in the mail: one letter per conference day's column, which points at the paper rather than retelling it.

/** A letter per filed Team Sheet column: its headline and deck, and the way to the column. */
export function presserNews(stories: readonly PublishedStory[], href: (slug: string) => string): InboxItem[] {
  return stories
    .filter((story) => story.kind === "presser")
    .map((story) => ({
      id: `presser:${story.slug}`,
      category: "message" as const,
      at: story.filedAt,
      gameweek: story.gameweek,
      headline: story.headline,
      body: story.deck,
      from: story.byline,
      about: null,
      teamId: null,
      mark: null,
      urgent: false,
      link: { href: href(story.slug), label: "Read the Team Sheet" },
    }));
}
