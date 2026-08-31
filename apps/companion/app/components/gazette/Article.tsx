import type { PublishedStory, StoryKind } from "@epl/core";
import { londonDayAndTime } from "../../londonTime";
import Paragraphs from "./Paragraphs";

// A filed story below the lead: the front page continuing down the sheet.
//
// The paper is ONE page — the Gazetta is a section of this app, not a site
// inside it — so everything filed prints here, in the hierarchy a front page
// uses: the lead set to be read across a room, and the rest under it at a size
// that reads as the second story before you have read a word.

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
};

export default function Article({ story }: { story: PublishedStory }) {
  const kicker = KICKER[story.kind];

  return (
    <article className="flex flex-col">
      {kicker !== undefined ? (
        <p>
          <span className="inline-block bg-ink px-2 py-1 font-sans text-2xs font-bold uppercase tracking-[0.15em] text-bg">
            {kicker}
          </span>
        </p>
      ) : null}
      <h2 className="paper-display text-balance pt-2 text-2xl font-black leading-[1.05] text-ink">
        {story.headline}
      </h2>
      {story.deck !== "" ? (
        <p className="pt-1.5 text-base italic leading-snug text-muted">{story.deck}</p>
      ) : null}
      <p className="pt-1.5 font-sans text-3xs uppercase tracking-[0.16em] text-faint">
        {story.edition !== "" ? `${story.edition} · ` : ""}Filed {londonDayAndTime(story.filedAt)}
      </p>
      <Paragraphs text={story.body} className="pt-2.5 text-sm leading-relaxed text-ink" />
    </article>
  );
}
