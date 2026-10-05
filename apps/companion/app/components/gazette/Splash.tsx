import TurnLink from "./TurnLink";
import Dateline from "./Dateline";
import type { PublishedStory } from "@epl/core";
import { storyHref } from "./paperPages";

// The splash: the top story as the front page carries it, a headline and no article. `Written`'s
// opening block minus the prose, turning to the article at `/paper/{slug}`.

export default function Splash({ story }: { story: PublishedStory }) {

  return (
    <section className="flex flex-col">
      <TurnLink href={storyHref(story.slug)} className="flex flex-col">
        {story.byline !== "" ? (
          <p>
            <span className="inline-block bg-ink px-2 py-1 font-sans text-2xs font-bold uppercase tracking-[0.15em] text-bg">
              {story.byline}
            </span>
          </p>
        ) : null}

        <h2 className="paper-display text-balance pt-2.5 text-4xl font-black leading-[1.02] text-ink @md/stories:text-6xl">
          {story.headline}
        </h2>
        {story.deck ? (
          <p className="pt-2 text-lg italic leading-snug text-muted">{story.deck}</p>
        ) : null}

        <span className="mt-3 block h-px w-6 bg-ink" />

        <Dateline story={story} byline className="pt-2.5" />
      </TurnLink>
    </section>
  );
}
