import { FANTRAX_FXEA_BASE, FANTRAX_SPORT, TRANSACTION_PAGE_SIZE } from "../../config";
import { politeFetch } from "../../http/fetch";
import type { TransactionView } from "../types";
import { FantraxError, errorEnvelope } from "./errors";
import { fxpaRead } from "./fxpa";
import type { RawStandingsPage } from "./badges";
import type { RawLiveScoring } from "./livescoring";
import type { RawSchedulePage } from "./results";
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
 *  draft, not a fault.
 *
 *  `period` is optional and echoed back in the payload, which is why the mapper
 *  reads which period it got rather than assuming the one it asked for. Omitted,
 *  Fantrax serves whichever period it currently considers open.
 *
 *  **Whether a past period returns the lineup as it was played is unverified.**
 *  The parameter is honoured and echoed for every period 1–38 (probed 20 Aug),
 *  but no period has completed in either league, so a historic read cannot yet
 *  be told apart from today's roster relabelled. Fantrax's product is a lineup
 *  per period, so it very probably is history — "very probably" is why any view
 *  of a past lineup says so on screen. Re-ask after 28 Aug. */
export function fetchTeamRosters(leagueId: string, period?: number): Promise<RawTeamRosters> {
  return fxeaGet<RawTeamRosters>("getTeamRosters", {
    leagueId,
    ...(period === undefined ? {} : { period: String(period) }),
  });
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

/** The standings page Fantrax draws for its own site, read for the badges on it.
 *
 *  Public, and a different read from `fetchStandings` despite the shared method
 *  name: that one is fxea and answers the table, this one is fxpa and answers
 *  the page. The table is not mapped from here — `mapStandings` already owns it,
 *  and two mappers for one table would be two answers to one question. */
export function fetchTeamBadges(leagueId: string): Promise<RawStandingsPage> {
  return fxpaRead(leagueId, "getStandings") as Promise<RawStandingsPage>;
}

/** The whole season's results, in one request.
 *
 *  The same method and the same surface as `fetchTeamBadges`, on the tab their
 *  own page calls "Results" — `displayedLists.tabs` names it `SCHEDULE`, which
 *  is where the argument comes from rather than from a guess. Public, and it
 *  answers 38 tables, one per period, each with both sides and both totals.
 *
 *  Not a replacement for `fetchLiveScoring`: this is their settled table, that
 *  one is the number that moves during a match. */
export function fetchSeasonResults(leagueId: string): Promise<RawSchedulePage> {
  return fxpaRead(leagueId, "getStandings", { view: "SCHEDULE" }) as Promise<RawSchedulePage>;
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

/** One team's squad with a SEASON's numbers against every player on it.
 *
 *  Public, and the read that made a scoring engine unnecessary: the FPTS view
 *  breaks each total into the league's own categories, and they sum to it
 *  exactly. Refuses with a `WARNING` until a league has at least one team, which
 *  is the state the real league is in until 10 Oct.
 *
 *  **It takes no period, and the reason is a correction.** This used to accept
 *  one, on a docblock claiming Fantrax honoured it — `displayedPeriod` and
 *  `periodOppnentTeamIds` (their typo) do change to match, which is what that
 *  probe saw. The POINTS do not: periods 1, 2 and 3 answer byte-identical
 *  numbers. So the parameter moved the opponent column and nothing else, while
 *  a card headed "This period" showed a running season total. Correcting the
 *  comment would have left the parameter there to be used again; the period
 *  question belongs to `fetchLiveScoring`, which genuinely answers it.
 *
 *  And these numbers price a man at his `defaultPosId`, not at the roster slot
 *  his manager filed him in, which is a second reason no lineup reads them. */
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
