import { describe, expect, it, onTestFinished, vi } from "vitest";
import { htmlPage, serve, statusOnly } from "../../http/fakeFetch";
import { fetchLeagueInfo, fetchStandings, fetchTeamRosters, fetchTransactions } from "./client";
import { FantraxError } from "./errors";

const LEAGUE = "league-under-test";

/** fxpa's transaction log over pages of transaction ids, answering the page each request names (1 when it names
 *  none); `turns` false answers page 1 whatever is asked, as a read that ignores the page would. */
function serveLog(pages: string[][], turns = true): { asked: number[] } {
  const asked: number[] = [];
  onTestFinished(() => {
    vi.unstubAllGlobals();
  });
  vi.stubGlobal("fetch", async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { msgs: { data: { pageNumber?: string } }[] };
    const page = Number(body.msgs[0]?.data.pageNumber ?? 1);
    asked.push(page);
    const number = turns ? page : 1;
    const rows = (pages[number - 1] ?? []).map((id) => ({ txSetId: id, scorer: { scorerId: id } }));
    const paginatedResultSet = { pageNumber: number, totalNumPages: pages.length };
    return Response.json({ responses: [{ data: { table: { rows }, paginatedResultSet } }] });
  });
  return { asked };
}

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

  it("reads a body that is no object, a JSON null among them, as malformed, so no mapper is handed it", async () => {
    serve(() => Response.json(null));
    await expect(fetchLeagueInfo(LEAGUE)).rejects.toMatchObject({ method: "getLeagueInfo", code: "NO_DATA", kind: "malformed" });
    serve(() => Response.json("rosters"));
    await expect(fetchTeamRosters(LEAGUE)).rejects.toMatchObject({ method: "getTeamRosters", code: "NO_DATA", kind: "malformed" });
  });

  it("passes an array, which is how getStandings answers", async () => {
    serve(() => Response.json([]));
    await expect(fetchStandings(LEAGUE)).resolves.toEqual([]);
  });
});

describe("fetchTransactions", () => {
  it("reads every page of the log as one table, asking for each by number", async () => {
    const served = serveLog([["a", "b"], ["c", "d"], ["e"]]);
    const log = await fetchTransactions(LEAGUE, "CLAIM_DROP");
    expect(log.table?.rows?.map((row) => row.txSetId)).toEqual(["a", "b", "c", "d", "e"]);
    expect(served.asked).toEqual([1, 2, 3]);
  });

  it("asks once for a log that fits a page", async () => {
    const served = serveLog([["a"]]);
    expect((await fetchTransactions(LEAGUE, "TRADE")).table?.rows).toHaveLength(1);
    expect(served.asked).toEqual([1]);
  });

  it("refuses a log whose next page Fantrax will not turn, rather than pass its first page off as the whole", async () => {
    serveLog([["a"], ["b"]], false);
    await expect(fetchTransactions(LEAGUE, "CLAIM_DROP")).rejects.toMatchObject({
      method: "getTransactionDetailsHistory",
      code: "PAGE_NOT_TURNED",
      kind: "malformed",
    });
  });
});
