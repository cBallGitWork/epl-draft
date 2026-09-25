// A provider failing us, named so that a log tells it apart from a bug of our own.

export class ProviderError extends Error {
  constructor(
    /** The provider's own code, an HTTP status, or a transport code such as "ECONNRESET". */
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/** Who was asked for what, and what came back: "FPL /bootstrap-static/ → 503". */
function failure(provider: string, what: string, code: string, answer = code): ProviderError {
  return new ProviderError(code, `${provider} ${what} → ${answer}`);
}

/** A response that was not OK. */
export function statusError(provider: string, what: string, status: number): ProviderError {
  return failure(provider, what, String(status));
}

/** `readJson`'s error for a provider's client, given what arrived instead of JSON. */
export function notJson(provider: string, what: string): (arrived: string) => ProviderError {
  return (arrived) => failure(provider, what, "NOT_JSON", arrived);
}

/** No answer at all, named by host and path because no provider client is in the loop. */
export function unreachable(url: string, code: string): ProviderError {
  const { host, pathname } = new URL(url);
  return failure(host, pathname, code);
}
