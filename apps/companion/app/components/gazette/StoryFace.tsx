import type { Club, PublishedStory } from "@epl/core";
import { columnistOf } from "@/app/config";
import Face from "./Face";
import ColumnistPhoto from "./ColumnistPhoto";

// A story's own picture: the man it is about, else its columnist's photograph, else nothing.

type Rank = "splash" | "card";

/** Whether a story has a picture of its own to print. */
export function hasPicture(story: PublishedStory): boolean {
  return story.face !== null || columnistOf(story) !== null;
}

export default function StoryFace({
  story,
  clubs,
  rank,
}: {
  story: PublishedStory;
  clubs: Map<number, Club>;
  rank: Rank;
}) {
  const columnist = columnistOf(story);
  return story.face ? (
    <Face face={story.face} clubs={clubs} rank={rank} />
  ) : columnist ? (
    <ColumnistPhoto photo={columnist.photo} rank={rank} />
  ) : null;
}
