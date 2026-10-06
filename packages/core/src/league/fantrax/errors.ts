import { ProviderError, statusKind, type FailureKind } from "../../http/errors";
import type { RawFantraxError } from "./raw";

// Fantrax answers HTTP 200 whether or not it did what you asked, so these find the error in the body:
// one detector per shape (fxea `error`, fxpa `pageError`, a message's `errors[]`), kept apart on purpose.

/** `code` is Fantrax's own ("NO_TEAMS", "INVALID_LEAGUE_ID") or the HTTP status of a backstop. An
 *  envelope is a refusal, the default; a site that got no answer says which kind. */
export class FantraxError extends ProviderError {
  constructor(readonly method: string, code: string, message: string, kind: FailureKind = "refused") {
    super(code, `Fantrax ${method}: ${code} — ${message}`, kind);
    this.name = "FantraxError";
  }
}

/** The backstop for a non-2xx answer, which Fantrax never uses for a refusal it means. */
export function statusFailure(method: string, res: Response): FantraxError {
  return new FantraxError(method, String(res.status), res.statusText, statusKind(res.status));
}

/** An untrusted value as an object, or null; arrays pass, as every caller then requires a key. */
function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

/** A nested object off an untrusted value, where all three detectors begin. */
function objectAt(value: unknown, key: string): Record<string, unknown> | null {
  const parent = asObject(value);
  return parent ? asObject(parent[key]) : null;
}

/** Built rather than cast; `code` makes an envelope, and the optional text's key differs per surface. */
function envelope(error: Record<string, unknown>, textKey: string): RawFantraxError | null {
  if (typeof error.code !== "string") return null;
  const text = error[textKey];
  return { code: error.code, message: typeof text === "string" ? text : undefined };
}

/** The error in a 200 fxea body, or null: a healthy body has no top-level `error`, and a `code` is required. */
export function errorEnvelope(body: unknown): RawFantraxError | null {
  const error = objectAt(body, "error");
  return error ? envelope(error, "message") : null;
}

/** Failure at the top of an fxpa response (`WARNING_NOT_LOGGED_IN`, `NOT_MEMBER_OF_LEAGUE`, `ERROR_INVALID_REQUEST`).
 *  The key is `pageError` and its text is under `text`, not `message`. */
export function pageErrorEnvelope(body: unknown): RawFantraxError | null {
  const error = objectAt(body, "pageError");
  return error ? envelope(error, "text") : null;
}

/** Failure against the message inside an fxpa response: no `pageError`, the refusal in `errors[]`, and an entry
 *  without a code still fails. */
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
