import { describe, expect, it } from "vitest";
import { ProviderError, statusError } from "./errors";

describe("statusError", () => {
  it("keeps the message the clients have always thrown", () => {
    const error = statusError("FPL", "/bootstrap-static/", 503);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("FPL /bootstrap-static/ → 503");
    expect(error.code).toBe("503");
  });
});
