# The ingestion map

Every source this repo reads, who reads it, where the answer lands and what notices when it
stops. Start here; the files beside this one go deep on one provider each
([`premier-league-api.md`](premier-league-api.md), [`live-reporting.md`](live-reporting.md),
[`intel-export.md`](intel-export.md)), and `.claude/rules/providers.md` holds the probed field
counts.

It describes the tree as it stands on 25 Sep 2026. The **Target** column says where the ingestion
refactor (25 Sep to 7 Oct) moves each piece; that column is the only place a path may not exist
yet. `scripts/ingestion-map.test.ts` fails when a path here is wrong, when a fetching file, a
scheduled workflow or a cached read is missing, or when a cron line differs from its workflow.

## The pipeline

```
provider   → core client   packages/core/src/<layer>/<provider>/client.ts, the only code that fetches
client     → mapper        raw*.ts mirrors the answer; map.ts turns it into domain types, pure
mapper     → caller        an app cached read (unstable_cache / leagueCache) or a script (npm run …)
caller     → lands         the Next data cache, keyed, or a committed file under data/
lands      → shown         a screen (cached read or static import) or the paper (scripts/write-edition.ts)
```

Two layers, never joined inside core: **football** (FPL, the Premier League, YouTube, the BBC,
Scout, the sister repo) and **league** (Fantrax). All HTTP goes through `politeFetch` in
`packages/core/src/http/fetch.ts`: a browser User-Agent, a 15 s deadline per attempt, and two
retries on 429 or any 5xx with the backoff in `packages/core/src/http/backoff.ts`.

## Sources

