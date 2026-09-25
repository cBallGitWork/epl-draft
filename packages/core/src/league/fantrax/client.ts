import { FANTRAX_FXEA_BASE, FANTRAX_SPORT, TRANSACTION_PAGE_SIZE } from "../../config";
import { kindOfStatus } from "../../http/errors";
import { politeFetch } from "../../http/fetch";
import { readJson } from "../../http/json";
import type { TransactionView } from "../types";
import { FantraxError, errorEnvelope } from "./errors";
import { fxpaRead } from "./fxpa";
import { demoFxea, isDemo } from "./demo";
import type { RawStandingsPage } from "./standingsPage";
import type { RawLiveScoring } from "./livescoring";
import type { RawSchedulePage } from "./results";
import type { RawSeasonStats } from "./seasonStats";
import type { PositionGroup } from "./playerStats";
import type { RawPlayerProfile } from "./profile";
import type { RawPoolStats, RawStatTables } from "./stats";
import type { RawNewsSection, RawPoolNews } from "./playerNews";
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
  // The demo league is a source like any other and is answered here, at the one
  // place every fxea read passes through, so nothing downstream branches on it.
  if (params.leagueId !== undefined && isDemo(params.leagueId)) {
    const canned = demoFxea(method);
    if (canned !== null) return canned as T;
    throw new FantraxError(method, "DEMO_UNMAPPED", "the demo league has no answer for this read");
  }

  const url = `${FANTRAX_FXEA_BASE}/${method}?${new URLSearchParams(params)}`;
  const res = await politeFetch(url);

  // A backstop only. Fantrax reports its own refusals with a 200 and an error
  // body, so this fires for transport failures, not for anything it means.
  if (!res.ok) throw new FantraxError(method, String(res.status), res.statusText, kindOfStatus(res.status));

  const body = await readJson(res, "Fantrax", method);
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
 *  **A past period returns stored state, not today's roster relabelled**
 *  (probed 28 Aug, rehearsal league, and it took a change to see it). A forward
 *  was claimed on `test2` that morning and another dropped: `?period=1` went on
 *  serving the man who left while `?period=2`, `?period=3` and the no-parameter
 *  read all carried the man who arrived. Period 1's answer matched every capture
 *  from 12 Aug to that morning's 07:48Z, which is the state before the claim.
 *
 *  So the parameter SELECTS, and it selects squad membership and not merely the
 *  arrangement — two reads of one league seconds apart disagree about who is
 *  rostered. The echo was never the evidence and still is not; the divergence
 *  is. Nothing could show this until somebody changed something, which is why
 *  eight months of identical reads said nothing either way.
 *
 *  **What instant a period freezes at is still open**: its own lineup lock, or
 *  the moment Fantrax's editable period moves past it. Here those were three
 *  days apart and no roster changed between them, so this probe cannot see the
 *  difference, and it is why `squads.ts` asks for a past period only when
 *  Fantrax's own label has moved past it AND our calendar says its lineups
 *  locked: that conjunction is false throughout every window the freeze instant
 *  could matter in, so the answer is not needed. See `periodToRead`. */
export function fetchTeamRosters(leagueId: string, period?: number): Promise<RawTeamRosters> {
  return fxeaGet<RawTeamRosters>("getTeamRosters", {
    leagueId,
    ...(period === undefined ? {} : { period: String(period) }),
  });
}

/** The fxea table. Kept for the snapshots and the shape diff, and read by no
 *  screen: it carries no points column and squashes the record into one string,
 *  which is what moved the table onto `fetchStandingsPage`. */
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

/** Everything written about one player, newest first.
 *
 *  **`tab` is the parameter that reaches a profile's sections**, and it took
 *  eleven guesses to find — `playerNews.ts` lists them. It takes the `code` off
 *  the payload's own `sections` list, and it opens the other four sections too:
 *  `TEAM_SERVICE_TIME`, `GAME_LOG_FANTASY`, `TRANSACTIONS_FANTASY` and `SPLITS`
 *  all answer, none of which anything reads yet. */
export function fetchPlayerStories(leagueId: string, playerId: string): Promise<RawNewsSection> {
  return fxpaRead(leagueId, "getPlayerProfile", {
    playerId,
    tab: "NEWS_NOTES",
  }) as Promise<RawNewsSection>;
}

