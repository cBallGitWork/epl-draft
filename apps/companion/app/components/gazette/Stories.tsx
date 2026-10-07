import type { Club, Story } from "@epl/core";
import Picture from "./Picture";
import { written } from "./sentences";

// The desk's own lead, when nothing has been filed: its picture, kicker, headline and standfirst.
// `gazette/stories.ts` ranks the stories and `sentences.ts` writes the words.

export default function Lead({
  lead,
  who,
  clubs,
}: {
  lead: Story;
  who: (teamId: string | null) => string;
  /** The round's clubs, keyed by FPL id, for the one story that has a face in
   *  it. Empty is ordinary and costs the cut-out its kit, not the lead. */
  clubs: Map<number, Club>;
}) {
  const { kicker, headline, standfirst } = written(lead, who);

  return (
    <section className="flex flex-col">
      <Picture lead={lead} who={who} clubs={clubs} />
      {/* The kicker: stock on an ink ground, 14.2:1, in the sheet's own two colours. */}
      <p className="mt-3">
        <span className="inline-block bg-ink px-2 py-1 font-sans text-2xs font-bold uppercase tracking-[0.15em] text-bg">
          {kicker}
        </span>
      </p>
      <h2 className="paper-display text-balance pt-2.5 text-4xl font-black leading-[1.02] text-ink @md/stories:text-6xl">
        {headline}
      </h2>
      <p className="pt-2 text-lg italic leading-snug text-muted">{standfirst}</p>
      {/* A 24px hairline closing the display block, ranged left with it. */}
      <span className="mt-3 block h-px w-6 bg-ink" />
    </section>
  );
}
