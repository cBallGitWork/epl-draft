import type { Club, Story } from "@epl/core";
import Picture from "./Picture";
import { written } from "./sentences";

// The paper's stories at their two sizes: the lead, and the headlines that run
// under it.
//
// The lead is the only thing on the page set to be read from across a room. The
// others are headlines and nothing else — a kicker and a line, no picture, no
// standfirst — because a front page that gave every story a photograph would be
// a page with no lead on it.
//
// Nothing here decides which story is the biggest. `gazette/stories.ts` ranks
// them, `sentences.ts` writes the words, and this decides how loudly they are
// set.
//
// Unmarked when it is about the reader's own team, and that is a choice: the
// accent is a reading aid for scanning a list of sixteen, and there is nothing
// to scan here. A manager knows his own name in a headline.

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
      {/* The kicker is a tag, printed the way a paper prints one: the page's own
          ink as a ground and the page's own stock as the letters, 14.2:1 either
          way round. Deliberately not a colour plate — it is drawn in the two
          colours the sheet already has, so nothing inside it needs the desk's
          tokens back. */}
      <p className="mt-3 text-center">
        <span className="inline-block bg-ink px-2 py-1 font-sans text-2xs font-bold uppercase tracking-[0.15em] text-bg">
          {kicker}
        </span>
      </p>
      <h2 className="paper-display text-balance pt-2.5 text-center text-4xl font-black leading-[1.02] text-ink">
        {headline}
      </h2>
      <p className="pt-2 text-center text-lg italic leading-snug text-muted">{standfirst}</p>
      {/* The ornament: a 24px hairline, centred, closing the display block
          before the prose or the next column starts. A paper's smallest piece of
          furniture and the one that says "this heading is finished". */}
      <span className="mx-auto mt-3 h-px w-6 bg-ink" />
    </section>
  );
}

/** A story that is not the lead: kicker, one line, and a rule under it.
 *
 *  Same facts, same words, a tenth of the room. The hierarchy IS the design —
 *  a newspaper's second story is recognisable as the second story before you
 *  have read a word of it. */
export function Headline({
  story,
  who,
}: {
  story: Story;
  who: (teamId: string | null) => string;
}) {
  const { kicker, headline } = written(story, who);

  return (
    <li className="border-b border-line py-2.5 last:border-b-0">
      {/* The same tag as the lead's, a size down. It was `faint` type on no
          ground, which is the one thing a kicker must not be — a kicker is a
          label and a label has an edge. */}
      <p>
        <span className="inline-block bg-ink px-1.5 py-0.5 font-sans text-3xs font-bold uppercase tracking-[0.15em] text-bg">
          {kicker}
        </span>
      </p>
      <p className="paper-display text-balance pt-2 text-xl font-bold leading-tight text-ink">
        {headline}
      </p>
    </li>
  );
}
