import { describe, expect, it } from "vitest";
import { ProviderError } from "../http/errors";
import { htmlPage, serve, statusOnly } from "../http/fakeFetch";
import { fetchEntry, fetchPicks } from "./client";

describe("fetchEntry", () => {
  it("answers null for an id FPL has never heard of", async () => {
    serve(statusOnly(404));
    expect(await fetchEntry(1)).toBeNull();
  });

  it("reads a web page in place of JSON as NOT_JSON", async () => {
    serve(htmlPage);
    await expect(fetchEntry(1)).rejects.toMatchObject({
      code: "NOT_JSON",
      message: expect.stringContaining("FPL entry 1"),
    });
  });

  it("throws any other status with the message it has always had", async () => {
    serve(statusOnly(403));
    const error = await fetchEntry(1).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ code: "403", message: "FPL entry 1 → 403" });
  });
});

describe("fetchPicks", () => {
  it("answers null before the round has been played", async () => {
    serve(statusOnly(404));
    expect(await fetchPicks(1, 6)).toBeNull();
  });

  it("reads a web page in place of JSON as NOT_JSON", async () => {
    serve(htmlPage);
    await expect(fetchPicks(1, 6)).rejects.toMatchObject({
      code: "NOT_JSON",
      message: expect.stringContaining("FPL picks 1/6"),
    });
  });

  it("throws any other status with the message it has always had", async () => {
    serve(statusOnly(400));
    const error = await fetchPicks(1, 6).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ code: "400", message: "FPL picks 1/6 → 400" });
  });
});
