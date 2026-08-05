import type { RawFantraxError } from "./raw";

// Fantrax answers HTTP 200 whether or not it did what you asked. A missing
// leagueId, a deleted league and a league with no teams yet all come back 200
// with an error object in the body, so the FPL client's `if (!res.ok) throw`
// catches none of them. Detecting that envelope is the whole job of this file.

export class FantraxError extends Error {
  constructor(
    readonly method: string,
    /** Fantrax's own code where it gave one ("NO_TEAMS", "INVALID_LEAGUE_ID"),
     *  or the HTTP status for a genuine transport failure. */
    readonly code: string,
    message: string,
  ) {
    super(`Fantrax ${method}: ${code} — ${message}`);
    this.name = "FantraxError";
  }
}

/** The error carried by a 200 response, or null when the body is a healthy one.
 *
 *  A healthy fxea body never has a top-level `error` key, so presence is the
 *  signal. The `code` check keeps a player legitimately named in some future
 *  `error` field from being mistaken for a failure. */
export function errorEnvelope(body: unknown): RawFantraxError | null {
  if (typeof body !== "object" || body === null) return null;
  const error = (body as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return null;
  return typeof (error as RawFantraxError).code === "string"
    ? (error as RawFantraxError)
    : null;
}
