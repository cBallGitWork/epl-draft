import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderError } from "../../http/errors";
import { htmlPage, serve, statusOnly } from "../../http/fakeFetch";
import { fetchBootstrap } from "./client";

afterEach(() => vi.unstubAllGlobals());

describe("FPL client", () => {
  it("reads a web page in place of JSON as malformed", async () => {
    serve(htmlPage);
    await expect(fetchBootstrap()).rejects.toMatchObject({
      name: "ProviderError",
      provider: "FPL",
      what: "/bootstrap-static/",
      kind: "malformed",
    });
  });

  it("throws a refusal with the message it has always had", async () => {
    serve(statusOnly(404));
    const error = await fetchBootstrap().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ kind: "refused", code: "404", message: "FPL /bootstrap-static/ → 404" });
  });

  it("reads a WAF block as unreachable", async () => {
    serve(statusOnly(403));
    await expect(fetchBootstrap()).rejects.toMatchObject({ kind: "unreachable" });
  });
});
