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
      <p className="mt-3 border-b border-league/40 pb-1 font-display text-xs font-bold uppercase tracking-widest text-cream">
        {kicker}
      </p>
      <h2 className="text-balance pt-2.5 font-display text-3xl font-bold leading-[1.02] tracking-tight text-cream">
        {headline}
      </h2>
      <p className="pt-1.5 text-sm leading-snug text-muted">{standfirst}</p>
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
      {/* `faint` and not the league register: `league-dark` is a ground colour
          and sits at about 2:1 on the page, which is under the 4.5:1 PRODUCT.md
          sets for text. The red belongs to rules and chrome here, not to type
          this small. */}
      <p className="font-display text-2xs font-bold uppercase tracking-widest text-faint">
        {kicker}
      </p>
      <p className="text-balance pt-0.5 font-display text-base font-semibold leading-tight text-cream">
        {headline}
      </p>
    </li>
  );
}
