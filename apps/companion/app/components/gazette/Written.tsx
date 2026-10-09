import type { Club, LeagueTeam, PublishedStory } from "@epl/core";
import Face from "./Face";
import Calls from "./Calls";
import ColumnistPhoto from "./ColumnistPhoto";
import { columnistOf } from "@/app/config";
import Paragraphs from "./Paragraphs";
import Dateline from "./Dateline";
import Share from "./Share";
import { named } from "./named";
import StoryHead, { KICKER } from "./StoryHead";
import { CAPTION_CAPS } from "./heads";
import { kickerOf } from "./kickers";

// A filed story as written: headline, plain deck, dateline (it can be days older than the scores) and prose.
// Team names are joined here from the ids the writer returned, so a renamed team never goes stale.

export default function Written({
  story,
  teams,
  clubs,
}: {
  story: PublishedStory;
  teams: readonly LeagueTeam[];
  /** The gameweek's clubs, for the picture's kit and crest; absent prints no picture. */
  clubs?: Map<number, Club>;
}) {
  const nameOf = named(teams);
  const columnist = columnistOf(story);
  const kicker = kickerOf(story);

  // A standfirst is not set in columns; it is one when the story's substance is the block below its prose.
  const intro = hasBlockBelow(story);

  // The men named in the rows below, bold in the standfirst too.
  const footballers = (story.extras?.teamNews ?? []).flatMap((row) => (row.men ?? []).map((man) => man.name));
  const portrait = intro && story.face !== undefined && story.face !== null && clubs !== undefined;

  // The head: kicker, headline, deck, rule, dateline and share; a columnist's banner, as the BBC ran his, carries his credit.
  const head = (
    // A reading measure on a desk: a deck run across the whole sheet is one line too long to read.
    <div className="flex min-w-0 max-w-[42rem] flex-col">
      {kicker !== "" ? (
        <p>
          <span className={KICKER}>{kicker}</span>
        </p>
      ) : null}
      <StoryHead headline={story.headline} standfirst={story.deck} rank="article" />
      <div className="flex items-baseline justify-between gap-3 pt-2.5">
        <Dateline story={story} turn={false} byline={columnist === null} />
        <Share slug={story.slug} headline={story.headline} />
      </div>
      {columnist !== null ? (
        <div className="mt-3 flex items-center justify-between gap-3 bg-raised pl-3 @xl:pl-4">
          <p className="flex flex-col gap-0.5 font-sans uppercase">
            <span className="text-lg font-bold leading-tight tracking-[0.04em] text-ink @xl:text-2xl">{story.reporter}</span>
            <span className="text-xs tracking-[0.16em] text-muted @xl:text-sm">{columnist.billing}</span>
          </p>
          <ColumnistPhoto photo={{ ...columnist.photo, ...columnist.portrait }} rank="banner" />
        </div>
      ) : null}
    </div>
  );

  const prose = (
    <Paragraphs
      text={story.body}
      dropcap
      names={footballers}
      className={`min-w-0 pt-3 text-base leading-relaxed text-ink ${intro || portrait ? "max-w-[42rem]" : "paper-columns"}`}
    />
  );

  return (
    <section className="flex flex-col">
      {portrait && story.face ? (
        // A phone reads head, picture, prose; a desk gives the picture a column of its own beside both.
        <div className="grid gap-x-6 @3xl:grid-cols-[minmax(0,42rem)_16rem] @3xl:grid-rows-[auto_1fr] @3xl:justify-between">
          {head}
          <figure className="pt-4 @3xl:col-start-2 @3xl:row-span-2 @3xl:row-start-1 @3xl:pt-0">
            {/* Cropped to the frame's ratio under a phone's head, his head kept; whole in the desk's column. */}
            <div className="aspect-video overflow-hidden @3xl:aspect-auto">
              <Face face={story.face} clubs={clubs} rank="portrait" />
            </div>
            <figcaption className={`${CAPTION_CAPS} pt-1.5 text-faint`}>
              {story.face.name}
            </figcaption>
          </figure>
          {prose}
        </div>
      ) : (
        <>
          {head}
          {prose}
        </>
      )}

      {story.kind === "predictions" && story.ties !== undefined && story.ties.length > 0 ? (
        <div className="pt-4">
          <Calls ties={story.ties} record={story.extras?.record} named={nameOf} clubs={clubs} />
        </div>
      ) : null}
    </section>
  );
}

/** Whether the article's substance is the block below its prose, so the prose above is an introduction. */
function hasBlockBelow(story: PublishedStory): boolean {
  const extras = story.extras;
  const ties = story.kind === "predictions" && (story.ties?.length ?? 0) > 0;
  return ties || extras?.teamNews !== undefined || extras?.ranks !== undefined || extras?.reports !== undefined || extras?.draft !== undefined;
}
