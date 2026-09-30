import TurnLink from "./TurnLink";
import StoryFace from "./StoryFace";
import type { Club, PublishedStory } from "@epl/core";
import { KICKER } from "./kickers";
import { storyHref } from "./paperPages";

// A story in the tail: a thumbnail, the standing head and the headline, the sheet's third rank.
// No deck and no dateline, which is what a shoulder has and this does not: the hierarchy is the design.

export default function Brief({
  story,
  clubs,
}: {
  story: PublishedStory;
  clubs: Map<number, Club>;
}) {
  const kicker = KICKER[story.kind];

  return (
    <li id={story.slug} className="scroll-mt-4 border-t border-line">
      {/* Thumbnail at the left, headline at the right — the shape a paper's
          news-in-brief column has and the shape a news app's list has, for the
          same reason: at this size a picture is an identifier, not a picture. */}
      <TurnLink href={storyHref(story.slug)} className="flex min-h-11 items-center gap-3 py-2">
        <StoryFace story={story} clubs={clubs} rank="brief" />
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          {kicker !== undefined ? (
            <span className="font-sans text-3xs font-bold uppercase tracking-[0.16em] text-muted">{kicker}</span>
          ) : null}
          <h3 className="paper-display text-pretty text-base font-bold leading-snug text-ink">
            {story.headline}
          </h3>
        </span>
      </TurnLink>
    </li>
  );
}
