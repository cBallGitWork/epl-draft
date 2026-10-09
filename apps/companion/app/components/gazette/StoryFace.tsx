import { type Club, type PublishedStory, writerOf } from "@epl/core";
import { columnistOf } from "@/app/config";
import Face from "./Face";
import ColumnistPhoto from "./ColumnistPhoto";
import HereWeGo from "./HereWeGo";

// A story's own picture: the man it is about (a trade's on its Here We Go plate), else its columnist's photograph, else
// nothing.

type Rank = "splash" | "card" | "portrait";

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
  const transfer = story.kind === "trade" ? story.extras?.transfer : undefined;
  return story.face && transfer ? (
    <HereWeGo face={story.face} transfer={transfer} credit={writerOf(story)} clubs={clubs} rank={rank} />
  ) : story.face ? (
    <Face face={story.face} clubs={clubs} rank={rank} />
  ) : columnist && rank !== "portrait" ? (
    <ColumnistPhoto photo={columnist.photo} rank={rank} />
  ) : null;
}
