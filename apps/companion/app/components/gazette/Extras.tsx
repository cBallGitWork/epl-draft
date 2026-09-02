import type { PublishedStory } from "@epl/core";
import Captions from "./Captions";
import Quiz from "./Quiz";
import Quotes from "./Quotes";
import Ranks from "./Ranks";

// What a column filed BESIDE its prose, by kind.
//
// Lifted out of `Teaser` when the article page arrived: the same switch now has
// two parents, which is a relocation rather than a new abstraction. A kind that
// carries none of it renders none of it — every one of these returns null on an
// empty list, so a story is never followed by an empty heading.

export default function Extras({
  story,
  named,
  mine,
}: {
  story: PublishedStory;
  named: (teamId: string) => string;
  mine: string | null;
}) {
  if (story.kind === "power-ranking") return <Ranks story={story} named={named} mine={mine} />;
  if (story.kind === "eleven") return <Captions story={story} />;
  if (story.kind === "presser") {
    return <Quotes story={story} label="Staged for the paper — nobody said any of this" />;
  }
  if (story.kind === "studio") return <Quotes story={story} label="A sketch — nobody said any of this" />;
  if (story.kind === "wire") return <Quiz story={story} />;
  return null;
}
