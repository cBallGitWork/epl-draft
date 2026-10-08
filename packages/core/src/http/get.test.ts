import { describe, expect, it } from "vitest";
import { ProviderError } from "./errors";
import { htmlPage, serve, statusOnly } from "./fakeFetch";
import { fetchJson, fetchJsonOr404, fetchText } from "./get";

const URL = "https://example.test/feed/";

describe("fetchJson", () => {
  it("reads the body", async () => {
    serve(() => new Response('{"events":[]}', { status: 200 }));
    expect(await fetchJson(URL, "FPL", "/feed/")).toEqual({ events: [] });
  });

  it("throws the provider's refusal, naming what was asked", async () => {
    serve(statusOnly(404));
    await expect(fetchJson(URL, "FPL", "/feed/")).rejects.toThrow(new ProviderError("404", "FPL /feed/ → 404"));
  });

  it("throws on a page where JSON belongs", async () => {
    serve(htmlPage);
    await expect(fetchJson(URL, "FPL", "/feed/")).rejects.toMatchObject({ code: "NOT_JSON", kind: "malformed" });
  });
});

describe("fetchJsonOr404", () => {
  it("is null for a 404 and still throws any other refusal", async () => {
    serve(statusOnly(404));
    expect(await fetchJsonOr404(URL, "FPL", "entry 1")).toBeNull();
    serve(statusOnly(400));
    await expect(fetchJsonOr404(URL, "FPL", "entry 1")).rejects.toMatchObject({ code: "400", message: "FPL entry 1 → 400" });
  });
});

describe("fetchText", () => {
  it("reads the body as text, and throws on a status that is not OK", async () => {
    serve(() => new Response("<rss/>", { status: 200 }));
    expect(await fetchText(URL, "News feed", URL)).toBe("<rss/>");
    serve(statusOnly(410));
    await expect(fetchText(URL, "News feed", URL)).rejects.toBeInstanceOf(ProviderError);
  });
});
