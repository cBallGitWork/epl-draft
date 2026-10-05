import type { PublishedStory } from "@epl/core";
import { columnistOf } from "./config";

/** The picture a shared link's card carries: the story's drawing, else its columnist's own crop. */
export function sharePicture(story: Pick<PublishedStory, "image" | "reporter">): string | null {
  return story.image?.src ?? columnistOf(story)?.card ?? null;
}
