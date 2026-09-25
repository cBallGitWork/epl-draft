import { describe, expect, it } from "vitest";
import { ProviderError } from "./errors";
import { htmlPage } from "./fakeFetch";
import { readJson } from "./json";

describe("readJson", () => {
  it("parses a JSON body", async () => {
    expect(await readJson(new Response('{"a":1}'), "FPL", "/x/")).toEqual({ a: 1 });
  });

  it("rejects a 200 web page as malformed, not as a SyntaxError", async () => {
    const error = await readJson(htmlPage(), "FPL", "/bootstrap-static/").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({ provider: "FPL", what: "/bootstrap-static/", kind: "malformed" });
  });

  it("says what came instead: the content type and the start of the body", async () => {
    const error = await readJson(htmlPage(), "FPL", "/bootstrap-static/").catch((e: unknown) => e);
    expect((error as Error).message).toContain("text/html");
    expect((error as Error).message).toContain("<!doctype html>");
  });

  it("quotes no more than 120 characters of a long body", async () => {
    const long = new Response(`<html>${"x".repeat(5000)}</html>`, { status: 200 });
    const error = (await readJson(long, "Fantrax", "getStandings").catch((e: unknown) => e)) as Error;
    expect(error.message).toContain("x".repeat(100));
    expect(error.message).not.toContain("x".repeat(121));
  });

  it("treats an empty 200 as malformed", async () => {
    const error = await readJson(new Response(""), "FPL", "/x/").catch((e: unknown) => e);
    expect(error).toMatchObject({ kind: "malformed" });
  });
});