| Source | Layer | Client | Raw types | Mapper(s) | Called by | Cadence | Lands in | Failure today | Watcher | Target |
|---|---|---|---|---|---|---|---|---|---|---|
| **FPL** bootstrap, fixtures, event live, element-summary, regions | football | `packages/core/src/football/fpl/client.ts` | `packages/core/src/football/fpl/raw.ts` | `packages/core/src/football/fpl/map.ts`, `packages/core/src/football/snapshot.ts` (`getFootballSnapshot`), `packages/core/src/football/matchSheet.ts`, `packages/core/src/football/gameLog.ts`, `packages/core/src/football/seasons.ts` | app: `apps/companion/app/football.ts`, `apps/companion/app/players/[fantraxId]/scouting.ts`, `apps/companion/app/players/[fantraxId]/grid.ts`. Scripts: `scripts/build-bridge.ts`, `scripts/period-alignment.ts`, `scripts/scout-xi.ts`, `scripts/intel-check.ts`, `scripts/intel-cups.ts`, `scripts/ingest-pressers.ts`, `scripts/write-edition.ts`, `scripts/edition/predictions.ts`, `scripts/smoke.ts` | request time, 20–30 s; regions 6 h | cache only (see Cached reads); nothing persisted | non-2xx throws `Error`; a failed live read becomes `live: null` for the window; `offerLive` fails open | none; smoke in `.github/workflows/verify.yml` walks every route | `fetchJson`; app reads → `apps/companion/app/_reads/fpl.ts`, one element-summary cache |
| **FPL** entry and picks | football | `packages/core/src/fpl-entry/client.ts` | `packages/core/src/fpl-entry/raw.ts` | `packages/core/src/fpl-entry/map.ts` | app: `apps/companion/app/fpl/entry.ts` | request time, 30 s, per entry id; event live per gameweek | caches `fpl-entry` and `fpl-score-lines` (event live, through football's `fetchLive`, mapped by `mapScoreLines`) | 404 → null (unknown id, no picks yet); anything else throws | none | `fetchJson`; `apps/companion/app/_reads/fpl.ts` |
| **Premier League** API: round, fixture, textstream, match stats, a man's match | football | `packages/core/src/football/premierleague/client.ts` | `packages/core/src/football/premierleague/raw.ts`, `packages/core/src/football/premierleague/rawStats.ts` | `packages/core/src/football/premierleague/map.ts` and the files beside it | app: `apps/companion/app/plFeed.ts`, through `apps/companion/app/commentary.ts`, `apps/companion/app/matchFeed.ts`, `apps/companion/app/matchDetail.ts`; `apps/companion/app/matchParts.ts` for a player card. Scripts: `scripts/pl-bridge.ts`, `scripts/edition/matchday.ts`, `scripts/edition/dodgers.ts` | request time: round 20 s, detail 30 s, textstream 300 s; pl-bridge by hand after a round | caches `pl-*`; `data/mappings/premierleague.json` | non-2xx throws `Error`; app callers catch it and drop the block | none | `fetchJson`; `apps/companion/app/_reads/premierleague.ts`; `scripts/ingest/pl-bridge.ts` |
| **YouTube** highlights playlist (RSS) | football | `packages/core/src/football/highlightsClient.ts` | none (XML text) | `packages/core/src/football/highlights.ts` | app: `apps/companion/app/plFeed.ts` | request time, 30 s | cache `youtube-highlights` | non-2xx throws; the caller shows no video | none | `packages/core/src/football/youtube/`; `apps/companion/app/_reads/youtube.ts` |
| **BBC** football RSS | football | `packages/core/src/news/client.ts` | `packages/core/src/news/raw.ts` | `packages/core/src/news/map.ts` | `scripts/edition/facts.ts` | each editions firing | the paper's brief; nothing stored | non-2xx throws; `facts.ts` catches it and the paper files without news | none | `fetchText`; otherwise stays |
| **Scout** team news, the predicted elevens | football | none — `politeFetch` in `scripts/scout-xi.ts` | none (HTML) | `packages/core/src/football/intel/scout.ts` (`parseScoutXi`) | `scripts/scout-xi.ts` | every 2 h at :40 | `data/intel/xi/26-27.json`, rewritten only when an eleven changes | non-2xx throws; a page that does not parse into every club's eleven exits 1 and writes nothing | `scripts/intel-check.ts`: an eleven for a round already played fails | `packages/core/src/football/scout/`; `scripts/ingest/xi.ts` |
| **Fantrax fxea**: `getLeagueInfo`, `getTeamRosters`, `getStandings`, `getDraftResults`, `getPlayerIds` | league | `packages/core/src/league/fantrax/client.ts` (`fxeaGet`) | `packages/core/src/league/fantrax/raw.ts` | `packages/core/src/league/fantrax/map.ts`, `packages/core/src/league/fantrax/rosters.ts`, `packages/core/src/league/fantrax/draft.ts` | app: `apps/companion/app/round.ts`, `apps/companion/app/scoring.ts`, `apps/companion/app/squads.ts`, `apps/companion/app/players/pool.ts`, `apps/companion/app/league/schedule/schedule.ts`, `apps/companion/app/players/[fantraxId]/draft.ts`. Scripts: `scripts/capture-fantrax.ts`, `scripts/shape-diff.ts`, `scripts/bridge-check.ts`, `scripts/team-codes.ts`, `scripts/write-edition.ts`, `scripts/scoring.ts`, `scripts/edition/facts.ts`, `scripts/edition/predictions.ts`, `scripts/smoke.ts` | request time, 30 s (draft 24 h); capture daily 05:10 UTC | caches `league-info`, `league-scoring`, `league-squads`, `league-pool`, `schedule-season`, `draft-results`; `data/snapshots/fantrax/leagues/<key>/<date>/`, `data/snapshots/fantrax/pool/<date>/` | an error envelope or a modelled 4xx is a refused `FantraxError`, which the app's `orRefusal` caches as a refusal for the window; a 403, 429, 5xx, network error or HTML body is not, and throws through to `leagueCache` (last good answer when warm, the site's degrade when cold); capture records any `ProviderError` in the manifest, finishes every league and exits 1 once all is written | `scripts/capture-status.ts` daily; `scripts/shape-diff.ts` by hand before a push; `scripts/bridge-check.ts` in verify | `ProviderError`; `apps/companion/app/_reads/fantrax.ts`; `scripts/ingest/snapshots.ts` |
| **Fantrax fxpa**: ten fetchers, see Fantrax methods | league | `packages/core/src/league/fantrax/fxpa.ts` (`fxpaRead`), called from `packages/core/src/league/fantrax/client.ts` (the league's reads) and `packages/core/src/league/fantrax/playerClient.ts` (a player's) | beside each mapper (see Fantrax methods) | the same files | app: `apps/companion/app/standings.ts`, `apps/companion/app/scoreboard.ts`, `apps/companion/app/business.ts`, `apps/companion/app/poolNews.ts`, `apps/companion/app/teamStats.ts`, `apps/companion/app/players/playerStats.ts`, `apps/companion/app/players/pool.ts`, `apps/companion/app/players/[fantraxId]/subject.ts`, `apps/companion/app/players/[fantraxId]/dossier.ts`, `apps/companion/app/league/schedule/schedule.ts`, `apps/companion/app/league/team-stats/seasonStats.ts`, `apps/companion/app/scoringDay.ts`. Scripts: `scripts/capture-fantrax.ts` (transactions), `scripts/shape-diff.ts`, `scripts/edition/facts.ts`, `scripts/edition/predictions.ts` | request time, 30 s (season code 6 h); capture daily | caches (see Cached reads); transaction logs in the league's snapshot day | as fxea, plus `pageError` and `responses[].errors`; `FANTRAX_LEAGUE_ID=demo` is answered from `packages/core/src/league/fantrax/demoPayloads.json` for both surfaces | `scripts/shape-diff.ts` covers four of the ten | `rawGrid.ts`, `grid.ts`, `statSheet.ts` in `packages/core/src/league/fantrax/`; `apps/companion/app/_reads/fantrax.ts` |
| **Fantrax setup page** (commissioner HTML, cookie) | league | none — `politeFetch` with `FANTRAX_COOKIE` in `scripts/roster-limits.ts` | none (HTML) | a regex over `addPosition(…)` in the script | `scripts/roster-limits.ts`; the app reads its file in `apps/companion/app/rosterMinimums.ts` | by hand; again after the draft | `data/leagues/roster-limits.json` | non-2xx throws; a league with no position table is recorded `unreadable`; all unreadable throws (stale cookie) | none | `packages/core/src/league/fantrax/setupPage.ts`; `scripts/ingest/roster-limits.ts` |
| **Sister repo** intel files, read from disk | football | none — static imports in `apps/companion/app/intel.ts`; `readIntel` in `scripts/intel.ts` | `packages/core/src/football/intel/types.ts` and beside each reader | readers in `packages/core/src/football/intel/` | app: `apps/companion/app/intel.ts` (14 files). Scripts: `scripts/edition/xi.ts`, `scripts/edition/pressers.ts`, `scripts/edition/predictions.ts`, `scripts/scout-xi.ts` | `make export-epl-draft` in `~/ai-carling-premiership`, by hand (depth too since 7 Oct); careers exported by hand on 25 Sep | `data/intel/<kind>/26-27.json` | the app: a file that will not parse fails the build. Scripts: absent is null, unparseable throws | `scripts/intel-check.ts`: all 15 files, each against its kind's age limit (`INTEL_AGE_LIMIT_DAYS`, `core:football/intel/freshness.ts`) | `apps/companion/app/_reads/files.ts`; `stats.ts` joins the readers |
| **Presser ingest**: the sister repo's Scout scrape plus FPL | football | none — reads `FFS_SCRAPE_DIR` from disk and FPL through `getFootballSnapshot` | none (HTML) | `scripts/ingest/presserArticle.ts`, `scripts/ingest/presserSignals.ts` | `scripts/ingest-pressers.ts <day>`, no npm script | by hand, Thursday and Friday | `data/intel/pressers/26-27.json` | throws when the day has no scrape; an unmatched name is printed, never guessed | none | `scripts/ingest/pressers.ts` |
| **Sister repo team match log**: each club's cup and European ties | football | none — `scripts/intel-cups.ts` reads `~/ai-carling-premiership/data/match_logs/team_match_log/` (parquet, through `hyparquet`), the sister's team and match identity files and FotMob's raw `_meta.json` (`SISTER_REPO` overrides the path), and FPL's bootstrap through `fetchBootstrap`; read-only over the sister repo | `TmlRow` in `packages/core/src/football/intel/cups.ts` | `packages/core/src/football/intel/cups.ts` (`tmlCupTies`, `cupIntel`, `seasonRun`) | `npm run intel-cups`; app: `apps/companion/app/intel.ts`, drawn by `apps/companion/app/prem/club/[code]/fixtures/page.tsx` | by hand, after the sister rebuilds its log | `data/intel/cups/26-27.json`, keyed by FPL club code | no log, or a club the bridge cannot reach, throws and writes nothing; a status other than played or to come is left out and printed; a competition with no name is kept and printed, and the page prints a dash | `scripts/intel-check.ts`, 8 days | the sister's `make export-epl-draft`, when it writes `cups` |
| **The paper's model calls** (Anthropic, OpenAI) | — | `scripts/edition/newsroom.ts`, `scripts/edition/image.ts` | — | — | `scripts/write-edition.ts` | each editions firing | `data/editions/`, `apps/companion/public/paper/` | out of scope for this map | — | untouched |

