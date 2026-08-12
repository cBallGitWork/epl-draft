import { FantraxError } from "@epl/core";

// Fantrax answering "no" is not this app failing.
//
// Core throws on a refusal, which is right: a mapper cannot know whether a
// missing league matters. Every route then makes the same decision — this read
// failing is a state to render, not a crash — and four of them had reached it
// independently by the time the pool page landed. Three is the line (§1).
//
// Only `FantraxError` is caught anywhere in here. A TypeError in a mapper or a
// DNS failure is a bug or an outage, and folding those into a panel that says
// "Fantrax is not answering" would hide our own faults behind theirs (§2).

/** A page that cannot show what it exists to show, carrying the provider's own
 *  tell so the panel can print it. */
export interface Unavailable {
  unavailable: string;
}

/** What Fantrax was asked and what it said: "getTeamRosters → NO_TEAMS".
 *
 *  Built from the error rather than written at each call site, because the two
 *  drift: a page saying `getStandings →` beside a code that came from a different
 *  read is worse than no chip at all, and it is the one thing on the panel a
 *  manager might quote back to us. */
export function tell(error: FantraxError): string {
  return `${error.method} → ${error.code}`;
}

/** The read, or the refusal. Never a throw, and never a default. */
export async function orRefusal<T>(read: Promise<T>): Promise<T | FantraxError> {
  try {
    return await read;
  } catch (error: unknown) {
    if (error instanceof FantraxError) return error;
    throw error;
  }
}
