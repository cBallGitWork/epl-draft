import { describe, expect, it } from "vitest";
import { ProviderError, kindOfStatus, statusError } from "./errors";

describe("kindOfStatus", () => {
  it("reads a WAF block, a rate limit and an outage as unreachable", () => {
    expect(kindOfStatus(403)).toBe("unreachable");
    expect(kindOfStatus(429)).toBe("unreachable");
    expect(kindOfStatus(500)).toBe("unreachable");
    expect(kindOfStatus(503)).toBe("unreachable");
  });

  it("reads any other 4xx as a refusal", () => {
    expect(kindOfStatus(400)).toBe("refused");
    expect(kindOfStatus(404)).toBe("refused");
  });
});

describe("statusError", () => {
  it("keeps the message the clients have always thrown", () => {
    const error = statusError("FPL", "/bootstrap-static/", 503);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("FPL /bootstrap-static/ → 503");
    expect(error).toMatchObject({ provider: "FPL", what: "/bootstrap-static/", code: "503", kind: "unreachable" });
  });
});