## Fantrax methods

fxea is `GET {FANTRAX_FXEA_BASE}/{method}`; fxpa is one `POST {FANTRAX_FXPA_BASE}` per question.
The fifteen JSON reads need no cookie; the setup page does.

| Our fetcher | Method | Params / view | Raw type | Recorded fixture | Anonymous? | Target |
|---|---|---|---|---|---|---|
| `fetchLeagueInfo` | fxea `getLeagueInfo` | `leagueId` | `RawLeagueInfo`, `packages/core/src/league/fantrax/raw.ts` | `packages/core/src/league/fantrax/__fixtures__/leagueInfo.json`, `packages/core/src/league/fantrax/__fixtures__/leagueInfoDrafted.json` | yes | stays |
| `fetchTeamRosters` | fxea `getTeamRosters` | `leagueId`, optional `period` (selects, and is echoed) | `RawTeamRosters`, `packages/core/src/league/fantrax/raw.ts` | `packages/core/src/league/fantrax/__fixtures__/teamRosters.json` | yes | stays |
| `fetchStandings` | fxea `getStandings` | `leagueId` | `RawStandings`, `packages/core/src/league/fantrax/raw.ts` | `packages/core/src/league/fantrax/__fixtures__/standings.json` | yes | snapshots and shape-diff only |
| `fetchDraftResults` | fxea `getDraftResults` | `leagueId` | `RawDraftResults`, `packages/core/src/league/fantrax/raw.ts` | `packages/core/src/league/fantrax/__fixtures__/draftResults.json`, `packages/core/src/league/fantrax/__fixtures__/draftCompleted.json` | yes | `DraftPick` → `league/types.ts` |
| `fetchPlayerPool` | fxea `getPlayerIds` | `sport=EPL`, no league | `RawPlayerPool`, `packages/core/src/league/fantrax/raw.ts` | `packages/core/src/league/fantrax/__fixtures__/playerPool.json` | yes | stays |
| `fetchStandingsPage` | fxpa `getStandings` | no view (`REGULAR_SEASON`) | `RawStandingsPage`, `packages/core/src/league/fantrax/standingsPage.ts` | `packages/core/src/league/fantrax/__fixtures__/standingsPage.json` | yes | stays |
| `fetchSeasonResults` | fxpa `getStandings` | `view: SCHEDULE` | `RawSchedulePage`, `packages/core/src/league/fantrax/results.ts` | `packages/core/src/league/fantrax/__fixtures__/seasonResults.json`, `packages/core/src/league/fantrax/__fixtures__/seasonResultsLive.json` | yes | `PeriodResult` → `league/types.ts` |
| `fetchSeasonStats` | fxpa `getStandings` | `view: SEASON_STATS` | `RawSeasonStats`, `packages/core/src/league/fantrax/seasonStats.ts` | `packages/core/src/league/__fixtures__/seasonStats.json` | yes | `CategoryLine` → `league/types.ts` |
| `fetchLiveScoring` | fxpa `getLiveScoringStats` | `period`, `playerViewType: "2"` (adds the bench) | `RawLiveScoring`, `packages/core/src/league/fantrax/livescoring.ts` | `packages/core/src/league/fantrax/__fixtures__/liveScoring.json`, `packages/core/src/league/fantrax/__fixtures__/liveScoringBench.json`, `packages/core/src/league/fantrax/__fixtures__/liveScoringPlayed.json`, `packages/core/src/league/fantrax/__fixtures__/liveScoringUnplayed.json` | yes | stays |
| `fetchPoolStats` | fxpa `getPlayerStats` | `statusOrTeamFilter: ALL`, page size, optional `positionOrGroup` (turns raw stats on) and `seasonOrProjection` | `RawPoolStats`, `packages/core/src/league/fantrax/stats.ts`; read as `RawPlayerStats` (`packages/core/src/league/fantrax/playerStats.ts`) per position | `packages/core/src/league/fantrax/__fixtures__/poolStats.json` (no `positionOrGroup`) | yes | one raw type in `rawGrid.ts`; `statSheet.ts` |
| `fetchTeamStats` | fxpa `getTeamRosterInfo` | `teamId`, `view: FPTS`, optional `seasonOrProjection` | `RawStatTables`, `packages/core/src/league/fantrax/stats.ts` | `packages/core/src/league/fantrax/__fixtures__/teamStats.json` | yes; refuses until a league has a team | `rawGrid.ts` |
| `fetchPlayerProfile` | fxpa `getPlayerProfile` | `playerId` | `RawPlayerProfile`, `packages/core/src/league/fantrax/profile.ts` | `packages/core/src/league/fantrax/__fixtures__/playerProfile.json` | yes | stays |
| `fetchPlayerStories` | fxpa `getPlayerProfile` | `playerId`, `tab: NEWS_NOTES` | `RawNewsSection`, `packages/core/src/league/fantrax/playerNews.ts` | none; inline in its test | yes | stays |
| `fetchPoolNews` | fxpa `getPlayerNews` | `poolType: ALL` (required) | `RawPoolNews`, `packages/core/src/league/fantrax/playerNews.ts` | none; inline in its test | yes | stays |
| `fetchTransactions` | fxpa `getTransactionDetailsHistory` | `view: CLAIM_DROP` / `TRADE` / `LINEUP_CHANGE`, `maxResultsPerPage` | `RawTransactionHistory`, `packages/core/src/league/fantrax/transactions.ts` | `packages/core/src/league/fantrax/__fixtures__/txClaimDrop.json`, `packages/core/src/league/fantrax/__fixtures__/txTrade.json`, `packages/core/src/league/fantrax/__fixtures__/txLineupChange.json` | yes | stays |
| `scripts/roster-limits.ts` | `createLeague.go?goto=3` (HTML) | `leagueId`, commissioner cookie | none | none | **no** | `fetchSetupPage` + `setupPage.ts` |

