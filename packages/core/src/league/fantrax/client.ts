import { FANTRAX_FXEA_BASE, FANTRAX_SPORT, TRANSACTION_PAGE_SIZE } from "../../config";
import { politeFetch } from "../../http/fetch";
import type { TransactionView } from "../types";
import { FantraxError, errorEnvelope } from "./errors";
import { fxpaRead } from "./fxpa";
import type { RawLiveScoring } from "./livescoring";
import type { RawPlayerProfile } from "./profile";
import type { RawPoolStats, RawStatTables } from "./stats";
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
//
// Manners — the browser User-Agent, and backing off when told to — live in
// `http/fetch.ts`, shared with FPL because neither provider layer may import the
// other. Spacing a sequence of calls is the caller's business: a loop knows it is
// a loop and a single fetch does not.

async function fxeaGet<T>(method: string, params: Record<string, string>): Promise<T> {
  const url = `${FANTRAX_FXEA_BASE}/${method}?${new URLSearchParams(params)}`;
  const res = await politeFetch(url);

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

/** Fantrax's own dossier on one player: his row in this league, his points under
 *  their scoring, and what the rest of the site thinks he is worth.
 *
 *  Public, and asked one player at a time from a tap. The parameter is
 *  `playerId`: `scorerId` — Fantrax's own name for the identical id on the
 *  transaction rows — and `fantraxId` both answer `INVALID_REQUEST`. */
export function fetchPlayerProfile(leagueId: string, playerId: string): Promise<RawPlayerProfile> {
  return fxpaRead(leagueId, "getPlayerProfile", { playerId }) as Promise<RawPlayerProfile>;
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
): Promise<RawTransactionHistory> {
  return fxpaRead(leagueId, "getTransactionDetailsHistory", {
    view,
    maxResultsPerPage: String(TRANSACTION_PAGE_SIZE),
  }) as Promise<RawTransactionHistory>;
}

/** Every team's fantasy points for one period, as Fantrax scores them.
 *
 *  Public, despite sitting on the SPA surface beside methods that are not — the
 *  line runs per method, not per surface. `period` is honoured; `matchupId` is
 *  not, so one call answers for the whole league and filtering is ours to do.
 *
 *  The period is sent as a string, as their own client sends it, and is not
 *  echoed back: what period this describes is known only because we asked. */
export function fetchLiveScoring(leagueId: string, period: number): Promise<RawLiveScoring> {
  return fxpaRead(leagueId, "getLiveScoringStats", {
    period: String(period),
  }) as Promise<RawLiveScoring>;
}

/** The whole player pool with Fantrax's own points against each name.
 *
 *  Public. One call carries all of it: their page asks for twenty at a time and
 *  paginates, but `maxResultsPerPage` is honoured up to the full pool, which is
 *  the difference between one request and thirty-six.
 *
 *  `season` is sent when we know the code and omitted when we do not, because it
 *  is where the code comes from — the list of valid season codes is published
 *  here and nowhere else we read. Whatever it answers with is read back and
 *  rendered: this endpoint quietly refuses a year-to-date code and hands back a
 *  projection instead (PLATFORM_NOTES, 13 Aug), so asking is not knowing. */
export function fetchPoolStats(
  leagueId: string,
  perPage: number,
  season?: string,
): Promise<RawPoolStats> {
  return fxpaRead(leagueId, "getPlayerStats", {
    statusOrTeamFilter: "ALL",
    pageNumber: "1",
    maxResultsPerPage: String(perPage),
    ...(season ? { seasonOrProjection: season } : {}),
  }) as Promise<RawPoolStats>;
}

/** One team's squad with a season's numbers against every player on it.
 *
 *  Public, and the read that made a scoring engine unnecessary: the FPTS view
 *  breaks each total into the league's own categories, and they sum to it
 *  exactly. Refuses with a `WARNING` until a league has at least one team, which
 *  is the state the real league is in until 10 Oct. */
export function fetchTeamStats(
  leagueId: string,
  teamId: string,
  season?: string,
): Promise<RawStatTables> {
  return fxpaRead(leagueId, "getTeamRosterInfo", {
    teamId,
    view: "FPTS",
    ...(season ? { seasonOrProjection: season } : {}),
  }) as Promise<RawStatTables>;
}
