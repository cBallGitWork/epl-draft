import { FantraxError, ProviderError } from "@epl/core";

// A provider answering "no", or not answering, is not this app failing. A refusal Fantrax meant
// is a state to model and cache; no answer at all is never stored; anything else is our bug.

/** A page that cannot show what it exists to show, carrying the provider's own
 *  tell so the panel can print it. */
export interface Unavailable {
  unavailable: string;
}

/** What was asked and what came back: "getTeamRosters → NO_TEAMS" from Fantrax, or the host, path
 *  and code of a provider that never answered. Built from the error, never written at a call site. */
export function tell(error: ProviderError): string {
  return error instanceof FantraxError ? `${error.method} → ${error.code}` : error.message;
}

/** The read, or the refusal Fantrax meant. An outage still throws, so a cache keeps its last good
 *  answer rather than holding the outage as one. */
export async function orRefusal<T>(read: Promise<T>): Promise<T | FantraxError> {
  try {
    return await read;
  } catch (error: unknown) {
    if (error instanceof FantraxError && error.kind === "refused") return error;
    throw error;
  }
}

/** The read, or `degrade`'s answer when a provider failed it. A bug of ours still throws. */
export async function orDegraded<T, D>(read: Promise<T>, degrade: (error: ProviderError) => D): Promise<T | D> {
  try {
    return await read;
  } catch (error: unknown) {
    if (error instanceof ProviderError) return degrade(error);
    throw error;
  }
}
