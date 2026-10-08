import TurnLink from "./TurnLink";
import Dateline from "./Dateline";
import type { PublishedStory } from "@epl/core";
import { storyHref } from "./paperPages";
import StoryHead, { KICKER } from "./StoryHead";

// The splash: the top story as the front page carries it, a headline and no article. `Written`'s
// opening block minus the prose, turning to the article at `/paper/{slug}`.

export default function Splash({ story }: { story: PublishedStory }) {
  return (
    <section className="flex flex-col">
      <TurnLink href={storyHref(story.slug)} className="flex flex-col">
        {story.byline !== "" ? (
          <p>
            <span className={KICKER}>{story.byline}</span>
          </p>
        ) : null}
        <StoryHead headline={story.headline} standfirst={story.deck} rank="front" />
        <Dateline story={story} byline className="pt-2.5" />
      </TurnLink>
    </section>
  );
}
