import type { PublishedStory } from "@epl/core";

// The two columns written as speech: the press room and the studio.
//
// Set as a ruled Q&A rather than as prose, because that is what tells a reader
// at a glance that nobody actually said this. The speaker's name goes in the
// letterspaced small capitals the paper gives its furniture, and the line
// beside it in the prose serif — a transcript's shape, which is the joke.
//
// **The label is not decoration.** These are the paper's only invented quotes,
// and the page says so once, plainly, above them. A reader who scrolls past
// the standfirst still meets it.

export default function Quotes({
  story,
  label,
}: {
  story: PublishedStory;
  /** What this sketch is, in the fewest honest words. */
  label: string;
}) {
  const quotes = story.extras?.quotes ?? [];
  if (quotes.length === 0) return null;

  return (
    <div className="pt-3">
      <p className="border-b border-line pb-1 font-sans text-3xs font-bold uppercase tracking-[0.16em] text-faint">
        {label}
      </p>
      <dl className="flex flex-col divide-y" style={{ borderColor: "var(--paper-rule)" }}>
        {quotes.map((quote, at) => (
          // Keyed by position: two lines from one speaker are the ordinary
          // case in a two-hander, so the name is not a key.
          <div key={at} className="py-2">
            <dt className="font-sans text-3xs font-semibold uppercase tracking-[0.16em] text-muted">
              {quote.speaker}
            </dt>
            <dd className="pt-0.5 text-sm leading-snug text-ink">{quote.line}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