## Schedule

Every workflow in `.github/workflows/`, crons in UTC as written. Writers commit through
`scripts/ci/push.sh` (rebase, five tries); no commit step runs with `if: always()` yet.

| Workflow | Cron (UTC) | Runs | Commits, with prefix | Concurrency | Target |
|---|---|---|---|---|---|
| `.github/workflows/capture.yml` | `10 5 * * *` | `npm run capture` | `data/snapshots`, "chore: capture Fantrax {date}" | `capture` | `ingest-snapshots.yml` |
| `.github/workflows/ingest-stats.yml` | `40 5 * * *` | `npm run stats` | `data/intel/stats`, "data: the stats league's counts, {time}" | `ingest-stats` | stays |
| `.github/workflows/intel-check.yml` | `55 5 * * *` | `npm run intel-check` | nothing | none | `check-intel.yml` |
| `.github/workflows/capture-status.yml` | `25 14 * * *` | `npm run capture:status` | nothing | none | `check-captures.yml` |
| `.github/workflows/scout-xi.yml` | `40 */2 * * *` | `npm run scout-xi` | `data/intel/xi`, "data: Scout's predicted elevens, {time}" | `scout-xi` | `ingest-xi.yml` |
| `.github/workflows/ratings.yml` | `20 17,19,21,23 * * 5,6,0,1,2`<br>`20 7 * * *` | `npm run ratings`, priced by the league `recorded.json` names `scoring` | `data/ratings`, "data: ratings, {time}" | `ratings` | stays |
| `.github/workflows/editions.yml` | `0,30 14-23 * * 5`<br>`0,30 10-22 * * 6`<br>`0,30 11-22 * * 0`<br>`0,30 17-22 * * 1,2`<br>`15 6-9 * * 0,1,2`<br>`0,30 17-22 * * 3`<br>`15 6-9 * * 4`<br>`0,30 14-20 * * 4` | asks production `GET /api/league`, then `npm run edition` | `data/editions`, `apps/companion/public/paper`, "data: the paper for {date}" | `editions` | stays |
| `.github/workflows/warm.yml` | `*/30 11-22 * * 6,0`<br>`*/30 17-22 * * 1,5` | curls `/` and `/matchday` | nothing | `warm`, cancels in progress | stays |
| `.github/workflows/verify.yml` | none: push, pull_request | the four gates, smoke per recorded league, `npm run bridge:check` | nothing | none | stays |
| `.github/workflows/claude.yml` | none: PR and issue comments | the `@claude` review | nothing | per PR | stays |

