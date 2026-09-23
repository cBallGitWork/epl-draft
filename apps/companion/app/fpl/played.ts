/** Whether a footballer's club has kicked off in the round on screen.
 *
 *  A predicate rather than a map, because two components ask it about different
 *  sets of men — the eleven on the grass and the four on the bench — and both
 *  ask about a `code`, which is the season-stable key everything on this tab is
 *  already joined on.
 *
 *  **It is what stops a nought standing in for an absence** (DESIGN §7, and
 *  Craig on 5 Sep 2026: *"players as zero when not played a game yet"*). FPL's
 *  live feed cannot answer it: `CLAUDE.md` counts 600 rows once a round starts
 *  with 569 of them on no minutes, so a row says the ROUND has begun and never
 *  that the MAN has appeared. The fixture's own status does answer it, and it is
 *  FPL's own statement about FPL's own calendar. */
export type Played = (code: number) => boolean;
