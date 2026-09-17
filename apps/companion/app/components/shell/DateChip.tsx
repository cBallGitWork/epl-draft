// CM's blue index block, holding a DATE.
//
// **The one chip in the app that does not hold a number**, and the reason it is
// a component rather than a class string. `.cm-index` is a placing, a score, a
// shirt number — a figure two or three characters wide, in a box sized for one.
// Two screens ask it to hold "Wed 2 Sept 6:11am" instead: this list and the one
// on a player's own news tab. Everything else that wears `cm-index` is a figure
// and shares nothing with these but the plate.
//
// **Extracted on Craig's instruction** (17 Sep 2026, comparing the two:
// *"the chip on here is much easier to read. share the code"*). The rule of 2/3
// would have declined at two occurrences and recorded the count; he asked for
// the share, and he asked because the two had already DRIFTED — the player's ran
// at `.cm-index`'s own `text-sm`/`lg:text-base` and the league inbox's at
// `text-3xs`, the smallest step the scale has. Same object, same job, three
// sizes apart, and the smaller one was the one he could not read.
//
// **Two lines, set rather than wrapped.** A date and a clock in a 96px box will
// break somewhere; letting it break on its own put the fold in a different place
// on every row, because "Wed 2 Sept" and "Sun 30 Aug" are different widths. The
// caller hands over the two parts and the fold is the same on every row of the
// column — which is what makes a column of them read as one thing.

export default function DateChip({
  day,
  time,
  className = "",
}: {
  /** The date, however the caller spells it — "Wed 2 Sept", or "GW5" for an item
   *  whose source has no date at all. */
  day: string;
  /** The clock, on its own line. Null for a date without one. */
  time?: string | null;
  /** The width, which is the caller's because only the caller knows what else is
   *  in its row. Everything else about the chip is fixed here on purpose. */
  className?: string;
}) {
  return (
    <span
      className={`cm-index numeric flex shrink-0 flex-col items-center justify-center px-1 text-center leading-tight ${className}`}
    >
      <span>{day}</span>
      {time === null || time === undefined ? null : <span>{time}</span>}
    </span>
  );
}
