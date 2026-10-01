import { describe, expect, it } from "vitest";
import { notJson, ProviderError, statusError, unreachable } from "./errors";

describe("statusError", () => {
  it("keeps the message the clients have always thrown", () => {
    const error = statusError("FPL", "/bootstrap-static/", 503);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("FPL /bootstrap-static/ → 503");
    expect(error.code).toBe("503");
  });
});

describe("a failure's kind", () => {
  it("reads 403, 429 and 5xx as a provider that could not answer", () => {
    for (const status of [403, 429, 500, 502, 503, 504]) {
      expect(statusError("FPL", "/x/", status).kind).toBe("unreachable");
    }
  });

  it("reads any other status as the provider's answer", () => {
    for (const status of [400, 401, 404, 410]) expect(statusError("FPL", "/x/", status).kind).toBe("refused");
  });

  it("reads a body that is not JSON as malformed, and no answer as unreachable", () => {
    expect(notJson("FPL", "/x/")("200 text/html").kind).toBe("malformed");
    expect(unreachable("https://example.test/x/", "ECONNRESET").kind).toBe("unreachable");
  });
});
