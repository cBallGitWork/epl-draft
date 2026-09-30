import TurnLink from "./TurnLink";
import StoryFace, { hasPicture } from "./StoryFace";
import Dateline from "./Dateline";
import type { Club, PublishedStory } from "@epl/core";
import { KICKER } from "./kickers";
import { storyHref } from "./paperPages";

// A shoulder: a story at the second rank, two abreast under the `Splash` and above the `Brief`s.
// A headline, a deck and a dateline that says "read on"; one tap to the article at `/paper/{slug}`.

export default function Teaser({
  story,
  clubs,
  pictured,
}: {
  story: PublishedStory;
  /** The round's clubs, for the picture. Empty is ordinary and costs the card
   *  its kit, not its headline. */
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
            <StoryFace story={story} clubs={clubs} rank="shoulder" />
          </span>
        ) : null}
        {/* Ink, not the accent. The sheet's one red is spent on what is live
            and on what is yours; a kicker over every headline would put four
            or five red marks down the page, which is what DESIGN §4 records as
            having made this front page read as a themed screen rather than as
            newsprint. Rank here is set in scale and weight. */}
        {kicker !== undefined ? (
          <span className="font-sans text-3xs font-bold uppercase tracking-[0.16em] text-ink">
            {kicker}
          </span>
        ) : null}
        <h3 className="paper-display text-balance text-xl font-black leading-[1.08] text-ink @3xl:text-2xl">
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

