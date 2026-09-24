import TurnLink from "./TurnLink";
import Face from "./Face";
import ColumnistPhoto from "./ColumnistPhoto";
import { columnistOf } from "@/app/config";
import type { Club, PublishedStory } from "@epl/core";
import { KICKER } from "./kickers";
import { pageOf, storyHref } from "./paperPages";

// A story in the tail: the standing head, the headline, and the page it is on.
//
// The third rank on the sheet, under the lead and the two shoulders. A brief
// carries no deck and no dateline — those are what a shoulder has and this does
// not, and the difference is the whole point. **The hierarchy is the design**:
// a reader must be able to see which story is third before reading a word of
// it, which a column of eight identical teasers made impossible.
//
// The page number is ranged right as a folio reference rather than spelled out
// — "turn to page 2" five times down one column is a paper nagging. A kind with
// no page of its own prints nothing there and is read on the front page.

export default function Brief({
  story,
  clubs,
}: {
  story: PublishedStory;
  clubs: Map<number, Club>;
}) {
  const kicker = KICKER[story.kind];
  const page = pageOf(story.kind);
  const columnist = columnistOf(story);

  return (
    <li id={story.slug} className="scroll-mt-4 border-t border-line">
      {/* Thumbnail at the left, headline at the right — the shape a paper's
          news-in-brief column has and the shape a news app's list has, for the
          same reason: at this size a picture is an identifier, not a picture. */}
      <TurnLink href={storyHref(story.slug)} className="flex min-h-11 items-center gap-3 py-2">
        {story.face ? (
          <Face face={story.face} clubs={clubs} rank="brief" />
        ) : columnist ? (
          <ColumnistPhoto photo={columnist.photo} rank="brief" />
        ) : null}
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
          <span className="flex items-baseline justify-between gap-3 font-sans text-3xs uppercase tracking-[0.16em]">
            {kicker !== undefined ? <span className="font-bold text-muted">{kicker}</span> : <span />}
            {page !== null ? <span className="numeric shrink-0 text-faint">p{page.number}</span> : null}
          </span>
          <h3 className="paper-display text-pretty text-base font-bold leading-snug text-ink">
            {story.headline}
          </h3>
        </span>
      </TurnLink>
    </li>
  );
}
