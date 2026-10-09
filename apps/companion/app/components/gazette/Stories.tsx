import type { Club, Story } from "@epl/core";
import Picture from "./Picture";
import { written } from "./sentences";
import StoryHead, { KICKER } from "./StoryHead";

// The desk's own lead, when nothing has been filed: its picture, kicker, headline and standfirst.
// `gazette/stories.ts` ranks the stories and `sentences.ts` writes the words.

export default function Lead({
  lead,
  who,
  clubs,
}: {
  lead: Story;
  who: (teamId: string | null) => string;
  /** The gameweek's clubs, keyed by FPL id, for the one story that has a face in
   *  it. Empty is ordinary and costs the cut-out its kit, not the lead. */
  clubs: Map<number, Club>;
}) {
  const { kicker, headline, standfirst } = written(lead, who);

  return (
    <section className="flex flex-col">
      <Picture lead={lead} who={who} clubs={clubs} />
      <p className="mt-3">
        <span className={KICKER}>{kicker}</span>
      </p>
      <StoryHead headline={headline} standfirst={standfirst} rank="front" />
    </section>
  );
}
