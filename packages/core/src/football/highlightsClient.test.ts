import { describe, expect, it } from "vitest";
import { ProviderError } from "../http/errors";
import { serve, statusOnly } from "../http/fakeFetch";
import { fetchHighlightsFeed } from "./highlightsClient";

describe("fetchHighlightsFeed", () => {
  it("throws a failing status as a ProviderError, with the message it has always had", async () => {
    serve(statusOnly(404));
    const error = await fetchHighlightsFeed("PL-under-test").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ code: "404", message: "YouTube playlist PL-under-test → 404" });
  });
});
