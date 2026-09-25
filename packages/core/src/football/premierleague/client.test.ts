import { describe, expect, it } from "vitest";
import { ProviderError } from "../../http/errors";
import { htmlPage, serve, statusOnly } from "../../http/fakeFetch";
import { fetchPlFixture } from "./client";

describe("Premier League client", () => {
  it("reads a web page in place of JSON as malformed", async () => {
    serve(htmlPage);
    await expect(fetchPlFixture(1)).rejects.toMatchObject({
      name: "ProviderError",
      provider: "Premier League",
      what: "/fixtures/1",
      kind: "malformed",
    });
  });

  it("throws a refusal with the message it has always had", async () => {
    serve(statusOnly(404));
    const error = await fetchPlFixture(1).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ kind: "refused", message: "Premier League /fixtures/1 → 404" });
  });
});
