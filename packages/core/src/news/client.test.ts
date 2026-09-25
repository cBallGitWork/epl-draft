import { describe, expect, it } from "vitest";
import { ProviderError } from "../http/errors";
import { serve, statusOnly } from "../http/fakeFetch";
import { fetchFeed } from "./client";

const FEED = "https://feeds.example.test/football/rss.xml";

describe("fetchFeed", () => {
  it("throws a failing status as a ProviderError naming the feed", async () => {
    serve(statusOnly(404));
    const error = await fetchFeed(FEED).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ code: "404", message: `News feed ${FEED} → 404` });
  });
});
