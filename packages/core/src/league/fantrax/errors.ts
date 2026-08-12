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

// fxpa is a different surface with a different failure shape, and this is a
// SECOND detector rather than a widening of the first. Each surface keeps its
// own shape: teaching `errorEnvelope` to also look for `pageError` would mean
// neither call site could say which protocol it was talking to, and the day
// fxea grows a `pageError` field for some unrelated reason we would have built
// the confusion in.
//
// Two things differ, and both would have gone unnoticed. The key is `pageError`,
// not `error`. And the human text lives in `text`, not `message` — so a reader
// that found the object but read `.message` would report every fxpa failure as
// "no message", which reads exactly like a bug in our own code.

/** Failure reported at the top of an fxpa response.
 *
 *  `WARNING_NOT_LOGGED_IN`, `NOT_MEMBER_OF_LEAGUE` and `ERROR_INVALID_REQUEST`
 *  all arrive this way, with HTTP 200. */
export function pageErrorEnvelope(body: unknown): RawFantraxError | null {
  if (typeof body !== "object" || body === null) return null;
  const error = (body as { pageError?: unknown }).pageError;
  if (typeof error !== "object" || error === null) return null;

  const { code, text } = error as { code?: unknown; text?: unknown };
  if (typeof code !== "string") return null;
  return { code, message: typeof text === "string" ? text : undefined };
}

/** Failure reported against one message inside a batch.
 *
 *  The second fxpa failure shape: the response as a whole is fine and an
 *  individual `msgs[]` entry is not, so `pageError` is absent and the refusal is
 *  in `responses[i].errors[]`. A reader checking only the top level would treat
 *  a refused message as a successful one with missing data. */
export function responseErrorEnvelope(response: unknown): RawFantraxError | null {
  if (typeof response !== "object" || response === null) return null;
  const errors = (response as { errors?: unknown }).errors;
  if (!Array.isArray(errors) || errors.length === 0) return null;

  const first = errors[0] as { code?: unknown; msg?: unknown; text?: unknown };
  if (typeof first !== "object" || first === null) return null;
  const code = typeof first.code === "string" ? first.code : "UNKNOWN";
  const message = typeof first.msg === "string" ? first.msg : first.text;
  return { code, message: typeof message === "string" ? message : undefined };
}
