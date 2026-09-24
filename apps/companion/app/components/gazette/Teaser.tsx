import TurnLink from "./TurnLink";
import StoryFace, { hasPicture } from "./StoryFace";
import Dateline from "./Dateline";
import type { Club, PublishedStory } from "@epl/core";
import { KICKER } from "./kickers";
import { storyHref } from "./paperPages";

// A shoulder: the headline of a story at the second rank, and where to turn for
// the article.
//
// **A front page prints headlines and no articles at all**, so the three ranks
// on it are three sizes of headline: the `Splash` above, two of these, and a
// column of `Brief`s below. A shoulder is a headline, a deck and a line saying
// where it continues; a brief drops the deck and the dateline and keeps the
// folio number. The page runs two of these side by side, which is why the
// headline is set a step down from the measure it had when eight of them ran
// stacked at full width.
//
// The inside pages (`/paper/reports`, `/paper/columns`) use it too, under the
// one article each of those prints whole — which is the grammar the front page
// had until 3 Sep and an INSIDE page keeps, because an inside page is where an
// article goes.
//
// It was `Article`, and it opened in place: a `<details>` that unfolded the
// whole column where it stood, because the Gazetta was one route and there was
// nowhere to send a reader. That changed on 2 Sep — the paper has pages now
// (`pages.ts`), so "read on" stops being a disclosure and becomes what a paper
// actually prints. The name went with the behaviour: this teases, it does not
// contain.
//
// Still no client component and still one tap. A `<TurnLink>` is keyboard-operable
// and announced for free, exactly as `<details>` was.

export default function Teaser({
  story,
  clubs,
  pictured = false,
  here,
}: {
  story: PublishedStory;
  /** The round's clubs, for the picture. Empty is ordinary and costs the card
   *  its kit, not its headline. */
  clubs: Map<number, Club>;
  /** Whether this row of shoulders is running pictures.
   *
   *  **Twin shoulders carry pictures together or not at all**, which is why the
   *  caller decides and not the story. One card with a band and one without
   *  starts their two headlines at different heights, and a pair of seconds
   *  that do not line up reads as a fault rather than as a rank — the whole
   *  point of running them abreast is that they are equals. A kind with no man
   *  in it (a power ranking is about ten managers) therefore stands the other
   *  one's picture down too. The inside pages run a single column and pass
   *  nothing, so a teaser there is text, as it was. */
  pictured?: boolean;
  /** The section page this teaser is standing on, so its dateline does not tell
   *  a reader to turn to the page he is reading. */
  here?: string;
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
        <Dateline story={story} as="span" byline={false} here={here} />
      </TurnLink>
    </article>
  );
}

