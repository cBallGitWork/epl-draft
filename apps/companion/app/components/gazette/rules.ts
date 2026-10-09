// The sheet's faint rules, in `--paper-rule` (ink at 0.18); a heavy rule is `currentColor`, set where it is drawn.

/** A faint rule's colour; the caller names the side it rules (`border-t`, `border-y`). */
export const RULE = "border-[var(--paper-rule)]";

/** The hairline between a list's rows. `divide-y` alone rules them in each row's own ink. */
export const HAIRLINES = "divide-y divide-[var(--paper-rule)]";
