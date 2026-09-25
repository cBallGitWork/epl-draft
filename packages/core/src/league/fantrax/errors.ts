import { ProviderError, type ProviderErrorKind } from "../../http/errors";
import type { RawFantraxError } from "./raw";

// Fantrax answers HTTP 200 whether or not it did what you asked. A missing
// leagueId, a deleted league and a league with no teams yet all come back 200
// with an error object in the body, so the FPL client's `if (!res.ok) throw`
// catches none of them. Detecting those envelopes is the whole job of this file.
//
// There are three of them, and they are three functions rather than one that
// learned to spot all three. Each surface keeps its own shape: a single detector
// would leave no call site able to say which protocol it was talking to, and the
// day fxea grows a `pageError` for some unrelated reason the confusion would
// already be built in. The cross-detector tests exist to keep them apart.

/** `code` is Fantrax's own ("NO_TEAMS", "INVALID_LEAGUE_ID") or the HTTP status of a backstop;
 *  `kind` is a refusal unless the caller knows better. */
export class FantraxError extends ProviderError {
  constructor(
    readonly method: string,
    code: string,
    message: string,
    kind: ProviderErrorKind = "refused",
  ) {
    super("Fantrax", method, code, kind, `Fantrax ${method}: ${code} — ${message}`);
    this.name = "FantraxError";
  }
}

/** An untrusted value as an object, or null. Arrays pass, which is fine: every
 *  caller goes on to require a specific key an array will not have. */
function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

/** A nested object off an untrusted value. All three detectors start by
 *  reaching into a body like this, which is the third occurrence and so the
 *  point at which it stops being repeated (§1). */
function objectAt(value: unknown, key: string): Record<string, unknown> | null {
  const parent = asObject(value);
  return parent ? asObject(parent[key]) : null;
}

/** Built rather than cast, so nothing untrusted is asserted into our own type
 *  (§5). `code` is what makes an envelope an envelope; the human text is
 *  optional and lives under a different key on each surface. */
function envelope(error: Record<string, unknown>, textKey: string): RawFantraxError | null {
  if (typeof error.code !== "string") return null;
  const text = error[textKey];
  return { code: error.code, message: typeof text === "string" ? text : undefined };
}

/** The error carried by a 200 fxea response, or null when the body is healthy.
 *
 *  A healthy fxea body never has a top-level `error` key, so presence is the
 *  signal. The `code` check keeps a player legitimately named in some future
 *  `error` field from being mistaken for a failure. */
export function errorEnvelope(body: unknown): RawFantraxError | null {
  const error = objectAt(body, "error");
  return error ? envelope(error, "message") : null;
}

/** Failure reported at the top of an fxpa response.
 *
 *  `WARNING_NOT_LOGGED_IN`, `NOT_MEMBER_OF_LEAGUE` and `ERROR_INVALID_REQUEST`
 *  all arrive this way, with HTTP 200.
 *
 *  Note the key is `pageError` and the human text is `text`, not `message`. A
 *  reader that found the object but reached for the fxea key would report every
 *  fxpa failure as "no message" — which reads like a bug in our own code rather
 *  than like Fantrax telling us something. */
export function pageErrorEnvelope(body: unknown): RawFantraxError | null {
  const error = objectAt(body, "pageError");
  return error ? envelope(error, "text") : null;
}

/** Failure reported against the message inside the response.
 *
 *  The second fxpa shape: the response as a whole is fine and the message is
 *  not, so `pageError` is absent and the refusal sits in `errors[]`. A reader
 *  checking only the top level would treat a refused message as a successful one
 *  with missing data. Unlike the other two a code is not guaranteed here, so an
 *  entry without one still counts as a failure. */
export function responseErrorEnvelope(response: unknown): RawFantraxError | null {
  const errors = asObject(response)?.errors;
  if (!Array.isArray(errors) || errors.length === 0) return null;

  const first = asObject(errors[0]);
  if (!first) return null;
  return {
    code: typeof first.code === "string" ? first.code : "UNKNOWN",
    message: typeof first.msg === "string" ? first.msg : undefined,
  };
}