Slots shared today: warm shares every :00 and :30 with editions in the match windows. Editions'
own lines no longer overlap; until 1 Oct 2026 24 of its firings a week ran twice.

## Cached reads

Every provider read the app makes at request time sits in one of these 42, in 25 files (counted 6 Oct
2026; the `leagueCache` row is the helper they share, not a read).
`leagueCache` (`apps/companion/app/leagueCache.ts`) is `unstable_cache` keyed
`[key, FANTRAX_LEAGUE_ID]` and tagged `key:leagueId`, 30 s unless given a window. A refusal Fantrax
meant (`kind: "refused"`) is caught by `orRefusal` inside the cache and held for the window like an
answer. Any other `ProviderError` passes through: a warm key serves its last good answer (Next keeps
a stale entry whose refresh threw) and a cold one returns the call site's `degrade`, never stored.
**Except when nested**: a degrade inside another cache (`leagueInfo` in `readLeague` and
`readCalendar`, the standings read in `getSchedule`) is stored by the outer entry for its window.
All targets are `apps/companion/app/_reads/<provider>.ts`, one leaf read each.

| Function | File | Key | Revalidate (s) | Provider read | Target |
|---|---|---|---|---|---|
| `leagueCache` (helper) | `apps/companion/app/leagueCache.ts` | `[key, league id]` | 30 default | — | `_reads/cache.ts` |
| `currentRound` (`footballNow`) | `apps/companion/app/football.ts` | `football-snapshot` | 20 | FPL bootstrap + fixtures + live, three reads | `_reads/fpl.ts` |
| `gameweekSnapshot` | `apps/companion/app/football.ts` | `football-gameweek` | 30 | the same three, for a named gameweek | `_reads/fpl.ts` |
| `seasonFixtures` | `apps/companion/app/football.ts` | `season-fixtures` | 30 | FPL fixtures, whole season | `_reads/fpl.ts` |
| `regions` | `apps/companion/app/football.ts` | `fpl-regions` | 21600 | FPL regions | `_reads/fpl.ts` |
| `gameweekSheets` | `apps/companion/app/football.ts` | `football-sheets` | 30 | FPL fixtures for one gameweek | `_reads/fpl.ts` |
| `gameweekLive` | `apps/companion/app/football.ts` | `football-live` | 30 | FPL event live | `_reads/fpl.ts` |
| `readEntry` | `apps/companion/app/fpl/entry.ts` | `fpl-entry` | 30 | FPL entry, then picks | `_reads/fpl.ts` |
| `roundScoring` | `apps/companion/app/fpl/entry.ts` | `fpl-score-lines` | 30 | FPL event live, the same URL as `gameweekLive`, kept as each man's scoring lines | `_reads/fpl.ts` |
| `gameLog` | `apps/companion/app/players/[fantraxId]/scouting.ts` | `player-game-log` + code | 30 | FPL element-summary | `_reads/fpl.ts`, one cache with `pastSeasons` |
| `pastSeasons` | `apps/companion/app/players/[fantraxId]/grid.ts` | `past-seasons` + code | 30 | FPL element-summary (same URL) | `_reads/fpl.ts` |
| `plRound` | `apps/companion/app/plFeed.ts` | `pl-round` | 20 | PL fixtures by round | `_reads/premierleague.ts` |
| `plFixture` | `apps/companion/app/plFeed.ts` | `pl-fixture` | 30 | PL fixture detail | `_reads/premierleague.ts` |
| `plStream` | `apps/companion/app/plFeed.ts` | `pl-textstream` | 300 | PL textstream | `_reads/premierleague.ts` |
| `plStats` | `apps/companion/app/plFeed.ts` | `pl-match-stats` | 30 | PL match stats | `_reads/premierleague.ts` |
| `plPlayerMatch` | `apps/companion/app/matchParts.ts` | `pl-player-match` | 30 | PL player stats for one match, one man; a player card asks on open | `_reads/premierleague.ts` |
| `plClubStats` | `apps/companion/app/players/teams/clubSeasons.ts` | `pl-club-stats` | 300 | PL teams, then every club's season stats | `_reads/premierleague.ts` |
| `highlightsFeed` | `apps/companion/app/plFeed.ts` | `youtube-highlights` | 30 | YouTube RSS | `_reads/youtube.ts` |
| `leagueInfo` | `apps/companion/app/round.ts` | `league-info` | 30 | fxea `getLeagueInfo` | `_reads/fantrax.ts` |
| `leagueScoring` | `apps/companion/app/scoring.ts` | `league-scoring` | 30 | fxea `getLeagueInfo` of the league `recorded.json` names `scoring`, its scoring only | `_reads/fantrax.ts` |
| `readCalendar` | `apps/companion/app/round.ts` | `league-calendar` | 30 | none of its own; nests `leagueInfo` and `seasonFixtures` | composer, outside any cache |
| `readLeague` | `apps/companion/app/squads.ts` | `league-squads` | 30 | fxea `getTeamRosters`, once or twice; nests `leagueInfo` and `seasonFixtures`; reads the clock | leaf read + composer |
| `read` | `apps/companion/app/standings.ts` | `standings-page` | 30 | fxpa `getStandings` | `_reads/fantrax.ts` |
| `readScores` | `apps/companion/app/scoreboard.ts` | `live-scores` | 30 | fxpa `getLiveScoringStats` | `_reads/fantrax.ts` |
| `readDeals` | `apps/companion/app/business.ts` | `gazette-deals` | 30 | fxpa `getTransactionDetailsHistory`, two views | `_reads/fantrax.ts` |
| `readPoolNews` | `apps/companion/app/poolNews.ts` | `pool-news` | 30 | fxpa `getPlayerNews` | `_reads/fantrax.ts` |
| `yearToDate` | `apps/companion/app/teamStats.ts` | `fantrax-season-code` | 21600 | fxpa `getPlayerStats`, one row | `_reads/fantrax.ts` |
| `readTeamStats` | `apps/companion/app/teamStats.ts` | `fantrax-team-stats` | 30 | fxpa `getTeamRosterInfo` | `_reads/fantrax.ts` |
| `getPlayerStats` | `apps/companion/app/players/playerStats.ts` | `player-stats` | 30 | fxpa `getPlayerStats`, outfield and keepers | `_reads/fantrax.ts` |
| `statsLeagueSeason` | `apps/companion/app/statsLeague.ts` | `stats-league-season` + columns | 30 | fxpa `getPlayerStats` in the league `recorded.json` names `stats`, outfield and keepers | `_reads/fantrax.ts` |
| `periodsOf` | `apps/companion/app/statsLeague.ts` | `league-periods` + league | 300 | fxea `getLeagueInfo`, its scoring periods | `_reads/fantrax.ts` |
| `settledPeriod` | `apps/companion/app/statsLeague.ts` | `stats-league-period` + league, period, columns | 86400 | fxpa `getPlayerStats` in the stats league, outfield, one finished period | `_reads/fantrax.ts` |
| `openPeriod` | `apps/companion/app/statsLeague.ts` | `stats-league-period-open` + league, period, columns | 30 | the same, for the period under way | `_reads/fantrax.ts` |
| `kindsOf` | `apps/companion/app/assistKinds.ts` | `assist-kinds` + league, period | 300 | fxpa `getPlayerStats`, outfield, one period | `_reads/fantrax.ts` |
| `scoringDay` | `apps/companion/app/scoringDay.ts` | `scoring-day` + day | 300 | fxpa `getPlayerStats` of the league `recorded.json` names `scoring`: its `BY_DATE` code, then outfield and keepers for one London day, three reads in turn | `_reads/fantrax.ts` |
| `readPool` | `apps/companion/app/players/pool.ts` | `league-pool` | 30 | fxea `getPlayerIds`, `getLeagueInfo`, `getTeamRosters` and fxpa `getPlayerStats`, four reads | `_reads/fantrax.ts` |
| `heldDraft` | `apps/companion/app/players/[fantraxId]/draft.ts` | `draft-results` | 86400 | fxea `getDraftResults`; used only once it has picks, which `mapDraftPicks` gives only for a completed draft | `_reads/fantrax.ts`, window in config |
| `runningDraft` | `apps/companion/app/players/[fantraxId]/draft.ts` | `draft-running` | 30 | fxea `getDraftResults`, asked while the held board is empty | `_reads/fantrax.ts` |
| `readProfile` | `apps/companion/app/players/[fantraxId]/subject.ts` | `player-profile` | 30 | fxpa `getPlayerProfile` | `_reads/fantrax.ts` |
| `playerStories` | `apps/companion/app/players/[fantraxId]/dossier.ts` | `player-stories` + fantraxId, **no league id** | 30 | fxpa `getPlayerProfile` `NEWS_NOTES`; filters on a `now` passed in | `leagueCache` in `_reads/fantrax.ts` |
| `getSchedule` | `apps/companion/app/league/schedule/schedule.ts` | `schedule-season` | 30 | fxea `getLeagueInfo`; nests `seasonFixtures` and the standings read | leaf read + composer |
| `getSeasonResults` | `apps/companion/app/league/schedule/schedule.ts` | `schedule-results` | 30 | fxpa `getStandings` `SCHEDULE` | `_reads/fantrax.ts` |
| `readSeasonStats` | `apps/companion/app/league/team-stats/seasonStats.ts` | `season-stats` | 30 | fxpa `getStandings` `SEASON_STATS` | `_reads/fantrax.ts` |

