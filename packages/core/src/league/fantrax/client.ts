import { FANTRAX_FXEA_BASE, FANTRAX_SPORT, TRANSACTION_PAGE_SIZE } from "../../config";
import { politeFetch } from "../../http/fetch";
import { readJson } from "../../http/json";
import type { TransactionView } from "../types";
import { FantraxError, errorEnvelope, statusFailure } from "./errors";
import { fxpaRead } from "./fxpa";
import { demoFxea, isDemo } from "./demo";
import type { RawStandingsPage } from "./standingsPage";
import type { RawLiveScoring } from "./livescoring";
import type { RawTeamRosterInfo } from "./benchOrder";
import type { RawSchedulePage } from "./results";
import type { RawSeasonStats } from "./seasonStats";
import type { RawStatTables } from "./stats";
import type { RawTransactionHistory } from "./transactions";
import type {
  RawDraftResults,
  RawLeagueInfo,
  RawPlayerPool,
  RawStandings,
  RawTeamRosters,
} from "./raw";

// Fantrax's league reads, all public: fxea's league API and the league's own pages on fxpa. Player reads are
// `playerClient.ts`; the lineup writes, which carry the commissioner's cookie, are `lineupClient.ts`.

async function fxeaGet<T>(method: string, params: Record<string, string>): Promise<T> {
  // The demo league is answered here, where every fxea read passes, so nothing downstream branches on it.
  if (params.leagueId !== undefined && isDemo(params.leagueId)) {
    const canned = demoFxea(method);
    if (canned !== null) return canned as T;
    throw new FantraxError(method, "DEMO_UNMAPPED", "the demo league has no answer for this read");
  }

  const url = `${FANTRAX_FXEA_BASE}/${method}?${new URLSearchParams(params)}`;
  const res = await politeFetch(url);

  // A backstop only: Fantrax reports its own refusals with a 200 and an error body.
  if (!res.ok) throw statusFailure(method, res);

  const body = await readJson(res, (arrived) => new FantraxError(method, "NOT_JSON", arrived, "malformed"));
  const error = errorEnvelope(body);
  if (error) {
    throw new FantraxError(method, error.code ?? "UNKNOWN", error.message ?? "no message");
  }
  return body as T;
}

/** Competition configuration: roster limits, scoring periods, the league's view of every player. */
export function fetchLeagueInfo(leagueId: string): Promise<RawLeagueInfo> {
  return fxeaGet<RawLeagueInfo>("getLeagueInfo", { leagueId });
}

/** Throws `NO_TEAMS` until managers have joined. `period` SELECTS: a past period answers the squads stored for it,
 *  not today's relabelled, and the mapper reads the period echoed back. Omitted, Fantrax serves the open one. */
export function fetchTeamRosters(leagueId: string, period?: number): Promise<RawTeamRosters> {
  return fxeaGet<RawTeamRosters>("getTeamRosters", {
    leagueId,
    ...(period === undefined ? {} : { period: String(period) }),
  });
}

/** The fxea table, kept for the snapshots and the shape diff: it has no points column, so no screen reads it. */
export function fetchStandings(leagueId: string): Promise<RawStandings> {
  return fxeaGet<RawStandings>("getStandings", { leagueId });
}

export function fetchDraftResults(leagueId: string): Promise<RawDraftResults> {
  return fxeaGet<RawDraftResults>("getDraftResults", { leagueId });
}

/** The global EPL player pool the identity bridge is built against; league-independent, so no leagueId. */
export function fetchPlayerPool(): Promise<RawPlayerPool> {
  return fxeaGet<RawPlayerPool>("getPlayerIds", { sport: FANTRAX_SPORT });
}

/** One log of transactions. fxea has none; this fxpa read needs no cookie and reports `totalNumPages`. */
export function fetchTransactions(
  leagueId: string,
  view: TransactionView,
): Promise<RawTransactionHistory> {
  return fxpaRead(leagueId, "getTransactionDetailsHistory", {
    view,
    maxResultsPerPage: String(TRANSACTION_PAGE_SIZE),
  }) as Promise<RawTransactionHistory>;
}

/** The standings page Fantrax draws for itself: the league's points and the record split into W-D-L, which the
 *  fxea `getStandings` lacks. */
export function fetchStandingsPage(leagueId: string): Promise<RawStandingsPage> {
  return fxpaRead(leagueId, "getStandings") as Promise<RawStandingsPage>;
}

/** The whole season's settled results, one table per period: the `SCHEDULE` tab, their page's "Results". */
export function fetchSeasonResults(leagueId: string): Promise<RawSchedulePage> {
  return fxpaRead(leagueId, "getStandings", { view: "SCHEDULE" }) as Promise<RawSchedulePage>;
}

/** Every team's totals per category, the `SEASON_STATS` view. Unasked it counts every period of the calendar; a
 *  `range` (BY_DATE, days in Fantrax's zone) counts only its own days. */
export function fetchSeasonStats(leagueId: string, range?: { startDate: string; endDate: string }): Promise<RawSeasonStats> {
  const timeframe = range === undefined ? {} : { timeframeType: "BY_DATE", ...range };
  return fxpaRead(leagueId, "getStandings", { view: "SEASON_STATS", ...timeframe }) as Promise<RawSeasonStats>;
}

/** Every team's fantasy points for one period. `matchupId` is ignored and the period is not echoed back;
 *  `playerViewType: "2"` is their "Show bench", which adds the priced reserves. */
export function fetchLiveScoring(leagueId: string, period: number): Promise<RawLiveScoring> {
  return fxpaRead(leagueId, "getLiveScoringStats", {
    period: String(period),
    playerViewType: "2",
  }) as Promise<RawLiveScoring>;
}

/** One London day of a period, as the live-scoring page's Timeframe → Date view asks for it.
 *  A period's days sum to its total; a date after the period's last match day answers that last day again. */
export function fetchLiveScoringDay(leagueId: string, period: number, date: string): Promise<RawLiveScoring> {
  return fxpaRead(leagueId, "getLiveScoringStats", {
    sppId: "-1",
    viewType: "1",
    period: String(period),
    date,
    newView: true,
    playerViewType: "2",
  }) as Promise<RawLiveScoring>;
}

/** One team's roster page for a period, which carries its bench order for the end-of-period substitutions. */
export function fetchTeamRosterInfo(leagueId: string, teamId: string, period: number): Promise<RawTeamRosterInfo> {
  return fxpaRead(leagueId, "getTeamRosterInfo", { teamId, period: String(period) }) as Promise<RawTeamRosterInfo>;
}

/** One team's squad with a SEASON's points per category. No period: Fantrax answers the same points for every one.
 *  It prices a man at his `defaultPosId`, not his roster slot, so no lineup reads it. */
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
