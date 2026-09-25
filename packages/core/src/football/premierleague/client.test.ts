import { describe, expect, it } from "vitest";
import { ProviderError } from "../../http/errors";
import { htmlPage, serve, statusOnly } from "../../http/fakeFetch";
import { fetchPlFixture } from "./client";

describe("Premier League client", () => {
  it("reads a web page in place of JSON as NOT_JSON", async () => {
    serve(htmlPage);
    await expect(fetchPlFixture(1)).rejects.toMatchObject({
      name: "ProviderError",
      code: "NOT_JSON",
      message: expect.stringContaining("Premier League /fixtures/1"),
    });
  });

  it("throws a failing status with the message it has always had", async () => {
    serve(statusOnly(404));
    const error = await fetchPlFixture(1).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ code: "404", message: "Premier League /fixtures/1 → 404" });
  });
});