## Glossary

The settled vocabulary. New code uses these words; persisted names are frozen.

| Term | Meaning |
|---|---|
| `code` | FPL's season-stable player code; the only player key we persist |
| `fplCode` | an FPL code, used only on rows that also hold another provider's id |
| `elementId` | FPL's per-season id; never persisted |
| `fantraxId` | Fantrax's player id; `playerId` and `scorerId` appear only in `raw*.ts` and request params |
| club / `clubId` | a real Premier League side |
| team / `teamId` / `teamName` | a manager's fantasy team |
| squad · lineup · team sheet | our players · the arrangement for one period · a PL club's eleven |
| fixture · matchup | a PL match · a fantasy head-to-head |
| table · standings | the PL table · the fantasy table |
| `gameweek` · `period` · `Round` | FPL's 1–38 · a Fantrax scoring period · the `{gameweek, period}` pair; a bare number is never "round" |
| `SEASON` · `INTEL_SEASON` · `seasonCode` · `compSeason` | "2026/27" · "26-27" · Fantrax's `SEASON_9xx_…` · the PL's 841 |
| `fetchedAt` | when our code received an answer; persisted names are frozen |
| fetch · parse · map · read | network, clients only · text → raw · raw → domain · disk or cache |
| capture · ingest | verbatim → `data/snapshots/` · fetch and join → a derived committed file |
| check · probe · write | read-only, with an exit code · one question → `data/probes/` · the paper |
| npm names | will become `ingest:*`, `check:*`, `probe:*` |
| exit codes | 0 ok, including unchanged · 1 a finding, or refused to write · 2 could not answer |

