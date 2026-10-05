import type { PublishedStory } from "@epl/core";
import { columnistOf } from "./config";

/** The picture a shared link previews with: the story's drawing, else its columnist's photograph. */
export function sharePicture(story: Pick<PublishedStory, "image" | "reporter">): { url: string; alt: string } | null {
  if (story.image) return { url: story.image.src, alt: story.image.alt };
  const photo = columnistOf(story)?.photo;
  return photo ? { url: photo.src, alt: photo.alt } : null;
}
