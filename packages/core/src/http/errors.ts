// A provider failing us, named so that a log tells it apart from a bug of our own.

/** `refused` (the default) is an answer we model and may cache; `unreachable` and `malformed` are none. */
export type FailureKind = "refused" | "unreachable" | "malformed";

export class ProviderError extends Error {
  constructor(
    /** The provider's own code, an HTTP status, or a transport code such as "ECONNRESET". */
    readonly code: string,
    message: string,
    readonly kind: FailureKind = "refused",
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/** 403 (a firewall), 429 and 5xx are a provider unable to answer; any other status is its answer. */
export function statusKind(status: number): FailureKind {
  return status === 403 || status === 429 || status >= 500 ? "unreachable" : "refused";
}

/** Who was asked for what, and what came back: "FPL /bootstrap-static/ → 503". */
function failure(provider: string, what: string, code: string, kind: FailureKind, answer = code): ProviderError {
  return new ProviderError(code, `${provider} ${what} → ${answer}`, kind);
}

/** A response that was not OK. */
export function statusError(provider: string, what: string, status: number): ProviderError {
  return failure(provider, what, String(status), statusKind(status));
}

/** `readJson`'s error for a provider's client, given what arrived instead of JSON. */
export function notJson(provider: string, what: string): (arrived: string) => ProviderError {
  return (arrived) => failure(provider, what, "NOT_JSON", "malformed", arrived);
}

/** No answer at all, named by host and path because no provider client is in the loop. */
export function unreachable(url: string, code: string): ProviderError {
  const { host, pathname } = new URL(url);
  return failure(host, pathname, code, "unreachable");
}
