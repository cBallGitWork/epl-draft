import {
  FANTRAX_FXEA_BASE,
  FANTRAX_SPORT,
  HTTP_BACKOFF_BASE_MS,
  HTTP_RETRIES,
  HTTP_USER_AGENT,
} from "../../config";
import { retryDelay, worthRetrying } from "../../http/backoff";
import type { TransactionView } from "../types";
import { FantraxError, errorEnvelope } from "./errors";
import { fxpaRead } from "./fxpa";
import type { RawLiveScoring } from "./livescoring";
import type { RawPlayerProfile } from "./profile";
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
// Reads here are about to fan out — one call per team, and thirty-six pages for
// the pool — so they go through the same retry policy as FPL, from `http/`, which
// belongs to neither layer. Sequenced spacing is the caller's business: a loop
// knows it is a loop and a single fetch does not.

/** One request, with a browser's manners and a provider's own advice honoured. */
async function politeGet(url: string, method: string): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": HTTP_USER_AGENT } });
    if (res.ok) return res;

    // A backstop only. Fantrax reports its own refusals with a 200 and an error
    // body, so this fires for transport failures, not for anything it means.
    if (attempt > HTTP_RETRIES || !worthRetrying(res.status)) {
      throw new FantraxError(method, String(res.status), res.statusText);
    }

    await sleep(
      retryDelay(
        attempt,
        res.headers.get("Retry-After"),
        HTTP_BACKOFF_BASE_MS,
        Math.random(),
        Date.now(),
      ),
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fxeaGet<T>(method: string, params: Record<string, string>): Promise<T> {
  const url = `${FANTRAX_FXEA_BASE}/${method}?${new URLSearchParams(params)}`;
  const res = await politeGet(url, method);

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
  maxResultsPerPage = 100,
): Promise<RawTransactionHistory> {
  return fxpaRead(leagueId, "getTransactionDetailsHistory", {
    view,
    maxResultsPerPage: String(maxResultsPerPage),
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
