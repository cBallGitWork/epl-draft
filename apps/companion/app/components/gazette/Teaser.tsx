import TurnLink from "./TurnLink";
import StoryFace, { hasPicture } from "./StoryFace";
import Dateline from "./Dateline";
import type { Club, PublishedStory } from "@epl/core";
import { KICKER } from "./kickers";
import { storyHref } from "./paperPages";

// A shoulder: a story at the second rank, as a card: picture, standing head, headline, deck and
// dateline. Two abreast under the splash on a phone; on a desk, the column beside the lead.

export default function Teaser({
  story,
  clubs,
  pictured,
}: {
  story: PublishedStory;
  /** The gameweek's clubs, for the picture. Empty is ordinary and costs the
   *  card its kit, not its headline. */
  clubs: Map<number, Club>;
  /** Whether this row of shoulders runs pictures: twin shoulders carry them together or not at all,
   *  so the caller decides and not the story. */
  pictured: boolean;
}) {
  const kicker = KICKER[story.kind];

  return (
    <article id={story.slug} className="scroll-mt-4 border-t border-line pt-3">
      <TurnLink href={storyHref(story.slug)} className="flex min-h-11 flex-col justify-center gap-1">
        {pictured && hasPicture(story) ? (
          <span className="-mt-3 mb-1 block">
            <StoryFace story={story} clubs={clubs} rank="card" />
          </span>
        ) : null}
        {/* Ink, not the accent: the sheet's one red is spent on what is live and what is yours. */}
        {kicker !== undefined ? (
          <span className="font-sans text-3xs font-bold uppercase tracking-[0.16em] text-ink">
            {kicker}
          </span>
        ) : null}
        <h3 className="paper-display text-balance text-xl font-black leading-[1.08] text-ink @md/stories:text-2xl">
          {story.headline}
        </h3>
        {story.deck !== "" ? (
          <p className="text-sm italic leading-snug text-muted">{story.deck}</p>
        ) : null}
        <Dateline story={story} as="span" byline={false} />
      </TurnLink>
    </article>
  );
}
