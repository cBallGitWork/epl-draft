// The paper's small capitals, by weight: each weight is a different job, and ink is the caller's where it varies.

/** The standing head's small tracked capitals with no ink, for a caller that needs another: an appended one loses.
 *  Also the masthead's and folio's dateline rows. */
export const STANDING_CAPS = "font-sans text-3xs font-semibold uppercase tracking-[0.16em]";

/** The paper's standing head: a label over a list, a panel or a line of figures, in small tracked capitals and muted ink. */
export const STANDING_HEAD = `${STANDING_CAPS} text-muted`;

/** A kicker's capitals off its chip, bold and with no ink: a card's standing head, the quiz's. */
export const KICKER_CAPS = "font-sans text-3xs font-bold uppercase tracking-[0.16em]";

/** A line to read past, at the body's weight in faint ink: a dateline, who is left to play, the quiz's answers. */
export const QUIET_CAPS = "font-sans text-3xs uppercase tracking-[0.16em] text-faint";

/** A caption's small capitals, a step up from the standing head's and tracked wider, with no ink, for a caller that
 *  needs another: a picture's name, a man's status. */
export const CAPTION_CAPS = "font-sans text-2xs uppercase tracking-widest";

/** A caption in muted ink: a kickoff, a club's fixture, a quote's credit, the line over a side's eleven. */
export const CAPTION = `${CAPTION_CAPS} text-muted`;
