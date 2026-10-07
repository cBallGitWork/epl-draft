import type { Club, LeagueTeam, PublishedStory } from "@epl/core";
import Face from "./Face";
import Calls from "./Calls";
import ColumnistPhoto from "./ColumnistPhoto";
import { columnistOf } from "@/app/config";
import Paragraphs from "./Paragraphs";
import Dateline from "./Dateline";
import { named } from "./named";

// The written lead, as filed.
//
// Everything else on the front page is computed from facts that update every
// thirty seconds. This is the one part somebody wrote, and it reads differently
// on purpose: a headline with wordplay in it, a deck saying the same thing
// plainly underneath so the joke is never the only thing telling you what
// happened, and paragraphs.
//
// **The byline and the filing time are not decoration.** A reader is entitled to
// know that this part of the paper is older than the numbers above it, and by
// how much — the rolling paper prints its most recent edition until the next
// one, so this can be days old and still be current, including under a moving
// scoreboard. The dateline is what makes that honest.
//
// Team names are joined here, from ids the writer returned. He is given both and
// told to return the id, because a name typed by a model is a name that goes
// stale the day somebody renames their team — and renaming your team is the
// first thing sixteen people do.

export default function Written({
  story,
  teams,
  clubs,
}: {
  story: PublishedStory;
  teams: readonly LeagueTeam[];
  /** The round's clubs, for the picture's kit and crest. Absent prints no
   *  picture rather than a wrong one. */
  clubs?: Map<number, Club>;
}) {
  const nameOf = named(teams);
  const columnist = columnistOf(story);

  // **A standfirst is not columnised.** `paper-columns` takes a measure rather
  // than a count, which is right for a whole article and wrong for an intro:
  // three sentences split into three 17rem columns is a shape no paper prints,
  // and it left the width a picture wanted. Craig, 18 Sep 2026 — "on desktop,
  // two columns seems weird, space for photo".
  //
  // Length cannot tell the two apart — a 666-character tie-report is a whole
  // piece and a 720-character Team Sheet is its standfirst. What tells them
  // apart is whether the ARTICLE is below: a story carrying team news or a
  // ranking has its substance in that block, and the prose above it is an
  // introduction.
  const intro = hasBlockBelow(story);

  // The men named below, so the standfirst sets them in bold too — Craig, 18 Sep
  // 2026: "bold players in the whole article". They come off the rows rather
  // than out of the prose, so only a name the desk filed can be emboldened.
  const footballers = (story.extras?.teamNews ?? []).flatMap((row) => (row.men ?? []).map((man) => man.name));
  const portrait = intro && story.face !== undefined && story.face !== null && clubs !== undefined;

  // The opening: chip, headline, deck, rule, dateline, prose. When a picture
  // runs beside it, ALL of that is the left column rather than the prose alone —
  // a 20rem portrait against three sentences left a hole the height of the
  // picture between the standfirst and the first club. Craig, 18 Sep 2026:
  // "remove the big gap between chelsea and the above paragraph".
  const opening = (
    <>
      {/* The column runs under its standing title, the way a column does, and
          the title is a tag rather than a line on a rule — the same inverted ink
          chip the lead's kicker wears, because they are the same object. */}
      {story.byline !== "" ? (
        <p>
          <span className="inline-block bg-ink px-2 py-1 font-sans text-2xs font-bold uppercase tracking-[0.15em] text-bg">
            {story.byline}
          </span>
        </p>
      ) : null}

      <h2 className="paper-display text-balance pt-2.5 text-4xl font-black leading-[1.02] text-ink @3xl:text-5xl">
        {story.headline}
      </h2>
      {story.deck ? (
        <p className="pt-2 text-lg italic leading-snug text-muted">{story.deck}</p>
      ) : null}

      <span className="mt-3 block h-px w-6 bg-ink" />

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
          {/* Capped, because stacked it has the whole page to fill and a
              portrait the width of the sheet is a jaw, not a picture. */}
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
