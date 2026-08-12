import { FANTRAX_FXEA_BASE, FANTRAX_SPORT } from "../../config";
import type { TransactionView } from "../types";
import { FantraxError, errorEnvelope } from "./errors";
import { fxpaGet } from "./fxpa";
import type { RawTransactionHistory } from "./transactions";
import type {
  RawDraftResults,
  RawLeagueInfo,
  RawPlayerPool,
  RawStandings,
  RawTeamRosters,
} from "./raw";

// All Fantrax network I/O, and nothing else. The fxea surface is public and
// unauthenticated — the league id is the one in the league URL, not a credential
// — which is why this whole layer works before anyone has logged in. The
// cookie-authenticated fxpa surface (lineup writes, waivers) is deliberately not
// here yet.

async function fxeaGet<T>(method: string, params: Record<string, string>): Promise<T> {
  const url = `${FANTRAX_FXEA_BASE}/${method}?${new URLSearchParams(params)}`;
  const res = await fetch(url);

  // A backstop only. Fantrax reports its own refusals with a 200 and an error
  // body, so this fires for transport failures, not for anything it means.
  if (!res.ok) throw new FantraxError(method, String(res.status), res.statusText);

  const body = (await res.json()) as unknown;
  const error = errorEnvelope(body);
  if (error) {
    throw new FantraxError(method, error.code ?? "UNKNOWN", error.message ?? "no message");
  }
  return body as T;
}

/** Competition configuration: roster limits, scoring periods, the league's view
 *  of every player. Populated well before the draft. */
export function fetchLeagueInfo(leagueId: string): Promise<RawLeagueInfo> {
  return fxeaGet<RawLeagueInfo>("getLeagueInfo", { leagueId });
}

/** Throws `NO_TEAMS` until managers have joined — an expected state before the
 *  draft, not a fault. */
export function fetchTeamRosters(leagueId: string): Promise<RawTeamRosters> {
  return fxeaGet<RawTeamRosters>("getTeamRosters", { leagueId });
}

export function fetchStandings(leagueId: string): Promise<RawStandings> {
  return fxeaGet<RawStandings>("getStandings", { leagueId });
}

export function fetchDraftResults(leagueId: string): Promise<RawDraftResults> {
  return fxeaGet<RawDraftResults>("getDraftResults", { leagueId });
}

/** The global EPL player pool. League-independent, so no leagueId — this is the
 *  side of Fantrax that the identity bridge is built against. */
export function fetchPlayerPool(): Promise<RawPlayerPool> {
  return fxeaGet<RawPlayerPool>("getPlayerIds", { sport: FANTRAX_SPORT });
}

/** One log of transactions — claims and drops, trades, or lineup changes.
 *
 *  On fxpa rather than fxea, because fxea has no transaction method at all. It
 *  needs no cookie despite being on the SPA surface, which is what let the
 *  history land before any auth flow exists.
 *
 *  `maxResultsPerPage` is sent as a string because that is what their own client
 *  sends; the response paginates and reports `totalNumPages`. */
export function fetchTransactions(
  leagueId: string,
  view: TransactionView,
  maxResultsPerPage = 100,
): Promise<RawTransactionHistory> {
  return fxpaGet(leagueId, "getTransactionDetailsHistory", {
    view,
    maxResultsPerPage: String(maxResultsPerPage),
  }) as Promise<RawTransactionHistory>;
}
