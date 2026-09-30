import { describe, expect, it } from "vitest";
import { ProviderError } from "../../http/errors";
import { htmlPage, serve, statusOnly } from "../../http/fakeFetch";
import { fetchBootstrap } from "./client";

describe("FPL client", () => {
  it("reads a web page in place of JSON as NOT_JSON", async () => {
    serve(htmlPage);
    await expect(fetchBootstrap()).rejects.toMatchObject({
      name: "ProviderError",
      code: "NOT_JSON",
      message: expect.stringContaining("FPL /bootstrap-static/"),
    });
  });

  it("throws a failing status with the message it has always had", async () => {
    serve(statusOnly(404));
    const error = await fetchBootstrap().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ code: "404", message: "FPL /bootstrap-static/ → 404" });
  });
});
