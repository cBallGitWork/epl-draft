import { describe, expect, it } from "vitest";
import { htmlPage, serve, statusOnly } from "../../http/fakeFetch";
import { fetchLeagueInfo } from "./client";
import { FantraxError } from "./errors";

const LEAGUE = "league-under-test";

describe("fxea reads", () => {
  // A WAF page served with a 200 is Fantrax failing, exactly as the same wall's 403 is.
  it("read a web page in place of JSON as a FantraxError, not as a SyntaxError", async () => {
    serve(htmlPage);
    const error = await fetchLeagueInfo(LEAGUE).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(FantraxError);
    expect(error).toMatchObject({
      method: "getLeagueInfo",
      code: "NOT_JSON",
      message: expect.stringContaining("Fantrax getLeagueInfo: NOT_JSON — 200 text/html"),
      kind: "malformed",
    });
  });

  it("read an envelope Fantrax served with a 200 as a refusal", async () => {
    serve(() => Response.json({ error: { code: "NO_TEAMS", message: "no teams" } }));
    const error = await fetchLeagueInfo(LEAGUE).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(FantraxError);
    expect(error).toMatchObject({ code: "NO_TEAMS", kind: "refused" });
  });

  it("read a failing status as a FantraxError carrying it", async () => {
    serve(statusOnly(403));
    await expect(fetchLeagueInfo(LEAGUE)).rejects.toThrow(FantraxError);
    await expect(fetchLeagueInfo(LEAGUE)).rejects.toMatchObject({ code: "403", kind: "unreachable" });
  });

  it("reads a status it models as a refusal, not an outage", async () => {
    serve(statusOnly(404));
    await expect(fetchLeagueInfo(LEAGUE)).rejects.toMatchObject({ code: "404", kind: "refused" });
  });
});
