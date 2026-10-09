import type { PublishedStory } from "@epl/core";

/** The one name a story runs under at every rank: its column's, else its edition's; empty prints none. */
export function kickerOf(story: Pick<PublishedStory, "byline" | "edition">): string {
  return story.byline !== "" ? story.byline : story.edition;
}
