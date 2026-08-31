import type { PublishedStory, StoryKind } from "@epl/core";
import { londonDayAndTime } from "../../londonTime";
import Paragraphs from "./Paragraphs";

// A story under the lead: the headline, and the article behind it.
//
// **A front page prints one article and headlines the rest.** This one used to
// print every filed story in full, stacked down the page, which is a magazine
// rather than a paper — so the lead runs whole (`Written`) and everything else
// is set as a headline that opens where it stands.
//
// Opening in place rather than on another page, because the Gazetta is ONE
// page — inside pages were built and reverted, and DESIGN §9 already records
// expanding in place as the mobile pattern here. `<details>` does it with no
// client component and no state: it is keyboard-operable and screen-reader
// announced for free, and a story stays addressable while closed.

/** The kicker each kind runs under. Copy, and a kind missing here prints no
 *  kicker rather than a wrong one. */
const KICKER: Partial<Record<StoryKind, string>> = {
  "round-preview": "The preview",
  "round-report": "The report",
  "match-report": "Match report",
  "fixture-preview": "Tonight",
  "tie-call": "The call",
  "tie-report": "Tie by tie",
  predictions: "Predictions",
  eleven: "Team of the week",
  "power-ranking": "Power rankings",
  wire: "The bin",
  dodgers: "Points dodgers",
  presser: "The press room",
  studio: "The studio",
  news: "News",
  table: "The table",
  numbers: "The numbers",
};

export default function Article({ story }: { story: PublishedStory }) {
  const kicker = KICKER[story.kind];

  return (
    <details id={story.slug} className="group scroll-mt-4 border-t border-line pt-3">
      {/* `list-none` on both the element and the WebKit pseudo: Safari draws
          its own triangle from a separate rule, and half a fix is a triangle
          on iPhones only. */}
      <summary className="flex min-h-11 cursor-pointer list-none flex-col justify-center gap-1 [&::-webkit-details-marker]:hidden">
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
        <h3 className="paper-display text-balance text-xl font-black leading-[1.08] text-ink">
          {story.headline}
        </h3>
        {story.deck !== "" ? (
          <p className="text-sm italic leading-snug text-muted">{story.deck}</p>
        ) : null}
        <span className="font-sans text-3xs uppercase tracking-[0.16em] text-faint">
          {story.edition !== "" ? `${story.edition} · ` : ""}
          Filed {londonDayAndTime(story.filedAt)}
          {/* The affordance, in words rather than a chevron: a paper says
              "turn to page four", and this is the same promise kept on one
              page. It flips on open, so the control never lies about what it
              will do next. */}
          <span className="text-muted"> · read on</span>
          <span className="hidden text-muted group-open:inline"> ▴</span>
          <span className="text-muted group-open:hidden"> ▾</span>
        </span>
      </summary>
      <Paragraphs text={story.body} className="pt-2.5 text-sm leading-relaxed text-ink" />
    </details>
  );
}
