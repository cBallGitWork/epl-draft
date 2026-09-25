import { describe, expect, it } from "vitest";
import { ProviderError } from "../../http/errors";
import { htmlPage, serve, statusOnly } from "../../http/fakeFetch";
import { fetchLeagueInfo } from "./client";
import { FantraxError } from "./errors";

const LEAGUE = "league-under-test";

describe("fxea reads", () => {
  it("read a web page in place of JSON as NOT_JSON, not as a SyntaxError", async () => {
    serve(htmlPage);
    const error = await fetchLeagueInfo(LEAGUE).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toMatchObject({
      code: "NOT_JSON",
      message: expect.stringContaining("Fantrax getLeagueInfo"),
    });
  });

  it("read an envelope Fantrax served with a 200 as a refusal", async () => {
    serve(() => Response.json({ error: { code: "NO_TEAMS", message: "no teams" } }));
    const error = await fetchLeagueInfo(LEAGUE).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(FantraxError);
    expect(error).toMatchObject({ code: "NO_TEAMS" });
  });

  it("read a failing status as a FantraxError carrying it", async () => {
    serve(statusOnly(403));
    await expect(fetchLeagueInfo(LEAGUE)).rejects.toThrow(FantraxError);
    await expect(fetchLeagueInfo(LEAGUE)).rejects.toMatchObject({ code: "403" });
  });
});
