// A provider failing us, in one of three kinds a caller can act on without reading the message.

/** Refused: it answered no. Unreachable: it could not be asked. Malformed: its answer made no sense. */
export type ProviderErrorKind = "refused" | "unreachable" | "malformed";

export class ProviderError extends Error {
  constructor(
    /** Who failed: "FPL", "Fantrax", or the host when only the transport knows. */
    readonly provider: string,
    /** What was asked: a path, a method, or a read's own name. */
    readonly what: string,
    /** The provider's own code, an HTTP status, or a transport code such as "ECONNRESET". */
    readonly code: string,
    readonly kind: ProviderErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

/** A WAF block, a rate limit or an outage is theirs to lift; any other failing status is an answer. */
export function kindOfStatus(status: number): ProviderErrorKind {
  return status === 403 || status === 429 || status >= 500 ? "unreachable" : "refused";
}

/** A response that was not OK, as "FPL /bootstrap-static/ → 503". */
export function statusError(provider: string, what: string, status: number): ProviderError {
  return new ProviderError(
    provider,
    what,
    String(status),
    kindOfStatus(status),
    `${provider} ${what} → ${status}`,
  );
}
