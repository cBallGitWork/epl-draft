import TurnLink from "./TurnLink";
import Dateline from "./Dateline";
import type { PublishedStory } from "@epl/core";

// The splash: the top story on the front page, as a front page carries it.
//
// **The front page prints headlines and no articles at all**, which reverses
// the rule this file's predecessor was built on. Until 3 Sep 2026 the lead ran
// WHOLE here — byline, headline, deck, two columns of prose and the tie-by-tie
// block — on the argument that a paper prints one article and headlines the
// rest. The argument was right about a broadsheet and wrong about the object
// this actually is: the whole column pushed the second story roughly nineteen
// hundred pixels down a phone, so the sheet's other two ranks were furniture
// nobody reached. A front page's job is to make you choose what to read, and it
// cannot do that while the first choice is already being read to you.
//
// So this is the same block `Written` opens with, minus the prose, plus the
// affordance: it turns to the article. `Written` still prints it whole at
// `/paper/{slug}`, which is where an article goes.
//
// The byline chip, the ornament rule and the dateline are all deliberate
// carry-overs — a reader is entitled to know this part of the paper was written
// by somebody and may be days older than the numbers above it, and that is as
// true of a headline as of a column.

export default function Splash({ story }: { story: PublishedStory }) {

  return (
    <section className="flex flex-col">
      <TurnLink href={`/paper/${story.slug}`} className="flex flex-col">
        {story.byline !== "" ? (
          <p>
            <span className="inline-block bg-ink px-2 py-1 font-sans text-2xs font-bold uppercase tracking-[0.15em] text-bg">
              {story.byline}
            </span>
          </p>
        ) : null}

        <h2 className="paper-display text-balance pt-2.5 text-4xl font-black leading-[1.02] text-ink @3xl:text-6xl">
          {story.headline}
        </h2>
        {story.deck ? (
          <p className="pt-2 text-lg italic leading-snug text-muted">{story.deck}</p>
        ) : null}

        <span className="mt-3 block h-px w-6 bg-ink" />

        <Dateline story={story} className="pt-2.5" />
      </TurnLink>
    </section>
  );
}
