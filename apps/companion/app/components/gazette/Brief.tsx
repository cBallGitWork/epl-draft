import TurnLink from "./TurnLink";
import StoryFace, { hasPicture } from "./StoryFace";
import Dateline from "./Dateline";
import type { Club, PublishedStory } from "@epl/core";
import { kickerOf } from "./kickers";
import { storyHref } from "./paperPages";
import { KICKER_CAPS } from "./heads";

// A story in the tail, the sheet's third rank. On a phone, a row: thumbnail, standing head, headline.
// On a desk, a card in the grid: the same picture full width over the headline, and its dateline.

export default function Brief({
  story,
  clubs,
}: {
  story: PublishedStory;
  clubs: Map<number, Club>;
}) {
  const kicker = kickerOf(story);

  return (
    <li id={story.slug} className="scroll-mt-4 border-t border-line @md/stories:pt-3">
      <TurnLink
        href={storyHref(story.slug)}
        className="flex min-h-11 items-center gap-3 py-2 @md/stories:flex-col @md/stories:items-stretch @md/stories:gap-1 @md/stories:py-0"
      >
        {hasPicture(story) ? (
          <span className="block w-24 shrink-0 @md/stories:-mt-3 @md/stories:mb-1 @md/stories:w-full">
            <StoryFace story={story} clubs={clubs} rank="card" />
          </span>
        ) : null}
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 @md/stories:gap-1">
          {kicker !== "" ? (
            <span className={`${KICKER_CAPS} text-muted`}>{kicker}</span>
          ) : null}
          <h3 className="paper-display text-pretty text-base font-bold leading-snug text-ink @md/stories:text-lg">
            {story.headline}
          </h3>
          {/* No dateline in a phone's row, which is what keeps the third rank visibly third there. */}
          <Dateline story={story} as="span" byline={false} className="hidden @md/stories:block" />
        </span>
      </TurnLink>
    </li>
  );
}
