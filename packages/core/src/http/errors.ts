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

/** A response that was not OK, as "FPL /bootstrap-static/ → 503". */
export function statusError(provider: string, what: string, status: number): ProviderError {
  return new ProviderError(String(status), `${provider} ${what} → ${status}`);
}
