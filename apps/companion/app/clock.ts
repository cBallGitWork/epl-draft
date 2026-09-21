// The app's clock, and the one door every clock read at this edge goes through.
//
// CODE_RULES §5 keeps clocks out of mappers and engines, which is why `now` is
// injected everywhere below this line. This is where it comes from — and the one
// place that can be told to lie, so a played Saturday can be worked on when no
// football is on.

/** The instant the app is running at: the wall clock, or the moment `REPLAY_AT`
 *  names. */
export function now(): Date {
  const at = replayAt();
  return at === null ? new Date() : new Date(at);
}

/** The moment being replayed, or null when the app is simply running today.
 *
 *  **Development only, and by construction rather than by a flag**: nothing sets
 *  `REPLAY_AT` in any deployed environment, so a build that has never heard of it
 *  behaves exactly as it does now. Set it in `apps/companion/.env.local` to an
 *  ISO instant inside a round that has been played, and the football layer
 *  rewinds to it (`footballNow`).
 *
 *  Throws on a string that is not an instant rather than falling back to today: a
 *  typo that silently serves the live app is the one failure this cannot afford,
 *  because every screenshot taken of it would be of the wrong thing. */
export function replayAt(): string | null {
  const at = process.env.REPLAY_AT;
  if (!at) return null;
  if (Number.isNaN(Date.parse(at))) {
    throw new Error(`REPLAY_AT is not a readable instant: "${at}"`);
  }
  return at;
}
