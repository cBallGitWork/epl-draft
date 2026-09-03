import TurnLink from "./TurnLink";
import type { PublishedStory } from "@epl/core";
import { londonDayAndTime } from "../../londonTime";
import { KICKER } from "./kickers";
import { pageOf } from "./paperPages";

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

export default function Teaser({ story }: { story: PublishedStory }) {
  const kicker = KICKER[story.kind];
  const page = pageOf(story.kind);

  return (
    <article id={story.slug} className="scroll-mt-4 border-t border-line pt-3">
      <TurnLink href={`/paper/${story.slug}`} className="flex min-h-11 flex-col justify-center gap-1">
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
        <span className="font-sans text-3xs uppercase tracking-[0.16em] text-faint">
          {story.edition !== "" ? `${story.edition} · ` : ""}
          Filed {londonDayAndTime(story.filedAt)}
          {/* The affordance, in words rather than a chevron, and now literally
              true: a paper says "turn to page four" and this one can. A kind
              with no page of its own still has an article behind it, so it
              says so without naming a page it does not have. */}
          <span className="text-muted">
            {page === null ? " · read on" : ` · turn to page ${page.number}`}
          </span>
        </span>
      </TurnLink>
    </article>
  );
}