/** The pool's last day of news, in one request.
 *
 *  **One read for every player on a screen**, which is the whole reason it is
 *  worth having beside `fetchPlayerStories`: that one is a request per tap and a
 *  fifteen-man team sheet cannot make fifteen of them. This answers all of them
 *  at once, at the cost of only ever knowing about today.
 *
 *  `poolType` is REQUIRED — the call refuses with `MISSING_PARAM` without it —
 *  and `POOL` and `ALL` came back byte-identical, so `ALL` is the honest name for
 *  what it is. The league id is carried because fxpa takes one, not because the
 *  answer depends on it; both leagues returned the same 74 stories. */
export function fetchPoolNews(leagueId: string): Promise<RawPoolNews> {
  return fxpaRead(leagueId, "getPlayerNews", { poolType: "ALL" }) as Promise<RawPoolNews>;
}

/** The standings page Fantrax draws for its own site: the table and the badges,
 *  in one request.
 *
 *  Public, and a different read from `fetchStandings` despite the shared method
 *  name: that one is fxea and answers an array of rows, this one is fxpa and
 *  answers the page. The page is the one that carries the league's POINTS —
 *  three for a win here — and its record split into wins, draws and losses, so
 *  the table is mapped from here and the fxea read is left to the snapshots. */
export function fetchStandingsPage(leagueId: string): Promise<RawStandingsPage> {
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

/** Every team's season totals per category, in one request.
 *
 *  Public, the third of `getStandings`' three views — `displayedLists.tabs`
 *  names them all, which is where the argument comes from rather than a guess.
 *  It answers 29 tables: a summary, four per-position roll-ups and 22
 *  single-category leaderboards split into a goalkeeper block and an outfielder
 *  block. `mapSeasonStats` carries the two traps that split creates. */
export function fetchSeasonStats(leagueId: string): Promise<RawSeasonStats> {
  return fxpaRead(leagueId, "getStandings", { view: "SEASON_STATS" }) as Promise<RawSeasonStats>;
}

/** Every team's fantasy points for one period, as Fantrax scores them.
 *
 *  Public, despite sitting on the SPA surface beside methods that are not — the
 *  line runs per method, not per surface. `period` is honoured; `matchupId` is
 *  not, so one call answers for the whole league and filtering is ours to do.
 *
 *  The period is sent as a string, as their own client sends it, and is not
 *  echoed back: what period this describes is known only because we asked.
 *  `playerViewType: "2"` is their "Show bench", and adds the priced reserves. */
export function fetchLiveScoring(leagueId: string, period: number): Promise<RawLiveScoring> {
  return fxpaRead(leagueId, "getLiveScoringStats", {
    period: String(period),
    playerViewType: "2",
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
  /** Which half of the pool, and **the switch that turns raw stats on**.
   *
   *  Omitted or `"ALL"`, this read answers 7 fantasy columns — `Rk Sta Opp FPts
   *  FP/G Ros +/-` — and no raw stat at all. Named, it answers 18 for the
   *  outfield (`GP Min G A AF YC RC PKM OG GAO CS`) and 20 for keepers (`GP Min
   *  CS GA Sv YC RC PKS PKM G A AF OG`).
   *
   *  Nothing in the payload says so. `data.tabs` and `scoringCategoryTypes`
   *  enumerate what the read offers and neither mentions this parameter, and
   *  `hideStatsFilter: true` comes back on every response — so eight probes of
   *  `statsType` and `scoringCategoryType` concluded, coherently and wrongly,
   *  that Fantrax does not publish per-player raw stats for EPL. It does. The
   *  parameter came off Craig's own browser URL on 1 Sep 2026, and PLATFORM_NOTES
   *  records the near-miss because reading the response harder would never have
   *  found it. */
  positionOrGroup?: PositionGroup,
): Promise<RawPoolStats> {
  return fxpaRead(leagueId, "getPlayerStats", {
    statusOrTeamFilter: "ALL",
    pageNumber: "1",
    maxResultsPerPage: String(perPage),
    ...(positionOrGroup ? { positionOrGroup } : {}),
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
