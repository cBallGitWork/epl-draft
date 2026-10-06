/** Seconds until the next poll: the live rate once football is live, the kickoff if nearer than the idle rate, else idle.
 *  `liveIn` is as the server gave it; `elapsed` is the seconds since it arrived. */
export function nextPoll(
  liveIn: number | null,
  elapsed: number,
  rates: { live: number; idle: number },
): number {
  if (liveIn === null) return rates.idle;
  const remaining = liveIn - elapsed;
  if (remaining <= 0) return rates.live;
  return Math.min(remaining, rates.idle);
}
