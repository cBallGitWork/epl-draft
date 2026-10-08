import type { Club, LeagueTeam, PublishedStory } from "@epl/core";
import Face from "./Face";
import Calls from "./Calls";
import ColumnistPhoto from "./ColumnistPhoto";
import { columnistOf } from "@/app/config";
import Paragraphs from "./Paragraphs";
import Dateline from "./Dateline";
import { named } from "./named";
import StoryHead, { KICKER } from "./StoryHead";

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

  // A standfirst is not set in columns; it is one when the story's substance is the block below its prose.
  const intro = hasBlockBelow(story);

  // The men named in the rows below, bold in the standfirst too.
  const footballers = (story.extras?.teamNews ?? []).flatMap((row) => (row.men ?? []).map((man) => man.name));
  const portrait = intro && story.face !== undefined && story.face !== null && clubs !== undefined;

  // The opening: chip, headline, deck, rule, dateline, prose; beside a picture, all of it is the left column.
  const opening = (
    <>
      {/* The column's standing title, in the same inverted chip as the lead's kicker. */}
      {story.byline !== "" ? (
        <p>
          <span className={KICKER}>{story.byline}</span>
        </p>
      ) : null}
      <StoryHead headline={story.headline} standfirst={story.deck} rank="article" />

      {/* When and under which edition it was filed; a columnist's banner, as the BBC ran his, carries his credit instead. */}
      <Dateline story={story} turn={false} byline={columnist === null} className="pt-2.5" />
      {columnist !== null ? (
        <div className="mt-3 flex items-center justify-between gap-3 bg-raised pl-3 @xl:pl-4">
          <p className="flex flex-col gap-0.5 font-sans uppercase">
            <span className="text-lg font-bold leading-tight tracking-[0.04em] text-ink @xl:text-2xl">{story.reporter}</span>
            <span className="text-xs tracking-[0.16em] text-muted @xl:text-sm">{columnist.billing}</span>
          </p>
          <ColumnistPhoto photo={{ ...columnist.photo, ...columnist.portrait }} rank="banner" />
        </div>
      ) : null}

      <Paragraphs
        text={story.body}
        dropcap
        names={footballers}
        className={`pt-3 text-base leading-relaxed text-ink ${intro || portrait ? "" : "paper-columns"}`}
      />
    </>
  );

  return (
    <section className="flex flex-col">
      {portrait && story.face ? (
        <div className="grid gap-4 @3xl:grid-cols-[1fr_16rem] @3xl:gap-6">
          <div className="flex min-w-0 flex-col">{opening}</div>
          {/* Capped when stacked, or the portrait fills the sheet's width. */}
          <figure className="order-first max-w-[15rem] @3xl:order-none @3xl:max-w-none @3xl:pt-10">
            <Face face={story.face} clubs={clubs} rank="portrait" />
            <figcaption className="pt-1.5 font-sans text-2xs uppercase tracking-widest text-faint">
              {story.face.name}
            </figcaption>
          </figure>
        </div>
      ) : (
        opening
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
  return extras?.teamNews !== undefined || extras?.ranks !== undefined || extras?.reports !== undefined || extras?.draft !== undefined;
}
