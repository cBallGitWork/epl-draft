// The app's clock: every clock read at this edge goes through it, and `REPLAY_AT` can rewind it.

/** The instant the app is running at: the wall clock, or the moment `REPLAY_AT`
 *  names. */
export function now(): Date {
  const at = replayAt();
  return at === null ? new Date() : new Date(at);
}

/** The ISO instant `REPLAY_AT` names (development only, in `apps/companion/.env.local`), or null.
 *  Throws on an unreadable one, so a typo never silently serves today. */
export function replayAt(): string | null {
  const at = process.env.REPLAY_AT;
  if (!at) return null;
  if (Number.isNaN(Date.parse(at))) {
    throw new Error(`REPLAY_AT is not a readable instant: "${at}"`);
  }
  return at;
}