## Reliability contract (target)

Landed 1 Oct 2026: the three kinds on `ProviderError`, `orRefusal` catching `refused` only, and
`leagueCache`'s degrade.

- Each attempt has its own deadline.
- Retry only idempotent requests, and only on 429, 502–504 and quick network errors; never a
  timeout. `Retry-After` is honoured up to a cap.
- A failure is a `ProviderError` of kind `refused` (an envelope, or a 4xx we model),
  `unreachable` (network, timeout, 403, 429, 5xx) or `malformed` (a 2xx without the expected
  shape). The app shows the modelled state for `refused`, cached as normal; the last good value
  for the other two when the key is warm, and the Unavailable panel, never stored, when it is
  cold. Anything else is our bug, for `error.tsx` or `global-error.tsx`.
- One provider read per cached function; no clock inside a cache; the league id in every league
  key.
- Committed files are written atomically, a temp file then a rename. Only `ENOENT` means absent;
  a corrupt file throws.
- Cron commit steps run with `if: always()` behind their parse guards; no two cron lines fire in
  the same slot.

## Add a source in five steps

1. **Client.** `packages/core/src/<layer>/<provider>/client.ts` is the only file that fetches,
   through `politeFetch`; its URL goes in `packages/core/src/config.ts`. Record one real answer
   in `__fixtures__/` beside it.
2. **Raw and map.** `raw.ts` mirrors the answer with every field optional; `map.ts` is pure,
   takes `fetchedAt` and `now`, and is tested against the fixture.
3. **Caller.** At request time, one cached read with the league id in its key. On a schedule, a
   script that writes into `data/` and exits 0, 1 or 2, and a workflow with its own concurrency
   group, a free cron slot and `scripts/ci/push.sh`.
4. **Watcher.** A check that exits 1 when the source goes stale, on a workflow of its own.
5. **Map.** Its rows here, and in `data/README.md` if it lands in `data/`. The map test fails
   until they exist.
