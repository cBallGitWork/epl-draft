// A story's display block as every rank that prints one sets it; the chip over it is the caller's to place.

/** A story's kicker or a column's standing title: stock on an ink chip, 14.2:1, in the sheet's own two colours. */
export const KICKER = "inline-block bg-ink px-2 py-1 font-sans text-2xs font-bold uppercase tracking-[0.15em] text-bg";

/** The headline's step at width: the front page's, asked of the stories' container, or an article's own. */
const STEP = { front: "@md/stories:text-6xl", article: "@3xl:text-5xl" } as const;

/** The headline, the standfirst when there is one, and the 24px hairline closing the block, ranged left with it. */
export default function StoryHead({
  headline,
  standfirst,
  rank,
}: {
  headline: string;
  /** Empty prints none. */
  standfirst: string;
  rank: keyof typeof STEP;
}) {
  return (
    <>
      <h2 className={`paper-display text-balance pt-2.5 text-4xl font-black leading-[1.02] text-ink ${STEP[rank]}`}>
        {headline}
      </h2>
      {standfirst ? <p className="pt-2 text-lg italic leading-snug text-muted">{standfirst}</p> : null}
      <span className="mt-3 block h-px w-6 bg-ink" />
    </>
  );
}
