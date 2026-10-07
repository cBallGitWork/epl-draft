# Platform notes

This file is our living season log and platform journal.
Update it whenever we make architecture decisions, discover API quirks, or
capture season-specific tradeoffs.

> **The dated session narrative lives in [`docs/record/SEASON_LOG.md`](SEASON_LOG.md).**
> Split out 3 Sep 2026 at 4,784 lines, of which about 3,400 were a diary. This
> file is the standing half — what is true now, what was probed and must not be
> re-derived, what was decided, and which rules have recorded exceptions — and it
> is meant to be read. The log is meant to be searched.
>
> The rule for which half a section belongs in: **a standing fact, a probe
> result, a decision or a rule stays here; an account of a day's work moves.**
> `docs-drift-auditor` exempts a season log from drift-checking because its
> dated entries are supposed to describe the past — after the split that
> exemption belongs to `docs/record/SEASON_LOG.md`, and everything left here is auditable,
> which is the point of doing it.

## Purpose

- Track what the platform is doing now versus what Fantrax is doing.
- Record design decisions that matter for next season.
- Capture unresolved questions, blockers, and follow-up work.
- Keep a shared source of truth for engineering notes.

## Current season summary

- Start date: 5 Aug 2026.
- Season target: support the **10-user** Fantrax league from GW6 onwards.
  (Craig, 31 Aug 2026 — it had been 16 since the repo started, and every binding
  doc said so. Corrected in CLAUDE.md, docs/rules/PRODUCT.md, docs/rules/DESIGN.md, README.md and
  `docs/ui/`. Entries dated before today in this file still say sixteen and are
  left alone: a log that gets edited to agree with the present is not a log.)
  Nothing in the CODE reads the number — team count is `getLeagueInfo.teamInfo`
  (§3), which answers an empty object for the real league until managers join.
  The one place ten appears is `PANEL_ROWS` in `app/league/Shell.tsx`, and that
  is a floor on how tall a panel is drawn, not a claim about the competition:
  the league's own count wins whenever it is larger.
- A dummy league carries GW1–GW5. It is drafted early and deliberately small, so
  the roster, lineup and join surfaces get five gameweeks of real football to be
  refined against before the real league drafts. GW1 is not a ship date.
- Fantrax remains authoritative for live scoring and league state.
- We are building the platform layer separately so the UI and football data can
  survive provider changes.

## Alerts are issues assigned to the owner — decided 7 Oct 2026

Craig, 7 Oct: "silent not acceptable". intel-check had been red 10 of 17 days, capture failed 26–28 Sep, the
sister's Scout scrape stopped on 28 Sep for nine days, and `warm.yml` went red three times on 5 Oct, all unseen:
GitHub mails a failed cron only to whoever last edited its line, and the Mac showed a banner at most.

- **One issue per failing job, `alert: <source>`, labelled `alert` and assigned to cBallGitWork**, whom GitHub
  emails. `scripts/ci/alert.sh` opens it on `fail`, comments only after 6 quiet hours (the 30-minute jobs would
  flood the inbox), and closes it on the next `ok`. The repo is public, so a message is a run URL or a sentence.
  No new secrets: `github.token` with `issues: write`.
- **Every scheduled workflow's last step** is `.github/actions/alert`, run `if: always()` with the job's status:
  `fail` for a failure or a cancel (a timeout is a cancel), `ok` for a success. The source is the workflow's file
  name. The watchdog keeps its own inline steps, so a broken action cannot silence the thing that watches.
- **The Mac reaches it through `alert.yml`**, a dispatch whose run name is `alert <source> <state>`.
  `scripts/sync-intel.sh` ends every run in one, `intel-<mode> ok` or `fail`, "nothing changed" included, from an
  `EXIT` trap when it dies. Soft findings have their own sources, so the run's `ok` cannot close them:
  `intel-<mode>-stale`, `intel-scout-scrape`, `intel-pressers-ingest`, `intel-cups`.
- **The Mac exports what the GitHub sweep wrote.** `scripts/sister-export.py` holds the sister's sweep lock, restores
  `derived,signals,match_logs,staging/understat,raw/fpl/live/bootstrap,staging/fpl/<season>` from R2 (the bootstrap
  was 9 days old on the Mac on 7 Oct, and the export reads its gameweek), judges the newest sweep report, then
  exports. Weekly wants Tuesday's own sweep, finished after 05:00 UTC; pressers the sweep the sister's schedule says
  was due (`gw_trigger.full_sweep_due`, through `digest._collect_full_sweep_due`), since sweeps stopped being daily
  on 7 Oct (Mon and Tue 06:30, Thu and Fri 16:30 UK).
- **A job that never ran** reports nothing; a watchdog follows in its own PR. The export moves into the sister's CI
  after GW6.

## Functions run in London (lhr1) — decided 7 Oct 2026

`x-vercel-id` read `lhr1::iad1`: every tap was served from London and rendered in Washington, and most of the league
is in Europe (Craig). #303 set `regions: ["lhr1"]` in `apps/companion/vercel.json`, and
`experimental.staleTimes.dynamic: 30` in `next.config.ts`, matching the server's revalidate. AutoRefresh's
`router.refresh` bypasses that client cache; sign-in, sign-out and the FPL entry call `revalidatePath`, and the lineup
save already calls `updateTag`.

- **Measured, RSC medians before → after**: `/prem` 222 → 166ms, `/prem/club/43` 225 → 134, `/prem/match/41`
  303 → 205, `/players` 430 → 261, `/matchday` 279 → 183. Returning to a tab on a throttled phone: 316–1258ms → 13–116ms.
- **The data cache is per region.** Straight after the move, the first fetch of an old match (`/prem/match/1`, `/2`,
  `/10`) answered 500 once on the cold cache and was fine on a retry. **Open question:** a match page should degrade
  when an upstream fetch fails rather than 500.

## The weekly run stamps every kind, projections and careers included — decided 7 Oct 2026

The sister repo's engine-mode plan (Craig, 7 Oct), fix 2: export projections whatever the app's tab says, plus
careers and league projections with an age check, and a dated weekly snapshot of league projections.

- **Tuesday's run keeps every new stamp**, so an 8-day limit means "the weekly export ran", not "the content
  changed". Pressers runs still drop a manifest-only change. intel-check had gone red on files nothing had changed:
  cups over an international break.
- **Projections every week**, no longer only while `PROJECTIONS_SHOWN`; `npm run draft-pack` reprices them in the
  real league's points (`league-projections`, now with a manifest), and a copy is kept as
  `data/intel/league-projections/weekly/<season>-<date>.json`: a trade is judged by a man's worth that week.
- **Careers** come from `scripts/intel-careers.ts`, the sister's identity store read-only; it reproduced the hand
  export of 25 Sep row for row. Careers and league projections age at 8 days.
- **intel-cups stamps every run again**: PR B had it skip an unchanged file, which this rule would read as stale.
- **SofaScore is kept** (Craig, 7 Oct: "We still use sofa for player positions etc", "Just keep it"). It feeds 31 of
  666 squad positions (`sofascore_band`), the goal and card minutes in `matches`, `touches`, `shots` and the form
  column. A SofaScore break is fixed, never answered by retiring the heat and shot maps.

## A job that never ran is the watchdog's — decided 7 Oct 2026

A failing job can report itself; one that never starts cannot. `watchdog.yml` runs `scripts/watchdog.ts` hourly
06–23 UTC against the rules in `scripts/watchdog/decide.ts`, whose test holds them to every scheduled workflow.

- **Crons owe a success** within their cadence plus grace: 30h for the dailies and editions (crons have run 6h
  late), 26h for scout-xi, 96h for warm (Monday night to Friday), and ratings one between 07:00 and 10:00 UTC.
  A latest run that ended `startup_failure` is a finding too.
- **The Mac's jobs owe a report**: an `alert.yml` run named `alert intel-<mode> ok|fail`, created after the slot
  opened. Deadlines, London: weekly Tue 12:00; pressers Thu 18:00, Fri 14:00 and Fri 18:30. A fail counts as ran,
  because it has been reported.
- **A finding files under the late job's own source**, so the job's next green run closes it. A `gh` error turns
  the watchdog red rather than skipping, and no shared setup action stands between it and its own alert.
- **`capture-status.yml` checks the watchdog** succeeded in the last 3h (`--watchdog`).
- **Testing by hand**: `gh workflow run watchdog.yml -f now=2026-10-08T17:05:00Z -f only=intel-pressers`, or
  `-f now=+31h`; runs after `now` are ignored.

## A signed-in cold open of `/` lands on Mail or Live, so shoot the paper as `/?paper` — decided 6 Oct 2026

Since #285 `proxy.ts` sends a signed-in reader who types, bookmarks or launches `/` (`Sec-Fetch-Site: none`) to
`/start`, which redirects to Live while a gameweek is on and Mail otherwise. A headless browser navigating to `/`
is exactly that, so a shot or a DOM snapshot of a signed-in `/` shows Mail; `/?paper` is the paper for anybody, and
`tools/ui/routes.mjs`' `FRONT_PAGE` uses it.

## A club's fixtures list its cup and European ties, off the sister's match log — decided 6 Oct 2026

Craig, 6 Oct: *"get champs league from sister repo TML, shows all games"*. FPL publishes the league and
nothing else, so `/prem/club/[code]/fixtures` now lists every tie the sister repo's team match log holds
beside the league's fixtures, from `data/intel/cups/26-27.json` (`npm run intel-cups`).

- **Probed 6 Oct, on the log of 2 Oct** (954 rows, one per side of a match): `premier_league` 760,
  `champions_league` 80, `europa_league` 48, `efl_cup` 46, `conference_league` 16, `community_shield` 2,
  `super_cup` 2. Two statuses only: `completed` 170, `scheduled` 784. For FPL's twenty clubs outside the
  league: **105 ties, 43 played and 62 to come** — Champions League 35 to come (five clubs, matchdays 2–8,
  13 Oct to 27 Jan), Europa League 21, Conference League 6. No League Cup round 4 and no FA Cup: the log
  carries a tie once it is drawn.
- **The log names nobody in a tie to come**: `team_name` and `opponent_name` are null on all 62 scheduled
  rows. The opponent is named from FotMob's raw `_meta.json`, reached through the sister's match identity
  (`source_mappings.fotmob_id`): 102 of 105, every kickoff agreeing with the log's. The other three (the
  Super Cup and two Conference ties, all played) carry the log's own name. 105 of 105 named.
- **Clubs key on FPL's `code`**: the sister's team id, its identity's `source_mappings.fpl` (FPL's
  per-season team id, 20 of 20), this season's bootstrap, the code. The per-season id is never written.
- **The exporter is ours, and the sister repo stays read-only.** Its writer is `make export-epl-draft`, in
  the sister repo; until that grows a `cups` file, `scripts/intel-cups.ts` reads the parquet with
  `hyparquet` (MIT, no dependencies, a root dev dependency) and writes only here.
- **On screen** a tie is a row like a league fixture: its competition in the desk's column and under the
  opponent on a phone; an opponent FPL carries keeps his crest and link; a foreign club is a name with
  the crest's room kept, so the names stay in one column; a neutral ground prints `N`; no match page
  stands behind a tie, so its score is plain text. The note under the list that called the page
  Premier League only is gone (Craig: *"remove that row"*).
- **Known gap**: the log carries goals and no shoot-out, so a cup tie settled on penalties prints its
  drawn score (Stoke 1–1 Hull in the League Cup's second round).

## Kits load straight from FPL, not through Vercel's optimizer — decided 5 Oct 2026

On production, `/_next/image` for an FPL kit not already in Vercel's cache answered **502
`OPTIMIZED_EXTERNAL_IMAGE_REQUEST_UNAUTHORIZED`** for 7 of 9 kits tried on 5 Oct (Arsenal and Newcastle among them);
every cached one was a 200. FPL's CDN refuses Vercel's fetch while serving the same file to a browser, our `Referer`
included (200, 25–30 KB). Safari drew the failures as a blue "?" on a rival's pitch. So `PlayerShirt` and
`PlayerImage`'s kit rung set `unoptimized`, and `img-src` already lists FPL's origin. Portraits stay optimized
(~330 KB at source); if they start failing the same way, this is the first place to look.

## FPL's bonus and BPS live on the FPL tab alone — decided 6 Oct 2026

Craig: *"Bonus point system, remove entirely from site except fpl section"*. Off the match log (BPS, B), the career
table (Bon), Compare (BPS, Bonus), the club and competition boards, a match's board (B), the bar (`FT · bonus
provisional` is `FT`), the rankings (BPS) and the attribute grid: **Determination** read FPL's BPS per 90 and is
dropped rather than rebased, since no export count measures the same thing. The match sheet no longer orders by BPS:
each side goes by name, and the scoresheet by what each man did.
`MatchSheetLine.bps` stays mapped as the sheet's appearance list; FPL's bonus, BPS and live defensive contribution
left `PlayerMatchStats`, `MatchSheetLine` and `SeasonTotals` the same day, once nothing read them.

## Every time is printed in London, Fantrax's included — decided 2 Oct 2026

Craig, 2 Oct: *"Times need to be local time"*. Until then Fantrax's transaction stamps (`"Wed Sep 2, 2026,
6:11AM"`, US Eastern with no offset) were re-spelled but never converted, under a `Date (EDT)` head on the paper
and an `ET` in Mail, so the paper printed New York's 6:11am beside our London deadline.

- **One zone prints**: `LEAGUE_TIMEZONE`, through core's `time.ts` formatters. No zone label anywhere.
- **Their stamp is read with its own date's offset**: `fantraxInstant` (`inbox/when.ts`) takes the wall clock in
  `FANTRAX_TIMEZONE`, so EDT or EST follows America's change dates (1 Nov 2026, 14 Mar 2027), not Britain's
  (25 Oct, 28 Mar); in the weeks between, London is four hours ahead, not five. An evening claim moves to London's
  next day, which is the point.
- **The clock is the app's 24-hour one** (`londonTime`, `11:11`), so a deal and the deadline above it in Mail
  read alike; the old stamps' `6:11am` was the only twelve-hour clock in the app.
- `LeagueTransaction.processedAt` stays their string verbatim; `orderKey` still orders it in their own calendar,
  which gives the same order.

## A player card's full match stats: FPL's counts, Opta's DefCon parts — decided 6 Oct 2026

Craig: *"player card full match stats - more relevant stats, like cards/tackles etc"*. Counted over GW5's 302 men who
played, against the stats league's day sheets (Fantrax's own counts):

- **FPL agrees with Fantrax** on goals, cards, own goals, penalties missed and saved, goals conceded, clean sheets and
  saves (302/302), minutes (298/302), and on assists as Fantrax's total `AT` (282/282 outfielders). So those stay FPL's.
- **FPL cannot give our DefCon.** Its `tackles` is every tackle (302/302 against Opta's `total_tackle`), not tackles won
  (83 differ), and `clearances_blocks_interceptions` is one figure. No penalties won, no keeper actions beyond saves.
- **Opta's per-man match read** (`/stats/player/{id}?fixtures={matchId}`) matches Fantrax's tackles won,
  interceptions, clearances, recoveries, penalties won and blocks (`DFP`−`TkW`−`Int`) on 282/282 outfielders, and
  carries smothers, punches and high claims. Its minutes run a minute over Fantrax's for 78 of 302, so minutes stay FPL's.
- The Premier League feed the app already read carries no per-man line: `/stats/match` is two sides of ~156 metrics.
- **What shows**: a row only where the scoring league prices its category at his slot (`join/fullMatchStats.ts`), so
  a defender sees tackles won, interceptions and blocks, a midfielder or forward clearances and recoveries too, and a
  keeper saves, smothers, punches and high claims. FPL's bps, defensive contribution and expected goals left the card.

## A fantasy team is its name: no Fantrax logo is drawn — decided 5 Oct 2026

Craig, 5 Oct: *"remove the fantrax team logos from the site, doesnt look right"*. The badge each manager picked
(`logoUrl512`) and the initial disc that stood in for one are gone; club crests and `LeagueCrest` stay.

## The real league's schedule went in through Fantrax's own schedule editor — written 2 Oct 2026

The 26/27 head-to-head schedule was written with the two fxpa calls the commissioner's schedule editor makes, on
the commissioner's cookie.

- **Read:** `getLeagueSetup {action: "schedules"}`. `matchupMap` is `[{key: period, value: ["awayId_homeId", …]}]`,
  beside `numMatchupsPerPeriod`, `matchupByeId` (`"-1"`), `matchupTbdId` (`"-2"`) and
  `headToHeadRegularSeasonEndPeriod`.
- **Write:** `saveLeagueSetup {action: "scheduleMatchups", matchups: ["<period>|<away>_<home>|…"],
  matchupsEditedManually: true, matchupsReviewed: true}` replaces the regular season's matchups whole. A period
  left out is cleared.
- **A period may hold two matchups per team** (a double header), even with `numMatchupsPerPeriod` at 1.
- **What went in:** GW6–GW34 with no GW21 and a double header in GW34, 145 matchups. Fantrax answered "Matchups
  have been saved", and a re-read matched on 38 of 38 periods.

## Every point we work out is priced by the real league's scoring — decided 1 Oct 2026

Craig, 1 Oct: *"points system repo wide just use real league points system now"*. Before this, our own sums used
the served league's rules: the rehearsal's in production and the dummy's, every category at nought, in local dev.

- **The scoring league is a role in data**, `"scoring": "real"` in `data/leagues/recorded.json`, beside `stats`.
  The app reads it in `apps/companion/app/scoring.ts` (`leagueScoring()`, cache `league-scoring`), live off that
  league's public `getLeagueInfo`. The served league stays the environment's, and Fantrax's own points (FPts, the
  live totals, a man's breakdown) stay the served league's. From go-live the two are one league.
- **Not a rule exception.** The rules still come from `getLeagueInfo` (CODE_RULES §3); data says whose.
- **What it prices:** only what we work out ourselves: the clean sheets Fantrax has not credited yet (head-to-head
  board, squad sheet); the paper's prices (the Bin XI's goal and assist, the Points Dodgers' clean sheet, the draft
  desk's returns and a full match's minutes); and our marks, read off the scoring league's points for the day
  (`scripts/scoring.ts`, `readScoring()`). The draft desk's DefCon and keeper bonus stay what Fantrax paid this week.
- **DefCon points on a squad's Stats tab** (`DCP`, 1 Oct): DefCon pays per match, so each stats-league period begun
  so far is read once (a finished one held a day) and its `DFP`/`DFP3` priced as one match at the man's roster slot
  (`league/defcon.ts`). A period holding two of his matches prices nothing rather than guess the split.
- **A range is read off the settings mirror, never the string.** `scoringCategorySettings` gives each band (`start`,
  `end`, `points`, `interval`), `rangeType` and `cumulative`; the string table has no `cumulative`. The real league's
  outfield minutes were `1|1` cumulative until 1 Oct (2 for 90) and are `1|2` non-cumulative now. Checked on the
  rehearsal's recorded live payloads: every one-match minutes row matched, 90 paying 2 (1 + 1 stacked), and keepers' goals
  against (−1 per 2) and saves (1 per 3) matched Fantrax on every row; the four misses were multi-match totals. A
  `rangeType` other than `PER_GAME`, or a band missing a bound, prices nothing. The top band has no ceiling.
- **The API**: `pointsFor(rules, category, slot, count)` in `league/scoring.ts` prices one match's count at a slot;
  `categoryPoints` stays flat-only. `league/fantrax/scoring.test.ts` pins Craig's 29 Sep table against the real
  league's `getLeagueInfo` of 1 Oct. Turning a football line into the league's counts is the caller's: the rating
  backtest's (`docs/record/ratings-backtest/join_points.py`) matched Fantrax 99.5% for `DFP` (tackles won,
  interceptions, blocks), 99.2% for `DFP3` (those, clearances and recoveries) and 85% for `GKP` (saves, punches,
  high claims).

## The Fantasy Report counts by the real league, and prints FPL's DefCon apart — decided 1 Oct 2026

Craig, 1 Oct, on `/prem/match/41/stats?view=fantasy`: *"use the real league stats"*, DefCon *"only when they get
close"*, and *"show fpl defcon too"*.

- **The counts are the scoring league's own**, not FPL's: `apps/companion/app/scoringDay.ts` reads its
  `getPlayerStats` `BY_DATE` for the match's London day (outfield and keepers, cache `scoring-day`, 300 s). A club plays
  once a day, so his day is his match. The real league's day sheet carries exactly its scored columns (`G AT YC RC
  DFP DFP3 PKM OG GAO CS Min GP Pen`, keepers `GKP PKS GA`), each a count; 18 Sep 2026 read whole on 1 Oct.
- **Close is half the first band, floored**, at `defaultPosition` (no slot on a match page): DFP 3 → 1, DFP3 8 → 4
  and 6 → 3, read off the league's bands (`league/defcon.ts`), never written down.
- **FPL's count prints in its own box, headed `FPL DefCon`, never on a line beside ours.** CLAUDE.md forbids FPL's
  count beside a Fantrax figure; Craig asked for both, so the screen keeps them in two boxes. FPL's threshold is a
  fixed rule (10 CBIT, 12 CBIRT) and lives in the football layer by the team sheet's named position, which stands
  in for FPL's own filing (`football/defensiveContribution.ts`).

## The round-state probe is stopped: the league does not settle on FPL — decided 1 Oct 2026

`round-state.yml` sampled FPL's event-status every hour to learn whether `bonus-settling` was a state a screen could
be in. Nothing read its files, and the league settles on Craig's auto-sub run three hours after the last kick-off
(Craig, 1 Oct). It was about 180 Actions minutes a week, a third of the scheduled spend. The 51 lines it recorded stay
in `data/probes/round-state/`; the workflow, `scripts/round-state-sample.ts` and the npm script are gone.

## The six faces are committed, so a build never asks Google Fonts — decided 1 Oct 2026

`next/font/google` downloaded every face at build time, and a build failed whenever Google did not answer
("queries have exactly one entry", or `fetch failed`, which a rerun cured). The faces now load through
`next/font/local` from `apps/companion/app/fonts/`. Those files are Google's own latin and latin-ext woff2, byte for
byte what the old builds fetched (same SHA-256), each family with its OFL. Vietnamese and Cyrillic were dropped, and
no captured name uses them. Proved on 1 Oct: a clean build with Google unreachable passed, `.next` names no Google
host, and `/` and `/matchday/desk` at 390 and 1440 were pixel-identical to main apart from the clock.
- **One latin-ext range, written six times**: a recorded exception to CODE_RULES §1. next/font reads only literals,
  so the `*Ext` calls in `deskFonts.ts` and `paperFonts.ts` cannot share a constant. Each `*Ext` face leads its stack
  in `tokens.css` or `paper.css`, and its unicode-range keeps it unfetched until a ć or an š appears.
- **The four desk fallbacks are pinned** in `fonts/fallbacks.css` to the figures `next/font/google` generated. Left to
  `next/font/local`, they drew the rail's arrows 2–4% smaller, because those glyphs come from Arial.

## The paper files seven weekly kinds, nothing else — decided 1 Oct 2026

Craig, 1 Oct, on the Anthropic bill (3.8M tokens in, 0.9M out over 30 days, much of it testing): keep the Prem
match reports, the draft report (once, when the gameweek ends; no Saturday edition), the Bin XI, the Team
Sheet, the predicted elevens, the draft sheets at the deadline and Lawro. `newsdesk()` no longer queues news, the wire, the eleven, the power ranking, the dodgers, tie
reports, tie calls or fixture previews, and `DeskState` lost the fields only they read (`started`, `stakes`,
`dealsInWindow`, `news`). Their writers, briefs and prompts stay in the tree until they are deleted after GW6.
The front page leaves the news and the wire already filed off as well (`frontPage`, same day); their articles keep their pages.

## The paper's staff write under ISS names, one per kind of story — decided 30 Sep 2026

Craig: *"need better sports journalists, ISS/pro evo used fake names based on player names, we do the same for
journalists, find the most famous journalist names"*, and on the first draft, *"can go more iss/pro evo, thats one
letter difference"*. So each kind runs under the famous journalist known for that kind of piece, mangled the way ISS
Pro Evolution printed "Roberto Larcos": letters swapped or changed in **both** names, recognisable at a glance, and
**never the real name**. Phill McLunty, Danial Talyor, Garf Crookes, Martyn Masuel, Donny Kaber, Fabrizzio Morano,
Davide Onrstein, and Hendry Wimter for a kind with none. One table, `gazette/staff.ts`, feeds both the byline and the
writer's "You are" line; the byline is resolved from the kind at render, so the archive reads the new names, and a
`reporter` stamped at filing wins. Lawro is not staff: his column keeps his real name. Craig's *"yes bylines"* put
the line-ups under the team-news writer, the front page's lead under its writer, and the writer's name at the head of
the match-report and team-sheet prompts.

## The Prem match report prints our marks in its line-ups, and a Star man — decided 1 Oct 2026

- **Craig**: "put all the ratings in the prem match report", one decimal, and the Star man replaces the Draft Man of the
  Match. Each man's mark sits in the line-up sentence ("Ndiaye 6.3 (Doku 75, 3.4)"), `—` where he was too brief to rate;
  the Star man is the best mark of everyone who played, held or not. The writer never sees the marks.
- **The reads, at filing**: the scoring league's points for the London day (`fetchPoolStats(…, byDate, group, …, day)`,
  every man in its pool, split by `returnPoints`), the stats league's Opta counts for the same day, and the opponent from
  `clubResults` over FPL's past gameweeks. Six Fantrax reads a day, one after another; any failure files the report without
  marks. `byDate` is read from Fantrax's own season list (`SEASON_926_BY_DATE`), never composed.
- **Counted on GW5, 20 Sep**: every man with ten minutes rated except four the bridge does not know (Q. Timber,
  Affengruber, Fofana, Larsson); `npm run bridge` fills them. The real league's pool lists 484 outfielders against the
  stats league's 601, so a man it does not list prints `—`.

## The player pages print our marks from a filed season file — decided 1 Oct 2026

- **Craig**: ratings on the player profile and its Data tab too. A page cannot make six Fantrax reads per match it shows,
  so `npm run ratings` (`.github/workflows/ratings.yml`, match evenings and a morning sweep) rates each settled London day
  once into `data/ratings/26-27.json`, keyed by player code and fixture code, and the app reads it statically
  (`app/ratings.ts`).
- **Counted at backfill, 1 Oct**: 17 days, GW1–GW5, 1,483 appearances by 395 men, 1,369 marked (the rest too brief);
  25 KB.
- **The scoring league's points** (`recorded.json`), whichever league is served: the file records the league that marked
  it, and a run against another changes nothing unless `--restart`. CI rates with the real league now, as the backfill did.

## Our player rating is the match alone, read off league points — decided 1 Oct 2026

- **What it is**: `join/rating/` marks one man's match out of ten from his real-league points, the
  goal-and-assist points scaled by the opponent's defence and the clean-sheet points by his attack, plus
  `mistakes` and `extras` in league points, read off `marks` in `weights.ts`. Nothing reads it on screen
  yet; it waits on Craig's review (`docs/record/ratings-backtest/`).
- **Counted on 25/26**: 10,521 matches rated; median 4.5–5.0 by position, one 10, five 1s; mark against
  league points 0.943. Fantrax's own points for 7,937; the 2,584 men it no longer lists were priced by the
  league's rules from `getLeagueInfo`, which reproduce Fantrax exactly in 98.3% of matches and within a point
  in 99.9%. A dual-eligible `M,F` man is scored as a forward; Keeper Points (GKP) count saves, punches and high
  claims (85% exact against Fantrax's cell, saves alone 26%); DFP and DFP3 from Opta's counts match 99.5% and 99.2%.
- **The opponent is `football/seasonStrength`**, goals and xG so far against the league's, eased in over six
  games: 0.92 with the season's goals for attack and 0.90 for defence, where the sister export's season means
  manage 0.80 and 0.81 (Wolves' defence read average while conceding 1.79 a game).
- **No Underlying**: a second mark for the chances behind a match predicted the next five better than points
  (0.356 against 0.337), but Craig ruled it out: what a man will do next is the projections' job.

## Projections print our league's points, repriced from FPL's — decided 2 Oct 2026

- Craig: *"I need a draft pack. Projections for all players using real league's points."* `npm run draft-pack`
  writes `data/intel/league-projections/26-27.json`; the Projections board and a player's run read it, at his best
  slot. **520 men**: the scoring league's pool (547) less the 27 the bridge cannot key. 86 bridged men with a
  projection are not in that pool (75 of them FPL status `u`, none above 20 points over GW6–17), so not priced.
- **Method**: FPL's parts back to counts at FPL's prices for his FPL line, then priced at the slot by
  `pointsFor`. The real league pays FPL's prices for goals, assists, clean sheets, minutes and conceding, so a man
  whose slot matches his FPL line keeps those parts; 96 do not (88 FPL midfielders filed F or F,M, 4 filed D,
  2 FPL defenders filed M, 2 FPL forwards filed F,M). Bonus goes. DefCon and keeper work are his own per 90 over the periods
  begun, each match priced alone, drawn toward the slot's average by **270 minutes**; method of moments on GW1–5
  puts the right weight near five matches for D and three for M and F. Conceding is re-costed (Poisson on the
  club's clean-sheet chance) only where slot and line disagree.
- **GKP is the scoring league's own read**: the stats league's keeper sheet carries `Sv` and no `GKP` (counted
  2 Oct: 20 columns, none of them GKP); GKP ran about 1.5× Sv over GW1.
- **Star test** (GW6–17, FPL → ours): Haaland 77.8 → 72.0 (bonus −8.8, DefCon +3.0); Bruno Fernandes 70.6 → 60.5;
  Saka 59.7 → 58.7 at M, 52.4 at F; Raya 47.5 → 51.7 (keeper work +7.3, bonus −3.1); Gvardiol 44.2 → 47.9;
  Rice 45.1 → 41.0; Cunha 41.1 → 33.5 (filed F: goals at 4, no clean sheets). Salah has no FPL row this season.
- The file is a snapshot: rerun after a new projections export or a gameweek's counts.

## A player's fixture run carries the sister model's projection, not Fantrax's — decided 30 Sep 2026

- **Counted**: the sister export projects **666 of 666** players for **each of GW6–17** (12 weeks); Fantrax's
  own per-player projection covers one period and only the men fielded (`ACTIVE`), behind the lineup gate, and
  its reader was deleted on 25 Sep. So the run reads the export, in FPL scoring until 2 Oct (above); the panel carries no source caption, and each figure's title
  says whose it is.
- **The rank is among his grid's group** (the sister's line: 108 midfielders, 23 goalkeepers), the men with a
  reading that week, ties sharing a place (`projectedPlace` in core); lit on the pool board's shares (`poolCut`).
- **Mail's frame and row are shared at two, by Craig's asking** ("use the mail template more"), a recorded
  exception to CODE_RULES §1 like `DateChip`'s: `news/Mailbox` and `news/MailRow` serve Mail and a player's
  News, and the row's headline now wraps to two lines on both rather than clipping on a phone.

## The Points Dodgers are the real football's near misses, not a manager's bench — decided 30 Sep 2026

- Craig: *"points dodgers are players IRL who came close to points but didnt get any, not players on the bench"*.
  The column had named five men who returned while benched; that is now nobody's column.
- **Each kind of points is dodged on its own** (Craig: *"players with high xa and no assist points"*): a man
  with no goal who came near one (a goal ruled out, a penalty missed or saved, the woodwork, expected goals), with
  no assist who came near one (expected assists, a shot he set up hitting the woodwork), or with no clean sheet his
  slot pays for whose side's only goal against came from `DODGERS.lateGoal`. A scorer can dodge an assist, and the
  brief says what he did get so the column never denies it. An assist side is scaled to the goal bar
  (`DODGERS.from`: 0.6 goals, 0.4 assists). Benched or not is never said.
- **Expected goals and assists order the column and never print**; the brief carries Opta's countable facts, the
  moments' minutes (the one column given them), and shots taken and set up from inside the box and close range.
- Star test, rehearsal league: GW3 Calafiori, Ødegaard (scored, 4 shots set up, no assist), Bobb, Ballard, Cherki;
  GW4 Le Fée's saved penalty, Justin, Ndoye, Ampadu, Trafford; GW5 Wissa's saved penalty, Gonzalo, Saka,
  Fernandes off the post, Cunha (scored, set up a shot against the woodwork).

## A period's points by London day, and the bench order for auto-subs — probed 29 Sep 2026

- **`getLiveScoringStats` answers one day** when asked as the live-scoring page's Timeframe → Date view does:
  `{ sppId: "-1", viewType: "1", period, date: "YYYY-MM-DD", newView: true }` (replayed from the page's own request;
  it also sends `tz: "Europe/London"` on the envelope, which changed nothing here). No cookie.
- **The days sum to the period, to the point**: rehearsal period 5 (GW5), all ten teams, 18 + 19 + 20 Sep equals the
  period read and `getStandings`' result (123: 11 + 15 + 12 = 38). A date after the period's last match day answers
  that day again (21 and 22 Sep repeat 20 Sep), so a caller sums the gameweek's own days, never a range.
- Minutes are the `Min` category on every man who played, so "did not play" is Fantrax's own reading.
- **The bench order is on `getTeamRosterInfo`**: `miscData.autoSubsOrderingType` is `"USER"` and
  `miscData.autoSubOrderMap` is `{}` on every team (0 of 10 numbered). Craig, 29 Sep: subs are ordered by the manager,
  and a script run at the deadline orders any bench he left unnumbered "by total fpts". The page's `fpts` column is
  that total, so `mapBenchOrder` takes the manager's numbers when set and otherwise sorts reserves by it.
- **Open: the rehearsal league's GW5 results carry no auto-subs.** test2 finished on 34 with Millar blank and Meunier's
  3 on the bench; test4 beat test3 26-24, where the order by points would make it 28-33 to test3. So the deadline's
  ordering did not run for GW5 in this league. The proof prints Fantrax's score beside the substituted one.

## Opta's commentary describes every shot, and says what VAR decided — probed 28 Sep 2026

For the match report's facts: the textstream (`/fixtures/{id}/textstream/EN`) over **all 50 fixtures
of gameweeks 1-5**, and the staff endpoint for all 20 clubs.

| | |
|---|---|
| goals reconcile with the detail's `G`+`P`+`O` | **50/50** fixtures |
| shot lines (`goal`, `penalty goal`, `miss`, `attempt saved`, `attempt blocked`, `post`) | 1,389 |
| …foot (`right footed`, `left footed`, `header`) | **1,383/1,389** |
| …where from (`very close range`, `centre of the box`, `outside the box`…) | 1,385/1,389 |
| …made by (`Assisted by`) | 1,025/1,389, an unassisted shot rather than a gap |
| …situation (`following a corner`/`fast break`/`set piece situation`, `direct free kick`) | 227/1,389 |
| `added time` giving its minutes | **100/100** |
| substitutions Opta marks as injury | 29/438, plus one `player retired` ("went off injured after … used all subs") |
| `contentious referee decisions` | 15, each `VAR Decision: No Goal <score>` · `No Penalty <club>` · `Goal <score> (<scorer>)` · `Card upgraded <man>`; with 11 `VAR cancelled goal` naming the scorer |

**Four traps.** A missed penalty is a `post` or `miss` whose text starts `Penalty missed!`, not a
type of its own. `penalty saved` names the keeper only in prose, so the keeper comes from the team
sheet, never the text. A second booking is `secondyellow card` (2), a straight red `red card` (4).
The own-goal line has no space after the score (`…Town 1.Goal confirmed following VAR Review.`).

**Managers are named only where the staff list is unambiguous: 16/20.** `/teams/{id}/compseasons/841/staff`
lists `role: "Manager"` with `active: true` and no dates, and Forest, Chelsea, Palace and Ipswich each
carry two active managers. A club with two is given none, because nothing says which one picked the side.

**Opta's type strings are now read in five places, and the shared table waits.** `moments.ts` joins
`map.ts` `KINDS`, `assists.ts`, `injuries.ts` and `wire.ts`. It is past the rule of three, but #149
rewrites three of those four, so the extraction lands after #149 merges rather than colliding with it.
## The cups are declared as ours; the playoff is Fantrax's — decided 27 Sep 2026

Craig set the formats on 27 Sep. The cups are declared in `packages/core/src/league/cups/declared.ts`, and
`declared.test.ts` lays each one out for ten teams:

- **Timbeibs Cup**: GW9 is a seeding round, seeded by that week's Fantrax points, with a tie going to
  the higher league position. Then a one-leg double elimination with no reset final, from GW10 to the
  GW17 final (Boxing Day). The top six byes are not declared: `doubleBracket(10)` gives them, because only
  seeds 7 to 10 fill a sixteen-slot first round. **Every round is played as late as the final allows**
  (`scheduleRounds`; Craig, 30 Sep: *"dont have wb so early"*): the winners' final is GW15, so its winner
  waits one gameweek for the final, not three. **Once seeded it follows strict bracket order** (Craig, 30 Sep):
  every side from round 3 on is a fixed winner or loser, never reseeded. **Rounds 1 and 2 are drawn at random**
  (Craig, 30 Sep: *"round 1 can be drawn, and round 2"*), off the app like the Davy Propper groups: seeds 7–10
  into round 1, then the six byes and the two round 1 winners into round 2 (`drawnRounds: 2`). The GW9 seeding
  decides only the byes; losers drop into the losers' side by the tie position the draw gave them.
- **Davy Propper Cup**: two groups drawn at random around GW19, off the app, each playing once over GW22
  to GW26 (Craig, 30 Sep: *"starts gw22"*). The top three go through and the group winners skip the
  quarter-finals (`seededBracket(6)`). Quarter-finals are A2 v B3 and B2 v A3, all one leg: GW28, GW29
  and a GW30 final. GW27 is the break.
- **GW20 is a mid-season break for every competition** (Craig, 30 Sep). No cup is declared in it; the
  league's own GW20 fixtures are Fantrax's schedule, which Craig sets, and the app draws what it answers.
- **The playoff is Fantrax's, read from `getLeagueInfo` and never declared.** Craig sets it in Fantrax:
  five teams, a one-leg 4 v 5 play-in, two-leg semi-finals, a one-leg final. `mapPlayoffs` carries the
  places. On 5 Oct the real league (`mqsjd23smsgbiqzr`) answered `numPlayoffTeams: 4` from period 35: the
  semis, with the play-in left out, so the play-in is ours.
- **The table's lines** (Craig, 5 Oct: *"1st - £30 for regular season, gets to pick semi opponent; 2-3
  playoffs; 4-5 playoffs play in; 5-8 Plate - winner gets 1st pick next season"*) are declared in
  `league/tableLines.ts`: under 1st, under the place before Fantrax's last semi place, under the place after
  it, and under 8th, the Plate being the play-in's loser and 6th to 8th. A league with no playoff draws none.
- **A level knockout tie** is settled by points, then the starting eleven's goals, assists, clean sheets and
  minutes played in the tie. Level on all five is a coin toss, which Craig makes: `knockoutWinner` answers
  `"coin toss"`. Every cup tie is one leg.
- **Group points are 3 for a win and 1 for a draw** (Craig, 27 Sep). A group is placed on points, then
  points for, then draw order; the order after points for is assumed.
- **On screen with a placeholder draw** (Craig, 27 Sep: *"Placeholder brackets are fine for now"*):
  `/league/cups` shows each cup's bracket, and Schedule and Live carry the cup ties, the cups' only fixture
  list (Craig, 1 Oct: *"just put fixtures in fixtures section, too many buttons, leave brackets here"*; GW9's
  seeding line moved to the schedule with them). Every side is "To be drawn", "A1", "2nd B" or "Winner M5"
  until the draws are made; nothing yet puts a team into a slot. The screen no longer says "Placeholder
  draw" (Craig, 30 Sep: *"remove placeholder draw sentence"*). The Davy Propper groups are drawn as
  `groupTable` league tables (Craig, 1 Oct: *"propper cup should be a table view"*), every figure 0 until
  results are wired in. `knockoutWinner` and `seedByPoints` are tested but still read by no screen.

## The real league is `mqsjd23smsgbiqzr`, not `ayyoh3n2mr326v2o` — settled 25 Sep 2026

Craig, 25 Sep: *"mqsjd23smsgbiqzr - real league, just setting it up"* (#110). The league every
doc called real, `ayyoh3n2mr326v2o`, is named "Tim Hortons Pro League 24/25" and never had a
team. `mqsjd23smsgbiqzr` is "Tim Hortons Pro League 26/27" with 6 managers on 25 Sep, a snake
draft, and 15/11/5.

- **An entry dated before 25 Sep that says "the real league" means ayyoh.** Those probes are
  true of the league they read and are left as they are.
- **ayyoh's captures moved to `data/snapshots/fantrax/leagues/ayyoh-abandoned/`**, 5 Aug to
  25 Sep. That is not a recorded key, so nothing reads it except `tools/demo/build-demo-league.mjs`,
  whose 14/11/3 limits and scoring come from its 29 Aug capture. `real/` holds mqsjd only, from
  its first capture on. CI kept capturing ayyoh into `real/` from 28 to 30 Sep, until this landed; those
  three moved too.
- **The name warning is settled.** The real league already says 26/27.
- **The real league's position table is readable**, where ayyoh's was not. Squad totals are
  D 6 · M 6 · F 4 · G 3 against rehearsal's 5/5/3/2, with the same minimums (3/2/1/1). So the two
  still differ in a number a hardcoded limit would get wrong, and the demo league's 14/11/3
  differs in the starting size as well.
- **The real league's squad totals were switched off on draft night** (5 Oct; Craig: *"there's no squad
  limit now, in terms of positions"*). `roster-limits.json` reads `maxTotal: null` for every position; the
  minimums and maximum starters (D 3–5 · M 2–5 · F 1–3 · G 1) are unchanged.

## The ingestion refactor's sweep exception — decided 25 Sep 2026

- CODE_RULES §4 says a file over the ceiling is split when it is next touched, not in a sweep.
- Craig asked on 25 Sep for all of ingestion to be swept at once: grouped so fresh eyes can follow
  it, lean, consistently named, and not flaky.
- The exception covers only the files `docs/providers/README.md` lists, and it ends on Wed 7 Oct
  2026. The swap weekend (8–11 Oct) is frozen, and §4 applies as written from then.
- Moves and refactors still land as their own commits, apart from any behaviour change.

## Lawro writes the predictions, under his own name, on Thursday evening — decided 24 Sep 2026

- **The byline is "by Mark Lawrenson", with no impression marking** (Craig, 24 Sep 2026). It reverses,
  for this one column, the rule that a byline over machine-written copy is an invented name (`gazette/staff.ts`,
  SEASON_LOG 28 Aug). It travels as `reporter` on the story; every other kind runs under its staff writer.
- **His career is his to use, in verified lines only**: the thirty BBC years (pundit, co-commentator,
  twenty-two years of predictions) and the playing and managing, as a core identity and 20 lines in turn in
  `gazette/predictions/past.ts`, each read back from the archive by its mark. A first-person career claim
  outside them is a hard fault. Never Heysel, his health, why a job ended, a colleague's name or politics.
  **Everybody knows who he is** (Craig: *"article intro weird, we know who lawro is"*): he never introduces
  himself, and a line in turn is offered every fourth column (`ROTATION_EVERY`), not every one.
- **He is the most miserable man in punditry, played straight** (Craig: *"more miserable and dour, parody
  like"*). The running joke is how far his career has fallen, one bleak line in every opening, never
  consoled; the core says so, so the career check passes it. The skit writer is told one or two groaners a
  week is ordinary, not that none is, and may end a sentence on a kicker of three words.
- **Opinions, not facts, turned up** (Craig, on a column that listed men and fixtures: *"ai shite"*, then
  *"lean into his personality and exaggerate"*). The brief leads each tie with its one story (a gut reason, a
  main man against a hard fixture, a main man in doubt), then a man for any side the story leaves out, form,
  two men who share a club or meet on the pitch this round (Craig), and one more: a signing or a doubt. A
  tie with no first-person verdict, or naming more than four men, goes back once; a word standing as its own
  sentence ("Lovely.") is a reaction, not a stranger. He may call a pick useless, never the manager an idiot,
  and grumble about the waiver list by name. A tie runs to 120 words, 130 on a gut call. Drawn from his BBC
  columns and the writing on "Lawrentary": he moans at the good news too, with no bitterness in it.
- **A suspension is stated and left, and he is from Preston** (Craig: *"we know what suspended means"*;
  *"'Lean on' stop saying that. American ai shite"*). The brief once called a suspended man "a pick that
  gives them nothing" and the column printed "Signing a suspended player" about a man drafted weeks before;
  the line is gone. "lean on", "step up", "show up", "in for a long one" and their kin are on his banned
  list, and the voice says plain northern English. The strength ratings read as an old man's words too,
  toughest and softest defences, hardest-to-keep-out and weakest attacks (Craig: *"'One of the meanest'
  stahhhp"*), with "mean", "leaky" and "lively" banned. A man out is replaced from the bench, so "a man
  short", "down to ten" and "shorn" are banned (*"managers have subs"*), and a possessive before a surname
  ("their Ballard") is sent back (*"sounds off"*).
- **The narratives, and the order the brief leads with them** (Craig: *"Focus on who has a very easy match
  up top"*, *"reference players form"*, *"think of more narratives"*): a main man with an easy game
  (`PredictionSide.kind`, ease within `kindFixtures`), a main man in form or gone quiet or back from a
  lay-off (`streak`, off each man's last `recentGames` gameweeks, two public FPL live reads joined by
  per-season id and never persisted), a main man with a difficult game, a doubt; then a man for the other
  side (the easy one when there is one), form on the pitch and in the table, clubmates, a head-to-head
  ("one of the big games of the weekend" when both clubs are at an extreme), a trade and what it cost, a
  waiver signing. A difficult game is "difficult", never "one of the hardest this round" (*"somebody will
  play Liverpool"*), and a suspension is stated and left: every way of saying who plays instead is banned
  (*"you don't need to elaborate"*).
- **Five ties, one vocabulary** (Craig: *"Same terms over and over. Stands out when it's 5 previews in one
  article"*). Two checks: the turns of phrase that came round in every run ("hard one", "no picnic", "blow
  hot and cold", "find a way to waste", "ugly", "carries") are capped per column in `LAWRO_CAPPED`, and any
  four-word run that appears in two ties of one column is sent back (`LIMITS.echo`). The cross-column
  five-word check stays for week to week.
- **The headline is the desk's**: `Lawro's Predictions: GW{n}` (Craig). He writes the deck, and no chip or
  kicker repeats the headline.
- **Availability in words, never FPL's figure** (Craig: *"dont say percentages"*): 75 a slight doubt, 50 a
  doubt, 25 a big doubt, 0 out, and FPL's own status for injured, suspended and unavailable. "per cent", "%"
  and "50-50" are banned outright.
- **Real clubs, and a main man against a hard one leads** (Craig: *"you can reference the actual prem teams"*,
  *"high projected players also have tough opposition, its a good narrative"*). He names the man, his club and
  the opponent; a key man with a difficult game is one of the tie's stories, after an easy one.
  FPL's own club names ("Spurs") pass the names check.
- **Each tie prints the man its line names first**, from that tie's two squads (`featured`). Who each man is
  came off the bridge with his squad; the prose decides only which of them, so this is not the runtime name
  matching CLAUDE.md forbids. A line that names nobody prints no picture.
- **Squads, never line-ups, before the lock.** The brief reads no roster slot (`squadMen`; a test shuffles
  every slot and position and the squad must come out identical), and the prose may not say who starts.
  **The one exception**: the printed score is Fantrax's projected total, summed over each side's current
  eleven. Craig chose a scoreline over a winner alone; a total names nobody.
- **Code makes every call and score** (`callTie`). The favourite is the higher projected total; within
  `PREDICTIONS.closeShare` (8%) the first instinct that fires backs the underdog, uncapped: a doubt about the
  favourite's best man, kinder fixtures for the underdog's back line, more Liverpool men. **Liverpool men
  reach further**, overturning a gap up to `liverpoolShare` (15%), and he never admits why (Craig: *"he didnt
  admit it in predictions, he just predicted liverpool to win every time"*), so the 159-game line is no
  longer offered him. He returns `backs` and cannot change a call. About one gut call a week is expected; count them after gameweek 9 and retune.
- **The editor is code** (`gazette/predictions/checks.ts`). A hard fault (a line-up, a name or figure not in
  the brief, quotation marks, a decimal, a score in the prose, arguing for the other side, a career claim
  nobody gave him, the never list) leaves the tie printing its prediction alone; a send-back goes back once.
  **Names are a hard fault for this kind only**; the house `strangers` check stays a warning.
- **Due** Thursday from 18:00 London for a lock Friday to Monday, the evening before an earlier lock, once
  the last round is finished, once a round. The cron's Thursday band runs to 20:30 UTC.
- **His record is recomputed every firing** from the archive and Fantrax's settled results; nothing is stored
  but the calls and each tie's instinct. `round-preview` went on the same day, never having filed (#93).
- **No narrative twice** (Craig: *"try avoid repeated narratives… draft is 15 man squads"*). A man named in his
  last `PREDICTIONS.wornColumns` (2) columns is withheld from the key men unless something is new for him (a doubt,
  a blank, a double, an opponent at an extreme). Withheld means absent from the brief, so naming him anyway is a
  hard fault. **Fixtures carry the sister repo's team strength** in words, at the extremes only: "one of the three
  leakiest defences in the league" for a forward, the attack for a defender; never a rank.
- **His picture and billing**: "Draft Expert" (Craig), and BBC Sport's studio portrait of him, Craig's pick on
  5 Oct 2026 over the CC0 tackle on Hugo Hovenkamp (1981), which never read as him at any crop. **It is not freely
  licensed**: the one exception to the credits page's rule, credited "© BBC". It is the app's `COLUMNISTS` table
  keyed by `reporter`, printed through `.paper-photo` at every rank, and on his article as the BBC ran him: a
  banner with his name, his billing and a square crop. A shared link's card takes its own 470x630 crop. The
  writer never draws a cartoon over a columnist's column. Beside each tie the man prints at `Face`'s `tie` rank, a 6rem square his
  prose wraps round (Craig: *"thumbnails can be bigger"*).
- **A reply's JSON is read from its first brace to its last** (`newsroom.__objectIn`). The skit writer once
  reasoned aloud before its JSON, the parse threw, and the catch swallowed it without a word in the log. A
  failed skit call now says so.
- **A local build without `FANTRAX_LEAGUE_ID` 500s every `/paper/[slug]`** under `next start`
  (`DYNAMIC_SERVER_USAGE`). Production names the league when it builds; build with it set before shooting an
  article locally.

## Lawro ranks the squads as drafted once, every place by code — decided 5 Oct 2026

Craig, 5 Oct: *"can lawrenson do a season predictions based off the draft results?"*, then on the first draft:
*"just talk like its a power rankings, dont mention playoffs places"*. So the column is "Lawro's Power Rankings":
a short opening, then the ten squads strongest first, each with one line. It is a ranking of squads as they stand,
in the present tense, never a forecast: no playoffs, play-in, prize, title, finishing place, wooden spoon or table.

- **When**: `season-rankings`, keyed `season-rankings:gw{first}`, is due from the end of the draft
  (`getDraftResults` reads `completed`, so `pedigree` is not empty) until the first head-to-head period locks
  (`seasonOpening`). It touches no other assignment, so the weekly column keeps its Thursday. CI files it on the
  first editions firing that finds it due, which for the real league is the first after the swap on 7 Oct.
- **Every call is code's** (`gazette/season/`). Each squad's best eleven every period, in a shape the league allows
  (`formations` off `getLeagueInfo` and the recorded minimums; a man at any slot he is eligible for, priced at that
  slot by the draft pack), then the schedule as `getLeagueInfo` has it, the GW34 double header counting one period
  score twice, 10,000 times off a fixed seed, each playing ordered by the league's rule (`placeTable`: wins, then
  fantasy points for). The rankings are mean place: the season played out is how the squads are ordered, and the
  column never says so.
- **The editor's calls are data** (Craig, 5 Oct: *"dont put dome 10th, put him 9th"*). `data/editions/editor.json`
  holds, by league and story kind, each side put at a place, who called it, when and what he said
  (`editorsOrder`: the sides between shift one place). The printed order is the code's with those moves; every
  fact, lead and check reads the printed order, and the story files the moves with the place the code gave each
  (`extras.moves`).
- **The spread**: the sister model's band is a 5th-95th percentile, so one deviation is (high - points) / 1.645 of
  a man's mean, applied to his league-priced mean. Independent men gave a side a weekly swing of about a seventh of
  its mean, where draft sides swing by a third, so any two men of one eleven share a correlation of 0.5
  (`SEASON_RANKINGS.together`; the second-team review's fantasy specialist). Past the pack's window (GW17) a
  man's gameweek is his average inside it, and squads are frozen as drafted: no waivers, no trades.
- **Per side, in words**: the man it is built round (its first pick), and its weak spot: that man, or its best,
  when out or no better than an even chance, else the slot its elevens rank lowest at against the other nine.
  The lines alternate which they open on. The opening has his fall and one line on the squads: whether any is
  clear, the strongest and the weakest. The bold call went with the playoffs: it was a forecast, and a ranking
  has no end of the column to put an aside in.
- **The editor** (`checkSeason`) runs his weekly rules (`lawroProse`, `columnRules`) over the deck, the opening and
  every line, then the rankings' own: a place written beside one side ("ranked third", "fifth place", "top of the
  pile", "the weakest squad") must be its printed place (hard); the opening runs two or three sentences and names
  only the strongest and the weakest; a side's line names no other side and no other squad's man (hard); no FPL,
  simulation, draft round, playoff, play-in, semi, straight through, £, prize, title, finish, table, wooden spoon
  or predicted; British spelling; two sentences a line; no two lines opening alike. The desk assembles the
  rankings in the printed order, so the model never orders them.

## Which categories a league scores is data too: A, AF and Sv became AT and GKP — probed 1 Oct 2026

The commissioner rebuilt the real league's scoring in pre-season. Public `getLeagueInfo` (no cookie), 14:20Z:
assists are `AT` (`INDIVIDUAL_ASSISTS_TOTAL`, "Assists (Total)", id 6362, 3 points) where they were `A` (6000) and
`AF` (6283); a keeper's 1-per-3 bonus is `GKP` (`INDIVIDUAL_KEEPER_POINTS`, "Keeper Points", 6689) where it was
`Sv` (6200). The rehearsal league still scores A, AF and Sv. Code that named `"A"`, `"AF"` and `"Sv"` read nothing on
the real league and said nothing: the draft desk tallied no assists and priced none, the Bin XI could price no
position, the squad board's `Pts` left assists and keeper work out, and Team Stats showed no assist or keeper column.

- **Counted on `getPlayerStats`, both leagues the same day, no cookie.** `AT` = `A` + `AF` for **455 of 455**
  outfielders the two pools share, so AT supersedes its parts and a total never adds both. **`GKP` is not saves**:
  23 of 63 keepers have a non-zero `GKP`, and every one of the 23 reads higher than his `Sv` (Tzolakis 30 against 17),
  because it counts saves, smothers, punches and high claims won (Craig, 1 Oct). Labelled "Keeper actions", never saves.
- **The squad board's `Pts` is dropped (Craig, 1 Oct).** It summed raw counts, so goals conceded and cards raised it;
  pricing it needs the tiered rules (minutes, DefCon, GKP) our scoring reader cannot price yet.
- **Identity is the settings' long `code`**, read into `ScoringCategory.longCode`; the short code is the fallback for
  reads that carry only short codes (`getPlayerStats` columns, SEASON_STATS captions). One table holds the names,
  `league/categoryNames.ts`: `ASSIST` (AT, else A) and `KEEPER_WORK` (GKP and Sv).
- **Boards draw what the league scores.** Squad stats, the pool board and Team Stats drop a category the league's own
  read does not carry, and keep them all when the read carried nothing.
- An orphan `Pen` sits in the real league's `scoringCategories` table at 0 for every position, with no entry in
  `scoringCategorySettings`; `getPlayerStats` lists it (8 non-zero). Nothing labels it.

## Typed assists come from a stats league, not the served one — decided 28 Sep 2026

The vidiprinter and the match scoresheet dropped assists Opta never placed: across GW1–5, 138
goals, 7 real assists reached no goal row even after the commentary and FPL's counts. Fantrax
types every fantasy assist (penalty won, own goal forced, free kick won, rebound, deflection) per
gameweek for every player, but only in a league whose scoring lists those columns.

- **The real league stays clean** (Craig, 28 Sep: its categories are what members see). The dummy
  league lists them all and is on Craig's account, so it stays up. It is named by role in data,
  `"stats": "dummy"` in `recorded.json`, the line `npm run stats` reads too; the app reads that one
  role and no other league from the file. Unnamed or silent, the kinds are skipped and crediting is
  as before. The served league stays the environment's, because that is the swap.
- **Order: kinds, then the commentary, then arithmetic** (`creditSide`). A kind credits only a sole
  claimant on the side whom FPL paid in that match, owed enough to cover every goal of that kind.
- **What it bought, counted on GW1–5:** 3 of the 7 (Miley og ← Tanaka, João Pedro og ← Groß, Enzo's
  free kick ← Ndiaye), and Man Utd 5–2 Ipswich now places all three without the commentary. Two
  open-play goals with two rebound-type claimants still need the commentary, or stay blank.
- **One read per gameweek**, outfield only (1.3 MB), cached five minutes (`ASSIST_KINDS_REVALIDATE`).
  Fantrax's A+AF matched FPL's assist count for every player across the five gameweeks.
- **A second reader since 1 Oct 2026: the squad Stats board** reads this league's season live (`statsLeague.ts`,
  both halves, 30 s like `getPlayerStats`), not its daily capture, so one row's columns are a cache window apart at
  most. Joined on the Fantrax id. A column the served read has always wins, which keeps the repeated `CS` out.

## A screen's sub-views switch from its foot, not a second top strip — decided 24 Sep 2026

- **`components/shell/FootFrame.tsx`**: a viewport-tall column whose foot sits at the bottom of the screen when
  the body is short (lifted from `MatchShell`), and in view on a desk when it is long; the foot is a `TabStrip`.
  (`FootSwitcher`, a wrapper that only forwarded to `TabStrip`, went in the day's refactor.) Craig: *"footswitcher as shared code to be used on other pages… it stops rows of blue buttons"*.
- The top of a screen keeps one strip of blue plates: its own views. Anything that picks a sub-view of one of
  those (a club's stats, a manager's board, Fantasy) goes in the foot. First users: the Prem match (byte-identical
  DOM on 14 route×width pairs) and the head-to-head's Stats.

## Safari drew every pitch differently from Chrome, and nothing we run is Safari — measured 24 Sep 2026

- **`.pitch` had a ratio and a height ceiling but no width.** Where the ceiling binds, Chrome keeps the width
  and draws the grass flatter; WebKit keeps the ratio and narrows the box. On a 390×844 iPhone the head-to-head
  pitch was 260px wide with names cut; Chrome drew 390. Every `tools/ui/` instrument drives Chrome, so it never
  showed. `.pitch` now has `width: 100%` (the gutters too when it bleeds), and both engines measure identically
  on the head-to-head, the squad sheet and the Prem match pitch at 390, 768, 1024, 1280 and 1440.
- **The head-to-head's desk pair** (`.pitch-pair`, from `lg`) budgets 20rem, not the phone's 26.5, and bounds
  each sheet's width by the height it has, so its grass keeps the 0.95 ratio. Before: 588×366 at 1440×790
  (markings 1.7× too wide), 132–152px empty under the bench, and the two pitches overlapping by 24px.
- **To look at WebKit**: Playwright 1.62.1's `playwright-core` in the npx cache has WebKit 26.5 installed
  (`~/Library/Caches/ms-playwright/webkit-2336`); launch Chromium with `channel: "chrome"`.
## The bench is priced in public, behind `playerViewType: "2"` — probed 24 Sep 2026

- **`getLiveScoringStats` with `playerViewType: "2"` answers a `BENCH` section with no cookie**: each
  reserve who played, with `object1` (total) and `object2` (per-category `sv`/`fpts`), the same shape as
  `ACTIVE`, `_5010`/`_5020` subtotals included. It is Fantrax's own "Show bench" toggle, read off Craig's URL
  and the requests their page makes. `newView`, `matchupId`, `mainView` and `layout` change nothing.
- **Counted**: dummy period 5, 10 of 10 teams; rehearsal period 5, 10 of 10 teams and 26 reserves priced
  (TEST2: Hackney 1, Meunier 3). ACTIVE totals are byte-identical with and without the parameter. A reserve
  who did not play is absent, on ACTIVE's rule.
- **Read into a list of its own** (`mapBenchPlayerPoints`), so nothing that means "the eleven" can count a
  reserve; `squadLivePoints` returns `counted`, the eleven alone, for anything that sums to the scoreline.
- **Supersedes** the 22 Aug line below that called BENCH cookie-only.

## Projections is a scaffold over the sister model's run — decided 24 Sep 2026

- **The export is the newest projection run's horizon** (GW6–17 today, 666 of 666 players bridged by
  `person_to_element` and the bootstrap); the page shows the planner's window, the next six gameweeks with a
  match left, and a week the model has no reading for is a dash.
- **FPL scoring, never Fantrax's**, said on the page and never under a column headed `FPts`. Left out on
  purpose: a Fantrax-scoring conversion, the per-fixture split, ownership, search and the low/high band.
- **`query.ts`'s `boardHref` and `filterHref` take a route**, so a second Data board filters with the Players
  board's own parsers; the Players board passes none and is unchanged.

## Data's Team Stats is the clubs' football, off Opta's season totals — decided 30 Sep 2026

Craig: *"what is run? less fpl points, this page should be more pure stats, chances created, shots etc,
errors"*. It replaced the 24 Sep board of Fantrax points by club and position, Fantrax's keeper lines and the
planner's run, all of which went; the Planner owns fixture difficulty.

- **Opta's figures come off `/stats/team/{id}`, one read per club** (list: `/teams?…&altIds=true`), cached
  as one for five minutes. Joined to FPL by `altIds.opta` `t{code}` = FPL's club `code`, 20 of 20. Counted
  30 Sep 2026 after five matches: goals, shots, on target, big chances scored and missed, key passes, big
  chances created, assists, goals conceded, shots conceded (ibox + obox), tackles, interceptions, blocks,
  fouls and yellows **20/20**; errors leading to a shot **19/20**, to a goal **13/20**, clean sheets
  **16/20**, reds **6/20**, every absence a nought (the `/stats/match` rule below). No xG anywhere on it
  (`expected_goals` **0/20**).
- **FPL contributes the expected three**: xG and xA summed over the squad, xGC divided by eleven, because
  `clubStats` counts each chance against once per man on the pitch (exact except after a red card).
- **Considered and not used**: Fantrax's pool columns (`G A AF YC RC PKM OG GAO CS`, plus keepers' `Sv GA`)
  say nothing Opta does not, under league-specific headings; the sister repo's `matches` export stops at
  4 Sep (20 fixtures) and `shots` at 23 Sep. Opta's `ppda` sums per match and is not a season figure.

## The fixture planner ranks opponents by our strength model — decided 24 Sep 2026

- **The ranks are ours**: the sister repo's Dixon-Coles strength (`strength/{season}.json`, bridged to FPL club
  codes through `team_provider_map` and the live bootstrap; 20 of 20). An opponent is rated at the venue he
  plays, which is how the sister's own fixture model reads it.
- **Ten ease steps, not the five FDR ones** (Craig: *"Use a bigger range of colours too"*). FPL's difficulty
  keeps `--color-fdr-*`; the planner's rank takes `--color-ease-*`, so `fdr.ts`'s "always FPL's" stays true.
- **A blank counts as the hardest; a double averages its two; a tie goes to the nearer gameweek.** A double
  that averages rather than adds is a choice for "how kind", not "how many points"; revisit when a double
  gameweek lands.
- **`PLANNER_RUN` is 6**, the planner's own horizon; a player's profile keeps `FIXTURE_RUN` 5.

## Compare narrows to recent form from FPL's own game log — decided 24 Sep 2026

- **Last 6 is the last six gameweeks with a match finished** (`lastPlayed`), and the figures over it are the
  player's `element-summary` history added up (`totalsOver`). `RawHistoryEntry` gains `starts`, `tackles`,
  `clearances_blocks_interceptions`, `recoveries` and `expected_goals_conceded`, all present on this season's
  rows (probed 24 Sep); absent reads as null and adds nothing.
- **The export rows are windowed by fixture** (`inGameweeks` against `fixtureGameweeks`); no export changed.
- **A key pass is a shot whose `assistCode` is his** (`assistsOf`), across every shooter; the counts are the
  shots, and a pass with no located origin draws its shot and no line, so a count and its marks agree.
- **The touch heat is scaled to the 90th-percentile cell**, not the busiest (Craig: *"Heat can be less
  subtle"*). Measured on the busiest man: mean opacity 0.26 to 0.44, and cells at half strength or more 23 to 68.

## The Players board lights figures in ink, and reads who is looking — decided 24 Sep 2026

Craig: *"highlight numbers in yellow/orange like in the prem page, not squares with background colours"*,
then on the phone: *"remove the yellow title for space"*, *"Put position elsewhere"*, *"Remove opponent as
well"*, *"Tighten the column headers too?"*. `docs/ui/players.md` carries the board; these are the facts.

- **One standout rule, two boards** (`components/league/standout.ts`): top values, whole values at a time,
  while rare. The pool board takes a sixth / a twentieth of the scored figures with a floor of ten; a match
  board a fifth / a tenth of the men who played. `--color-hot` / `--color-cold` are deleted.
- **`/players` reads the reader's session** (`readerTeamId`) so his men read "Yours". The pool read stays
  team-agnostic and cached; only the render is per reader.
- **Opp is gone** from the board, and `fixtureOnly` with it.
- **The Data section draws no caption at any width** (since the second look, 24 Sep 2026; `SectionShell`'s
  `caption` is optional); a Fantrax projection says so above the board.
- **Extracted at two, by Craig's asking** (*"make sure we are using shared code"*, 24 Sep 2026), a recorded
  exception to CODE_RULES §1: `players/BoardRow` (the Players and Projections boards' lead, pins and figure
  cell), `clubOptions` (two club selects) and `competitionRanks` in `football/intel/strength` (the planner's
  ease ranks and the rankings view). Each pair must agree for the screens to; a third caller changes nothing.

## Draft and Prem share the Comps tab, and Data is on the bar — decided 24 Sep 2026

Craig: *"data needs to be at the bottom"*, *"when tapping on an option bring two squares up (except more
which is a big list)"*, *"FIND is now DATA"*, and of the popup's League square, *"Prem is real life, draft is
draft"*, then *"Fly out but vertical and smaller"*. DESIGN §2 carries the design; these are the facts.

- **The bar**: Gazetta · Team/Live · Comps · Data · Mail · More. `sections.ts` folds consecutive members of a
  `group` into one tab (`barTabs`); the desk rail still lists sections flat, now in the bar's order, so Data
  sits after Prem there too.
- **The League section is labelled Draft** everywhere a section is named. The URL stays `/league` and the
  title bar still names the league.
- **Find is Data.** The URL stays `/players`, and `SCOUT` keeps its name, so the label is a one-line change.
- **`navfit` counts `button[aria-expanded]` as a tab**, not bare `button`, which would count the desk rail's
  steppers.

## The phone's nav is the rail along the foot, with glyphs — decided 23 Sep 2026

Craig: *"Bottom nav bars are bad. Needs to be mobile standard. More needs a proper menu. CM inspired
still"*, then *"Icons are normally standard"*, *"Use mail"* and *"Just copy fpl"*. DESIGN §2 carries
the design; these are the facts it rests on.

- **Six tabs**: Gazetta · Team/Live · League · Prem · Mail · More (Comps and Data since 24 Sep, above). At 320 a label has 49px and
  `Gazetta` needs 44.3; `navfit` holds it.
- **Icons are allowed on the thumb rail**, above the word and never instead of it. The desk rail stays
  words only. This extends DESIGN §2's icon rule from one job to two.
- **The Prem glyph is the Premier League's lion**, unchanged paths from FPL's Safari mask icon,
  `https://fantasy.premierleague.com/img/favicons/safari-pinned-tab.svg` (potrace, 400×400, fetched
  23 Sep 2026), filled with the text colour. It is copied into `shell/plLion.ts`, not fetched, so the
  rail never waits on FPL.
- **Unread mail is counted by inbox id, per device**, in `localStorage` under `mail-seen`. No provider
  tracks reads, and Fantrax's timestamps carry no offset, so "newer than my last visit" by time would
  inherit `core/inbox/when`'s two vocabularies. A device with no record starts at nought.
- **`viewportFit: "cover"` was missing.** Without it iOS reports every safe-area inset as nought, so
  the old bar's `pb-[env(safe-area-inset-bottom)]` never did anything on an iPhone.

## Why an open live page froze, and the cache rules that stop it — 23 Sep 2026

Read against the installed Next 16.2.7 source. Standing rules for anything that polls:

- **`router.refresh()` does not invalidate the server cache.** Every live read
  is an `unstable_cache` entry, which is stale-while-revalidate: a stale read
  serves the old value and refreshes in the background, and entries age from
  when they were written. **A poll only brings new data if `POLL.live` is longer
  than the read's lifetime plus one fetch.** At 30 = 30, a lone reader saw new
  scores on every other poll. So `LIVE_REVALIDATE = 20` applies to the two reads
  a live score is drawn from (`currentRound`, `plRound`), and everything heavier
  stays at 30.
- **A nested `unstable_cache` bypasses its own cache**
  (`unstable-cache.js:144`, "when we are nested inside of other unstable_cache's
  we should bypass cache"). `readLeague` read `footballNow` inside itself, so
  each league revalidation refetched the 1.3 MB bootstrap and kept a frozen copy
  of the round in the league's entry. `liveTie` asked that copy whether a match
  was on. The snapshot is now read outside, in `getLeagueSquads`. `leagueInfo`
  and `seasonKickoffs` are still nested there, and moving them is not done yet.
- **The poll rate is decided on the client.** The server sends `liveIn` (seconds
  to live, from `secondsToLive`) and `AutoRefresh` counts it down
  (`cadence.ts`). Before this, a tab opened before kickoff polled every 300s
  until something re-rendered, and client navigation kept the rate.
- **No route is prerendered.** The shell reads the session cookie only during a
  live window, so `/prem/results` and `/prem/fixtures` built as static pages and
  served build-time chrome. Measured under `REPLAY_AT` at GW5 15:30: 300s polling
  and no Live tab, against 30s on `/prem`. `await connection()` opens `liveTie`,
  and the data underneath stays cached.
- **`'use cache'` + `cacheLife` is the 27/28 answer, not this season's.** It is
  the only option with a hard age limit. It needs `cacheComponents`, which moves
  41 `revalidate` exports and 15 `unstable_cache` sites and turns on PPR.
  Rejected for now: `revalidateTag` (still stale-while-revalidate), `updateTag`
  (Server Actions only), and fetch `next.revalidate` (same model).
- **Opta commentary is keyed by FPL fixture CODE, never FPL's id.** Probed
  23 Sep: requesting the textstream for FPL's fixture id returned a 1992 match
  for **50 of 50** finished GW1–5 fixtures (Brentford v Chelsea came back as
  Chelsea v Blackburn, 26 Aug 1992). So the wire's stream-based assist credits
  never applied, and only the arithmetic fallback ran. `roundStreams` now files
  each stream under `plFixtureCode`, and `creditRoundAssists` is pure in core.

`tools/ui/pollwatch.mjs` measures it: polls per minute, the gaps between them,
and how many polls changed the screen.

## What CI needs, and what it had — counted 17 Sep 2026

Counted 17 Sep 2026, when the repository had **zero Actions secrets** and one
variable (`WARM_BASE_URL`). Both Vercel environments were empty, and
`editions.yml` names no environment, so it could only read repository secrets
anyway.

- **`ANTHROPIC_API_KEY` — set the same day, and it had never been set before.**
  `write-edition.ts` throws without it, so until 17 Sep **the paper had never
  filed from CI at all**: the sixteen stories in `data/editions/paper.json` were
  written by running `npm run edition` locally on 2 Sep, which this file already
  records further up without anyone joining the two facts. Fixing the Actions
  billing that morning did not fix this; it uncovered it.
- **No league variable, by design.** Until 23 Sep the editions job read an unset
  `vars.FANTRAX_LEAGUE_ID` and fell back to the dummy league. Production serves
  rehearsal and `normalizePaper` filters by league, so every CI firing filed
  stories nobody could see. The job now asks production which league it serves.
- **`GAZETTA_MODEL` defaults to `claude-opus-5-5` (Craig, 1 Oct 2026)**, at $4/$20 per MTok. It always thinks
  and its default effort is `medium`, so the writer sets `effort: "medium"` explicitly and `max_tokens` rose from
  8,000 to 16,000 so the thinking cannot truncate a column. The helper stays `claude-sonnet-5`.

## How CI pushes, and what it may touch — decided 23 Sep 2026

- **Every writer pushes through `scripts/ci/push.sh`** (capture, editions,
  round-state, scout-xi): commit what the caller staged, then `pull --rebase` and
  push, five tries with jitter. Four jobs push to one branch, and each one used
  to lose its commit on a single rejected push. A rebase that conflicts is
  aborted and fails the job at once with an `::error::` naming the files, because
  an open rebase failed all five retries. `scripts/ci/push.test.ts` holds all
  three paths against a bare repo on disk: a clean rebase lands with no merge
  commit, a conflict aborts, and a failure without one still retries.
- **Checkout keeps no token** (`persist-credentials: false`), so `npm ci` and
  our own scripts run without a credential that can push. Only the push step
  gets `GITHUB_TOKEN`.
- **Actions are pinned to commit SHAs**, with the tag in a trailing comment. To
  move one, resolve the tag again (`gh api repos/<owner>/<repo>/git/ref/tags/<tag>`,
  dereferencing an annotated tag) and replace the SHA in every workflow and in `.github/actions/`.
- **Every job has a `timeout-minutes`**, and `verify.yml` is `contents: read`.
- **`claude.yml` answers only a mention from the repo's owner, members or
  collaborators**, because it spends the Anthropic key. Review comments now reach
  it too: they have no `github.event.issue`, so the old single condition never
  let one through.
- `editions.yml` refuses to commit a `paper.json` or `ledger.json` that will not
  parse, because the app imports both at build time.
- **The writer saves story by story, the ledger last**, and `editions.yml` commits
  after a failed or timed-out firing too (`if: always()`), so a killed firing keeps
  every story it filed. A story on the paper whose key missed the ledger is filed again.

## The table's tie-break is ours to apply — decided 23 Sep 2026

Points, then fantasy points for (Craig: *"tie breaker is fantasy points FOR"*), then team name.
`placeTable` applies it and numbers the places, because Fantrax deals fresh ranks on every
read to teams level on both, and the table reordered itself on refresh. The rule is not in
`getLeagueInfo`; if the commissioner's setup ever carries one, read it from there instead.

## What the pre-swap cleanup declined, and why — decided 23 Sep 2026

- **Loaders stay where they are.** Regrouping the app's reads into `app/read/*`
  is about 150 import rewrites while parallel sessions work the tree, 17 days from
  the swap. Revisit in the 27/28 platform, where the reads are rebuilt anyway.
- **Display modules stay in the app, with tests beside them.** `positions`,
  `realPositions`, `unresolved` and `mine` are words for a screen, not domain
  logic, and the app's tests run in the same vitest as core's. `creditAssists`
  and the match page's `side`/`fallbackGoals` had already moved behind tested
  functions (core's `creditRoundAssists`, the app's `scoreLines`).
- **The app's catches are policies, each stated where it sits.** Read one by one:

  | Where | What failure gives | Why |
  |---|---|---|
  | `football.ts` `offerLive` | Live offered | Fail open: navigation must not hide Live mid-match |
  | `football.ts` `groundFaces` | no faces | Decoration |
  | `layout.tsx` `round` | idle poll rate | Polling hard at a provider that just failed makes a wobble an outage |
  | `matchDetail.ts`, `matchFeed.ts` ×4, `commentary.ts` ×2 | that block absent | Optional Premier League detail; the page stands without it |
  | `session.ts` `codeHashes` | nobody signs in | A half-parsed code map must not let somebody in |
  | `teamStats.ts`, `refusals.ts` | the refusal, others rethrown | Only Fantrax's refusal is caught |

  None hides data the reader is shown as current. A visible "unavailable" label on
  the optional blocks is a design question for DESIGN §8, not a cleanup.

## The predicted XI is fetched from Scout here, every two hours — decided 23 Sep 2026

Craig: *"It should just always be live, and it's updated when scout updates it."*
The sister repo's sweep runs on Craig's machine and its export reached this repo
only when committed by hand (#34). So this repo reads Scout's free team-news page
itself: `scout-xi.yml` → `npm run scout-xi` → `parseScoutXi` (core, tested on a
recorded two-club page).

- **Probed 23 Sep:** a plain fetch with the shared browser user agent answers 200
  with all 20 clubs. Scout's club codes upper-cased are FPL's short names, 20 of 20.
  Each player's photo filename is his FPL `code`.
- **The file changes only when an eleven does**, so an unchanged run commits
  nothing and triggers no deploy. `fetchedAt` is the run that first saw the
  change: `FFS.currentDate` is the page's render time, and the "Last updated"
  strings on the page belong to other tables.
- **It refuses to write** unless every Premier League club parses into a full
  eleven, so a challenge page or a markup change cannot replace a good file.

## No league is named in the code — decided 23 Sep 2026

Craig, 23 Sep: *"We shouldn't be hard coding any Fantrax league. Once my real
league is in, should be a straight swap."* What that settled:

- **One value.** `FANTRAX_LEAGUE_ID` in Vercel's environment names the served
  league. Core's `FANTRAX_LEAGUES` registry and its `dummy` default are gone. The
  server refuses to start without the value (`instrumentation.ts`), and so do the
  writer, smoke and team-codes (`requireLeague`).
- **CI asks production.** `GET /api/league` answers `{ leagueId }`. `editions.yml`
  reads it before every firing and fails if there's no answer. There is no GitHub
  variable, so the paper cannot write about a league the site isn't serving, and
  the swap needs nothing in CI.
- **The archive's leagues are data.** `data/leagues/recorded.json` lists the
  leagues capture records, plus shape-diff's reference and subject. Only scripts
  and the verify walk read it. Retiring a test league after the swap means
  deleting its line.
- **Fantrax answers what was written down.** Capture cadence comes from the
  newest capture's `draftState`. The registry's draft dates were already wrong:
  it had dummy and rehearsal drafting 6 Aug, and Fantrax says 1 Sep and 2 Sep.
  The empty pages no longer print a date, because Fantrax publishes none for the
  real league before its draft. Craig turns the paper on himself.
- **The demo team is `FANTRAX_DEMO_TEAM_ID`**, lent only when it's one of the
  served league's teams (`lentTeam`). That check, not the swap, is what keeps it
  off the real league. Production needs `jtsmt5jxmtj31znh` (rehearsal's `test1`)
  in Vercel to keep lending it; `next dev` has dummy's `hy0w28p5mtj36y3g`.

## Production serves the REHEARSAL league, not the dummy one — verified 21 Sep 2026

`CLAUDE.md` says `FANTRAX_LEAGUE_ID` "defaults to the **dummy** league", which is
true of `config.ts` and had been read as a description of what is deployed. It is
not. Vercel's environment sets it.

**How it was settled, since the dashboard is not readable from here.** The
deployed app's `/squad` lists ten team ids; so do all three leagues. They match:

| | ids |
|---|---|
| deployed | `8enbgqo5msgb375j`, `j9zadacnmshcpazf`, `jtsmt5jxmtj31znh`, `dq2yk3zx…` |
| rehearsal | **the same ten** |
| dummy | `1b6gp5ut…`, `hy0w28p5…`, `98yx3o50…` — **no overlap at all** |
| real | none; the league has no teams until 10 Oct |

So `next dev` opens on dummy and the deployed app serves rehearsal, and the two
leagues share not one team id despite sharing all ten team NAMES (`123`, `test1`,
`test2`…). Anything keyed on a team id is therefore per-league, and a fact
established locally is not a fact about production.

**It cost the demo team its first afternoon.** `demoTeamId` was put on `dummy`
alone and was invisible on the one surface anybody would look at — the deployed
app correctly refused an id naming nobody and printed the sign-in instead. Both
non-real leagues carry one now.

**For swap day:** the Vercel value is already set to something, so the runbook's
step is a CHANGE and not an addition, and `npm run smoke` against the deployed
URL is what proves which league answered.

## `getTeamRosterInfo` answers with no cookie, and it carries the deadline — probed 21 Sep 2026

Asked because the My Team section needs four things Craig named and nobody had
counted which of them Fantrax will give us. All fxpa, all unauthenticated, all
three leagues.

**How to read an undocumented method list, which is the reusable half.** The
refusal tells you whether the method exists:

| Refusal | Means |
|---|---|
| `ERROR_INVALID_REQUEST` | **no such method** |
| `WARNING_NOT_LOGGED_IN` | real method, needs a session |
| `NOT_MEMBER_OF_LEAGUE` | real method, needs to be in the league |

Twenty-four names tried. **Exists and is gated:** `getPendingTransactions`
(NOT_MEMBER), `getTradeBlock`, `getTeamInfo`, `getLeagueSettings`,
`getCommissionerHubInfo` (all NOT_LOGGED_IN), `getLeagueHomeInfo` (NOT_MEMBER).
**Does not exist:** `getPendingClaims`, `getClaimsAndDrops`, `getTrades`,
`getPendingTrades`, `getTeamTransactions`, `getWaiverClaims`, `getWaiverWire`,
`getLeagueActivity`, `getActivityFeed`, `getNotifications`, `getLeagueHome`,
`getFantasyTeamInfo`, `getScoringPeriods`, `getPowerRankings`, `getSchedule`,
`getPlayoffs`, `getProjections`, `getWatchList`, `getTeamNotes`, and the five
message names below.

### ~~There is no league message surface, at all~~ — WRONG, corrected the same day

This section said five message method names were all `ERROR_INVALID_REQUEST`, and
concluded that a place to talk to the league would have to be ours. **The names
were wrong, not the surface.** With the commissioner's cookie (below) it turns
out Fantrax has *three*: a **Chat**, a **Message Forum** and **Commissioner
Messages**, plus League Polls and a League Article, all of them panes of
`getLeagueHomeInfo` rather than methods of their own.

The lesson is about the method: guessing names enumerates what you already
imagined. `ERROR_INVALID_REQUEST` proves `getLeagueChat` does not exist; it
proves nothing whatever about chat. The payload of a screen that HAS the feature
is what finds it, and one 318 KB read answered what twenty-four guesses could
not.

### `getTeamRosterInfo` — OK with no cookie, 43 KB

dummy ✓ · rehearsal ✓ · real **refused**, and honestly: `WARNING`, *"You cannot
use this screen until there is at least one team in this league."* It will
answer from 10 Oct.

Sixteen top-level keys. The four worth building on:

- **`leagueNotices` — 2/2 in both drafted leagues, and one of them is THE
  DEADLINE.** *"Don't forget to set your lineup before **Sat Oct 10, 7:15 AM
  EDT**"* and *"rank your auto-subs before the first game of the week starts on
  **Sat Oct 10, 7:30 AM EDT**"*. CLAUDE.md's rule is that our lineup deadline is
  a commissioner setting and must never be inferred from FPL's — this is that
  setting, published, with a timestamp, and nothing in the tree reads it. It
  arrives as prose with `<b>` in it, so it is a string to display and not yet a
  datetime to compute with.
- **`miscData.maxActions` = 1** in both drafted leagues, `null` in real. The
  league's cap on transactions, which no screen shows.
- **`periodOppnentTeamIds`** — the opponent, keyed by period. A second source for
  what `headToHead` already answers.
- **`tables[].rows[]`** — the roster as Fantrax draws it, per player:
  `cells[0]` is the fixture WITH kickoff (`"@COV<br/>Mon 3:00PM"`) and an
  `eventId`; `scorer.icons[].tooltip` is a dated news line (*"Sep 20, 4:17 PM:
  Hornicek registered three saves and…"*); `disableLineupChange` says who may not
  be moved; `posIds`/`eligibleStatusIds` are the eligibility. `miscData` also
  carries `realTeamJerseyMap`, Fantrax's own club jersey PNGs.

**The seven roster views are advertised and I could not switch them.** `tabs`
names `SIMPLE STATS FPTS OVERVIEW SCHEDULE_PERIOD SCHEDULE_FULL GAMES_PER_POS`
with a `viewType` each, but neither `view` nor `viewType` in the request changed
a single column across ten attempts — the same sixteen came back every time.
Recorded as unfound rather than absent: the parameter exists in their client and
this probe did not find its name.

## The position MINIMUM exists, and no JSON endpoint carries it — probed 21 Sep 2026

Asked because Craig wanted the planner to refuse an illegal formation: *"if
theres 3 at the back, you cant go down to 2 defenders, need to build the logic
using the league min/max starter logic"*.

**This section said there was no minimum for about an hour, and that was wrong.**
The probe was right about every endpoint and wrong about the league, which is the
failure mode worth recording: *absent from the API* had been written down as
*absent from the rules*, and a derived floor of two at the back was built on it.

### What the endpoints actually carry

`rosterInfo.positionConstraints` carries **`maxActive` and nothing else**, on all
three leagues, live and in every snapshot — `grep -c minActive data/snapshots/`
is **0**. `getTeamRosterInfo.miscData.statusTotals` gives `{Active: total 11,
max 11}` and `{Reserve: total 4, max 5}`, again a max and no min.
`getLeagueSetup` **exists** (`WARNING_NOT_LOGGED_IN` unauthenticated, OK with the
cookie, 17 KB) and is step ONE of the wizard: league name, password, scoring
system, premium features. No roster table. Twelve further name guesses —
`getRosterSettings`, `getLeagueRosterSettings`, `getPositionConstraints`,
`getRosterLimits` and the rest — all `ERROR_INVALID_REQUEST`.

That is the lesson this file already records about `getLeagueChat`, arriving
again: **guessing names enumerates what you already imagined.** What found it was
reading the screen.

### Where it lives: the commissioner's setup page, in the HTML

`newui/fantasy/createLeague.go?goto=3&leagueId=…`, with the cookie. The page
builds its own table by calling a function with the values as arguments:

```
addPosition('703','D','Defender','SOCCER_NON_GOALIE','3','5','5', '', '', false)
addPosition('702','M','Midfielder','SOCCER_NON_GOALIE','2','5','5', '', '', false)
addPosition('701','F','Forward','SOCCER_NON_GOALIE','1','3','3', '', '', false)
addPosition('704','G','Goalkeeper','SOCCER_GOALIE','1','1','2', '', '', false)
```

— `(positionId, shortName, name, scGroupCode, minActive, maxActive, maxTotal,
minGp, maxGp, isNew)`. So **D 3 · M 2 · F 1 · G 1**, summing to 7 of the 11
starters, and `chkMinActivePerPositionUsed` is `checked` — the commissioner
switched it on. Identical in dummy and rehearsal.

**The real league has no position table on that page**, exactly as it has no
`getTeamRosterInfo`: settings pages for a league with no members. **Re-run after
the draft** — `npm run roster-limits` records it as `unreadable` rather than
guessing, and the planner enforces no floor for a league it could not read.

### How it reaches the app

`npm run roster-limits` → `data/leagues/roster-limits.json`, keyed by league id,
with `fetchedAt` and `minimumsInForce`. It is the labelled fallback CODE_RULES §3
allows and it is labelled: `mapLeagueInfo` returns an EMPTY
`minActiveByPosition` because the endpoint publishes none, and
`apps/companion/app/rosterMinimums.ts` is the only place a number joins it — on
the way into the planner, which is the one screen that enforces a formation.

A scrape, and a script rather than an adapter for that reason: a regex over
somebody's markup is run by a person, audited, and checked in, never executed on
a request. It reads `FANTRAX_COOKIE` from the environment and logs no part of it.

### What it would have been without this

Hold the XI at eleven and the caps alone imply a floor:

```
min(p) = maxActivePlayers − Σ maxActive(q≠p)
D 11−(1+5+3) = 2 · M 2 · F 11−(1+5+5) = 0 · G 0
```

**Two at the back, and a goalkeeper floor of nought** — 5+5+3 = 13 ≥ 11, so the
caps permit an XI with no keeper at all. Every one of those is wrong against the
real settings, which is the measure of how far "the API does not say" is from
"the league does not care".

## The commissioner's cookie opens all of it — probed 21 Sep 2026

Craig supplied his own session and the probe was **read methods only**; nothing
below changed a league. `adminMode` and the writes were answered on 28 Sep 2026 (below).

**The cookie is live but `roles` is `"none"`** — and `myTeamIds` comes back as
**all ten** dummy teams, with a `commissioner` key on every response. So role is
not the field to gate on; team ownership is.

| Method | Unauthenticated | With the cookie |
|---|---|---|
| `getPendingTransactions` | NOT_MEMBER | **OK** 4.4 KB |
| `getTradeBlock` | NOT_LOGGED_IN | **OK** 62 KB |
| `getCommissionerHubInfo` | NOT_LOGGED_IN | **OK** 7.3 KB |
| `getLeagueHomeInfo` | NOT_MEMBER | **OK** 318 KB |
| `getTeamInfo` | NOT_LOGGED_IN | **OK** 4.4 KB |
| `getLeagueSettings` | NOT_LOGGED_IN | **OK** 136 B |

**The real league refuses even WITH the cookie** — `NOT_MEMBER_OF_LEAGUE`, where
unauthenticated it says *"you cannot use this screen until there is at least one
team in this league"*. A league with no teams has no members, so this is the
empty state and not a wrong id. **It must be re-probed after the draft**, because
until then nothing here is known to be true of the league we actually serve.

### Three cookies, and Cloudflare is not one of them

The header Craig pasted carried thirteen cookies including `cf_clearance` and
`__cf_bm`. Stripped to **`uig`, `ui` and `FX_RM`**, `getPendingTransactions` and
`getLeagueSettings` both still answer OK. That is the question that decides
whether any of this can be *deployed*: Cloudflare's clearance is bound to an IP
and a user-agent and would never survive the trip to Vercel, and the auth does
not need it.

So the deployable secret is three cookies, not a browser session — and `FX_RM`
reads like a remember-me token, which is the one of the three most likely to
outlive a week. **How long it lasts is unprobed** and is the next thing to know,
because a secret that dies every Sunday is an operational problem and not an
architecture.

### The league home is a CM league homepage already

`allViewPanes` — thirteen, in the league's own order, `empty` telling you which
have content:

`COMMISSIONER_MESSAGE` "Commish Memo" · `LEAGUE_POLLS` · `LEAGUE_ARTICLE` ·
`H2H_SCHEDULE` · `STANDINGS` · **`CHAT`** · `PENDING_TRANSACTIONS` ·
**`MESSAGE_FORUM`** · `PLAYERS` "Player News" · `TRANSACTION_HISTORY` ·
`PUBLIC_TRIVIA` · `INJURY_REPORT` · `PUBLIC_POLL`

`messageForum` is `{header, threads:[]}` — empty in dummy, so **the populated
shape is unknown** and must be read from a league that has posts before anything
renders it. `LEAGUE_ARTICLE` is worth a second look for its own reason: the paper
could file into Fantrax rather than only onto our own front page.

### ~~The trade block is real data, not a stub~~ — this is the editor's picker (corrected 7 Oct 2026)

**Wrong read:** these lists are who a manager COULD offer or want, not who is on the block. The block is
`getTradeBlocks`; see *The trade block, and trade proposals* (7 Oct 2026).

`scorerListForWanted` **150**, `scorerListForOffered` **15** in dummy. Each entry
is a full scorer — name, club, `posShortNames`, `scorerId`, `headshotUrl`, and
`icons[].tooltip` carrying the injury line (*"Calf - Late fitness test
(Game-time decision)"*). So "who is on offer and who is wanted" needs no
invention.

### Pending transactions, and the waiver rule

`claimTypes` is `{1: FREE_FOR_ALL, 2: RANKING}` and `selectedTxType` is `CLAIM`.
`noResults: true` in dummy at the time of probing — the method answers, the
league simply had nothing pending, so **the populated table shape is also
unknown**. Read it on a Wednesday. (Read on 1 Oct 2026: *Re-probed 1 Oct 2026 off the page itself*, below.)

### Nineteen commissioner actions, in five groups

`{linkKey, id, shortName, description, group, admin}`, and `admin` is `false` on
all nineteen.

- **Rosters & Players** — Process Waivers · Execute Auto-Subs · Waive All
  Players · Illegal Roster Override · Min/Max Violation Override · Position
  Eligibility Override · Player Status Override
- **Setup & Roles** — League Setup · Team Administration · Team Permissions ·
  Edit Commissioners · **Commissioner Messages** · Replace Owner
- **Stats & Scoring** — Scoring/Standings Adjustment · Override Player Stats ·
  Recalculate Fantasy Points
- **Draft** — Reset League & Rosters
- **League Management** — Copy / Renew League · Delete This League

The action-shaped ones (Process Waivers, Execute Auto-Subs) carry a null
`linkKey`, so they are `executeCommissionerHubAction` calls rather than links.
**Every one of them is a write and none was called.**

The hub also carries the league's **period calendar with real date ranges** —
Fri–Thu weeks, `(Fri Aug 21, 2026 - Thu Aug 27, 2026)` through
`(Fri Apr 30, 2027 - Thu May 6, 2027)`. `periodAlignment.json` is a frozen
fixture with placeholder kickoffs on 33 of 38 rounds; this is the real thing.

## `getTeamRosters` honours a period, and the answer differs — probed 2 Sep 2026

`fetchTeamRosters(leagueId, period)` echoes the period asked for, verbatim.
Asked without one it answers with whatever Fantrax currently labels the
rosters, **and that label rolls the moment a round's last fixture ends** — so
for about four days in seven it names next week.

Measured on the dummy league, 2 Sep, while the round in view was period 2:

| asked | echoed | teams | first squad |
|---|---|---|---|
| (none) | **3** | 10 | 15 |
| 1 | 1 | 10 | 15 |
| 2 | 2 | 10 | 15 |
| 3 | 3 | 10 | 15 |

**It is a different answer and not merely a different label: 3 of 10 teams
field a different ACTIVE side in period 2 than in period 3.** Status on this
public endpoint is the string `status: "ACTIVE" | "RESERVE"` — not the SPA's
`statusId`, which is absent here.

Why it mattered: `gatherRoundFacts` asked without a period while every other
read in it asked for the round's. `wasFielded` compares the two, so it was
false for every column that fires after a round finishes — which is all of
them — and `eleven` and `dodgers` refused outright when it was false (the dodgers stopped
reading benches on 30 Sep 2026), because
"benched" is a claim about a side somebody actually picked. Those two columns
could never file, and because a refusal spends no covered-key they sat at the
top of every firing's running order and wedged the paper behind them.

## `getStandings` has three views and we read two — probed 31 Aug 2026

Craig linked `…/standings;view=SEASON_STATS` as a source for Team Stats. Probed
live against the rehearsal league, public, no auth, one POST, 52 KB:

`displayedLists.tabs` enumerates the whole set, so this is the complete list
rather than three we happen to know about:

| View | What Fantrax calls it | We read it as |
|---|---|---|
| `REGULAR_SEASON` | Regular Season | `fetchStandingsPage` — the league table |
| `SCHEDULE` | **Results** | `fetchSeasonResults` — 38 period tables |
| `SEASON_STATS` | Season Stats | **nothing yet** |

`SEASON_STATS` answers **29 tables**: a summary, four per-position roll-ups
(`Points`/`Statistics` × `Goalkeeper`/`Outfielder`), and 22 single-category
leaderboards — Goals, Assists (Official), Assists (Fantasy), Minutes, Clean
Sheets On Field, Goals Against, Saves, Yellow, Red, PK Saves, PK Missed, Own
Goals — split by position, each with a `+/-`. Two of the 29 are section headings
with zero rows (`Standings By Category - Goalkeeper` / `- Outfielder`).

**Two traps, and both would ship as plausible wrong numbers.**

**1. "Games Played" is player-appearances, not rounds.** The summary shows test3
on 20 games played with the league one round old. It is the squad's appearance
count. So its `Fantasy Points per Game` — 4.3 off 86 points — is per APPEARANCE,
and is not the per-round average `teamPeriodStats` computes (86). Both are called
"per game" and they differ by a factor of the squad size.

**2. The stat tables repeat one header key.** `Standings - Statistics -
Outfielder` publishes keys `['fpts','sc','sc','sc','sc','sc','sc','sc','sc',
'sc','sc','sc']` — `sc` eleven times, one per stat. `mapStandings`' rule of
reading columns by key and never by position is what protects the league table
from Fantrax letting a manager reorder it, and here it does the opposite: our
`columns()` keeps the FIRST index per key, so all eleven stats would read as
Minutes Played. These tables have to be read positionally against their `name`,
which is the inverse of the rule ten feet up the same file. Whoever builds this
should put the reason in the mapper.

**It takes a timeframe** (probed 6 Oct 2026, real league): `displayedLists.timeframeTypes` offers `YEAR_TO_DATE`,
`BY_PERIOD` and `BY_DATE`. Unasked it is year to date over the whole calendar, so the real league's board counted
GW1–5 before its first pairing (period 6). `timeframeType: "BY_DATE"` with `startDate`/`endDate` (days in Fantrax's
zone) counts only those days, and drops the two `+/-` columns, so FPts sits one cell nearer the team: the mapper
reads its offsets from each table's header. Team Stats asks from the league's first pairing (`leagueSeason`).

### `getPlayerStats` carries raw stats — but only when asked by POSITION GROUP

Probed 1 Sep 2026, and it overturns a conclusion reached an hour earlier that
Fantrax does not publish per-player raw stats at all. It does. The parameter is
**`positionOrGroup`**, which Craig found in his own browser URL
(`/players;statusOrTeamFilter=ALL;pageNumber=1;positionOrGroup=SOCCER_NON_GOALIE`):

| `positionOrGroup` | Columns |
|---|---|
| omitted, or `ALL` | **7** — `Rk Sta Opp FPts FP/G Ros +/-`, fantasy only |
| `SOCCER_NON_GOALIE` | **18** — the 7 plus `GP Min G A AF YC RC PKM OG GAO CS` |
| `SOCCER_GOALIE` | **20** — the 7 plus `GP Min CS GA Sv YC RC PKS PKM G A AF OG` |

So two calls cover the pool with raw stats. It is the same goalkeeper/outfielder
split `SEASON_STATS` has at team level, and the same combining rule applies.

**Why this was nearly missed, recorded because the reasoning was sound and the
answer was still wrong:** a probe of eight `statsType`/`scoringCategoryType`
combinations returned 7 columns every time, five of them server-rejected with
"not available for this league's sport", and `hideStatsFilter: true` on every
response. That is a coherent story — Fantrax hides the category switch for EPL —
and it pointed at the wrong conclusion, because the switch that matters is not a
category type at all. **`data.tabs` and `scoringCategoryTypes` enumerate what the
payload offers and neither mentions `positionOrGroup`**, so no amount of reading
the response would have found it; it came from a URL.

`getPlayerProfile` also carries a full raw stat line per player
(`{"playerId": "<scorerId>"}`, not `scorerId`), but throttles at ~27 calls even
batched into one POST — fine for one player's page, unusable for a board.

### There is no days-back window, and the payload advertises one — probed 5 Sep 2026

Fantrax's own players screen draws a **Days Back** control reading `1 7 14 30
60`, and the payload backs it up twice over: `goBackDays: [1,7,14,30,60]` at the
top level and in `displayedLists`, with `displayedSeasonOrProjection.showGoBackDays:
true`. A "form over the last month" column was planned on it. **It cannot be
driven, and the control is not what it looks like.**

Ten parameter spellings were tried first — `daysBack`, `numDaysBack`, `days`,
`lastNDays`, `timeframeTypeCode`, `statsRange`, `dateRange`, `timeframeNumDays`,
`statsPeriod`, `timeStartTypeDays`, at 7 and 30, on the dummy and rehearsal
leagues. Every one answered 200 with a byte-identical board.

**`goBackDays` is the field's real name and it is inert.** Paired with
`timeframeTypeCode: "BY_DATE"` the board DOES change and the echo becomes
`SEASON_926_BY_DATE` — which reads like success and is not. Asked at 1, 7, 14,
30 and 60 days the five boards are **identical to each other**, and the season
object comes back spanning `2026-08-21 → 2027-05-31` at every one of them: the
whole season, the same range YTD reports. So `BY_DATE` is a different *scoring
basis*, not a window — `displayedTimeStartType` reads `PERIOD_ONLY`, and 2 of
583 rows on the dummy league and 11 of 583 on the real one come back **higher
than the same man's season total**, which no subset of a season can be.

The lesson is the one this section already carries in another place: asking is
not knowing, and neither is a changed answer. A published enumeration is a
description of a UI control, not a promise about a parameter — the same shape of
mistake as `hideStatsFilter` above and `squad_number` in CLAUDE.md.

**Consequence for `/players`:** the form column is the sister repo's SofaScore
rating and FPL minutes, not a Fantrax `FPts (30d)`. Recorded so it is not
re-planned.

### ~~No window~~ — an explicit date range IS a window, probed 30 Sep 2026

`goBackDays` is still inert, but `timeframeTypeCode: "BY_DATE"` with `startDate`
and `endDate` as `YYYY-MM-DD` answers that range and nothing else: Gross reads 14
for 11–17 Sep against 38 for the season, and the echo carries the dates back.
**132 of 133** rostered men in rehearsal period 4 match `getLiveScoringStats`
exactly, and **123 of 124** in period 5; each miss is dual-eligible (live prices
his slot, the pool his default position). A period ends mid-afternoon on the next
Friday (`14:59:59-0400`), so its last day is the day before (`periodDays`), which
is how Fantrax labels it ("4 (Sep 11 - Sep 17)"); period 5 opens on a Friday
night and proves the boundary. So a period's own dates give Fantrax's points for every man
in the pool, free agents included, in one read. It works with `positionOrGroup`,
so the stats league answers a gameweek's shots and key passes the same way.
`BY_PERIOD` exists ("2026-27 - Game Week") but no spelling of the period took
(`period`, `startPeriod`/`endPeriod`, `displayedPeriod`, `periodNum`,
`scoringPeriod`, `selectedPeriod`): each echoed `displayedPeriod 6` and every
figure 0. The Bin XI reads it (`fetchPoolWindow`).

### The player deep link is `/player/{scorerId}/{leagueId}`, read out of their bundle

Re-probed 1 Oct 2026 off Craig's own link,
`/player/04fk1/mqsjd23smsgbiqzr/pascal-gross/l5kunst8msgbirdf`.

**The status code cannot answer this.** Fantrax is a single-page app and every
path answers **200** with the same shell and `<title>`, so the routes were read
out of their production bundle. `main-GK4CIWH5.js` declares `player/:playerId`
with two children, `public` and `:leagueId`, and **no empty child**; the lazy
`PlayerProfileModule` (`chunk-IKDYPAY6.js`) then takes `""`, `:playerName` and
`:playerName/:teamId`. So the full shape is
`/player/{scorerId}/{leagueId|public}/{urlName}/{teamId}`.

- **`l5kunst8msgbirdf` is a fantasy TEAM id**: The Raccoons in `getLeagueInfo`'s
  `teamInfo` for `mqsjd23smsgbiqzr`. It is not the player's owner (every roster
  is empty before the 3 Oct draft); it is the team the SPA was browsing as, and
  the resolver passes it to `getPlayerProfile` as `teamId`.
- Loaded in a clean headless Chrome: **`/player/04fk1` draws a blank page**
  (title stays the shell's, no profile). `/player/04fk1/{leagueId}`, with or
  without the slug and team id, and `/player/04fk1/public` all draw Pascal Gross,
  the league ones with his league status (`FA`). Anonymously the team id changes
  nothing visible.

So **`/player/{scorerId}/{leagueId}` is the shortest working link**, with the
league from `FANTRAX_LEAGUE_ID`. The single-segment route this section recorded on
5 Sep 2026 (`main-5QAFZCGR.js`) was true then and is gone.

A trade goes to the owner's roster instead:
`/fantasy/league/{leagueId}/team/roster;teamId={ownerTeamId}?tx=true`, off Craig's
browser URL. The roster chunk (`chunk-LYQAGP3V.js`) reads `teamId` as a matrix
parameter and passes `tx` to the roster as `showTrade`.

`scorerId` is our `fantraxId`, so neither link needs anything we do not already hold.

**A third league, to see the whole vocabulary.** Craig, 1 Sep 2026: "i could
make another fantrax league that opens up all scoring categories so we can get
all the data it has". `SEASON_STATS` publishes what THIS league scores, so a
category nobody pays for is invisible — the Appearances group has only Minutes
because sub-on/sub-off and bench points are not scored here, not because Fantrax
lacks them. A rehearsal league with every category enabled would answer, once,
what the full set is. **Deferred** as of 1 Sep; until then, absence in this
payload means "not scored in our league" and never "Fantrax does not track it".

Nothing is built on any of it — Craig is deciding what Team Stats should hold.
Today's page is high/low/average/rounds off the results payload, which none of
the 29 tables above carries.

## Current priorities

- Keep `packages/core` clean: adapters, maps, scoring, identity.
- Keep `apps/companion` focused on the live app experience.
- Keep `apps/lab` as the future 27/28 prototype.
- **Do not build a server-side Fantrax login.** reCAPTCHA v3 with a v2 fallback,
  plus 2FA, makes it unviable, and we hold no passwords (CLAUDE.md's auth
  constraint). The write surface is the commissioner's own cookie plus
  `adminMode`. **A browser extension is not an option** and has not been since
  19 Aug 2026 — see `docs/record/SEASON_LOG.md`, "The extension plan is dead, and it was
  dead on arrival". *This line read "unless the extension/cookie flow is solved"
  until 3 Sep 2026, which left the extension route sounding open.*

## Known constraints

- Fantrax auth is gated by reCAPTCHA + 2FA and cannot be migrated to a standard
  password flow.
- FPL player `code` is stable; FPL player `id` is season-scoped.
- Fantrax sport code for EPL is `EPL`, not `SOCCER`.

## Verified Fantrax facts (probed live 5 Aug 2026)

League id `ayyoh3n2mr326v2o`. Everything below is from real responses, not docs.

**Errors arrive as HTTP 200.** The failure is in the body:
`{"error":{"onScreen":bool,"code":string,"message":string}}`. `res.ok` is useless
here — the FPL client's `if (!res.ok) throw` would sail straight past every one of
them. Codes seen so far: `WARNING`, `INVALID_LEAGUE_ID`, `NO_TEAMS`, `NO_LEAGUE`.
The vocabulary is undocumented and inconsistent (the same missing-leagueId
condition returns `WARNING` from some methods and `INVALID_LEAGUE_ID` from
others), so we branch on the envelope's presence, never on a specific code.

**The league is empty until the draft.** `getTeamRosters` answers `NO_TEAMS`,
`getStandings` is `[]`, `getDraftResults` is `{draftPicks: [], draftState:
"running"}`. Their element shapes had therefore never been observed and were
typed `unknown` rather than invented — until 6 Aug, below.

**`getLeagueInfo` is populated now**, and carries: 38 scoring and roster periods
aligned to FPL gameweeks (period 1 opens 21 Aug), roster limits 14 total / 11
active / 3 reserve with position caps G1 D5 M5 F3, snake draft, the full scoring
system, and a 699-entry `playerInfo` map. Timestamps carry a `-0400` (US Eastern)
offset while `startDate`/`endDate` are plain dates — do not mix them.

**`getPlayerIds?sport=EPL`** needs no leagueId and returns 759 entries (758 on
5 Aug — the pool moves), of which **60 are not players**: synthetic per-club
entities (`Tm`, `TmOF`, `TmG`) whose `fantraxId` contains `#`. Filter them out or
they reach the identity bridge and match a club by name. `rotowireId` is on 544
of the 699 real players (78%; the 71% figure that was in `CLAUDE.md` divided by
all 759 entries, team entities included). **`sportRadarId` does not appear on this
endpoint at all.**

**Club codes differ from FPL on exactly two of twenty:** Fantrax `BRF`/`NOT`
versus FPL `BRE`/`NFO`. Everything else matches.

## Verified Fantrax facts (probed live 6 Aug 2026, both leagues)

The rehearsal league `zbn1z3ukmsgb36sz` was auto-drafted this morning: 4 teams,
15 rounds, 60 picks. `getTeamRosters` and `getStandings` returned populated
payloads for the first time, so the three reads above stopped being wishes.

**`getTeamRosters` takes a `period` parameter and echoes it back.** Previously
unknown. Shape is `{period, rosters: {teamId: {teamName, salaryCap, rosterItems:
[{id, position, status}]}}}`, status `ACTIVE`/`RESERVE`. Note the shape was not
merely unmodelled before — it was typed `Record<string, unknown>`, i.e. guessed
wrong, which is `docs/rules/CODE_RULES.md`'s "raw.ts no longer mirrors reality" refactor
trigger.

**Field presence varies between leagues, not just between states.** On the same
day, from the same method: the real league's `getLeagueInfo` carries `draftType`
and `leagueHistoryId`, the rehearsal league's carries neither. That is why every
raw field is optional, and it caught a live §5 violation — `mapLeagueInfo` did
`draftType: raw.draftType ?? ""`, which now reports a draft type Fantrax never
gave. It is `string | null`.

**Roster limits differ by league** — 15 total / 11 active / 5 reserve in the
rehearsal league against 14 / 11 / 3 in the real one, same position caps
(G1 D5 M5 F3). Leaving them mismatched was right: rendering both correctly is the
10 Oct swap, tested continuously instead of discovered on the day.

**`playerInfo.status` is an ownership flag.** Exactly the 60 rostered players are
`T`, 638 are `FA`, one is `WW`. Stays a raw string — the vocabulary is theirs.

**Standings shape is known and every value is zero**, because nothing has been
played. `points` is a `"0-0-0"` win-loss-tie string, left unparsed: splitting it
would infer a format from an all-zero sample. `gamesBack` and `winPercentage` are
derived by them and not mapped.

**The bridge resolved all 60 drafted players** — 50 exact, 10 fuzzy, zero misses,
60 distinct FPL codes. The launch gate most likely to embarrass us passes on real
rosters, and the one-to-one guarantee holds on live data.

**Degradation states multiply.** In a one-team dummy league, draft picks arrive
with no `playerId` at all and the roster is `[]` rather than a `NO_TEAMS` error.
Draft picks also arrive unsorted, and in an auto-draft every pick's `time` is
identical.

### The period↔gameweek alignment, settled — and the test that misleads

This was an open question. It is answered, and the obvious way to check it gives
the wrong answer:

- By **FPL deadline**, the two calendars disagree everywhere. Each deadline lands
  one period early — period 1 holds gameweek 2's — and around the September break
  period 3 gets no gameweek while period 4 gets two.
- By **fixture kickoff**, all 38 periods contain exactly the identically numbered
  gameweek. All 380 fixtures, zero mismatches, in both leagues.

Fantrax's period boundary sits inside the 90-minute gap between FPL's deadline and
that gameweek's first kickoff, which is what puts the deadline on the wrong side
of it. **Kickoff is the alignment key.** `deadline_time` is the field anyone
reaches for first, so `calendar.test.ts` asserts the wrong answer too, by name.

Both leagues carry byte-identical `scoringPeriods` today, but that is default
settings rather than a rule, so `npm run periods` checks each league separately
against live FPL. Postponements are the known future divergence: FPL keeps a
rearranged fixture in its original `event`, Fantrax scores it in the period
actually played.

**Position is league state, not football truth.** The commissioner can change a
player's position whenever they like, and `eligiblePos` is multi-valued (`"F,M"`,
`"M,D"` — 51 players today). It is a display hint and never a join key. The
player universe is mutable too: Fantrax carries academy players FPL has never
listed (699 real players against FPL's 570 non-manager elements), so `unmapped` is
a correct and permanent state for some players rather than a matching failure.

## Decisions

- **FPL has hard rules; custom rules are Fantrax's product.** This is *why* the
  two layers are separate, and it is sharper than "different providers". FPL
  models a game whose rules are fixed for everyone, so they can be constants. A
  Fantrax league models a game whose rules are the thing being sold: roster limits
  and position caps, the position vocabulary itself, the scoring system, the
  period calendar, the lineup deadline, team count, the matchup schedule, draft
  type, season bounds. **All of it is read from `getLeagueInfo`** — never assumed,
  never hardcoded, never inferred from the football layer. The two layers differ
  in epistemics, not just in content. `RosterLimits` is the precedent to copy.
- **The calendar is the second seam between the layers.** "They meet only through
  player identity" was true until periods needed aligning to gameweeks. The rule
  is now: the league layer may be *told* about the football calendar as plain
  data, but may never import the football adapter, and football may never import
  the league. `league/calendar.ts` declares its own `GameweekKickoff` rather than
  importing `Fixture`, the same move `identity/candidates.ts` makes with
  `FplCandidate`. A script does the wiring.
- **Snapshots are filed per league, and the pool is filed outside them.**
  `getPlayerIds` takes no leagueId and returns byte-identical answers for every
  league, so filing it under one would force `build-bridge.ts` to choose
  arbitrarily between two copies — and that arbitrary choice is the tell. It also
  keeps ~104 KB/day of duplication out of git.
- **Position left the football layer.** `FootballPlayer` no longer carries one.
  FPL's `element_type` is FPL's own fantasy classification, not a property of the
  footballer — Fantrax files the same player differently and lets them hold
  several positions at once. Neither provider is describing the real world, so a
  single `Position` in a layer that claims to be provider-neutral was a league
  concept wearing football clothes. Positions now exist only in the league layer,
  as `eligiblePositions`. Nothing in the UI read it, so there was no call site to
  migrate, and `element_type` stays in `fpl/raw.ts`, which mirrors the wire
  format whether or not we consume a field.
- **No scoring engine this season.** Fantrax computes the points and its numbers
  are authoritative; we read them. The full `scoringSystem` is captured but not
  modelled. Minor exceptions may come later, deliberately.
- **The write surface is the commissioner's cookie plus `adminMode`**, which
  writes a team the commissioner does not own (probed 28 Sep 2026, below).
  `confirmOrExecuteTeamRosterChanges` sets lineups; `confirmOrExecutePlayerPickerChanges`
  (waivers) is unprobed.
- **`data/` is checked into git.** The snapshots and the identity bridge are the
  season's permanent record; git is both audit trail and backup.
- **Capture starts now, not at the draft.** Roster transitions cannot be
  backfilled from anywhere — see below.

## Why the capture cannot wait

Fantrax serves current state only. It will not tell us in March who was benched in
October, and no archive holds our league: it sits behind a league id nothing
crawls. Any longitudinal question — form over time, who has been dropped by whom,
the FM-style player narratives we want in 27/28 — is answerable only from a record
we wrote ourselves, as it happened.

The sibling project (`~/ai-carling-premiership`) had exactly this and its per-GW
capture died silently at GW35. It survived only because FPL's bootstrap is a public
URL the Internet Archive happens to crawl monthly. We have no such luck, so the
failure mode to design against is silence, not error: `npm run capture:status`
reports the age of the last capture and exits non-zero when overdue.

Cadence is weekly until a league drafts and daily after, and both are per league:
the rehearsal league crossed that line on 6 Aug, the real one crosses it on
10 Oct, so `capture:status` reports each separately. One combined answer would
hide whichever of them stopped. Known blind spot: at daily granularity a player
added and dropped the same day is invisible. Revisit once the draft shows how much
same-day churn there actually is.

## Identity bridge

`data/mappings/fantrax.json`, generated by `npm run bridge`, audited by hand.
First run: **542 of 699 settled** — 474 exact, 66 fuzzy, 2 by curated alias.

The ladder is exact → alias → fuzzy, two passes per club, one-to-one. Exact
matches claim their FPL player before fuzzy matching can compete for them, and a
fuzzy win must clear 88, beat the runner-up by 3, and — where the win came from
one name containing the other — agree on the surname. That last guard is load
bearing: `token_set_ratio` scores containment at 100, so "Gabriel" ties perfectly
with both Arsenal's Gabriel and Gabriel Jesus.

Three bugs worth remembering, all found by running against the real pool rather
than by the test suite:

1. **The surname guard read the wrong end of the name.** Fantrax writes
   surname-first, so the last token of its raw form is the *given* name. The guard
   was asking whether FPL's player is called "Danny" and rejecting Daniel Ballard.
   Every diminutive failed this way — Josh/Joshua, Ben/Benjamin — while looking
   like a careful refusal. It reads the reading-order form now.
2. **Apostrophes.** Fantrax writes `OBrien`, FPL writes `O'Brien`. Normalising the
   apostrophe to a space split one token into two sharing nothing with the other,
   dropping completely unambiguous names below threshold. Deleted, not spaced.
3. **Claimed codes did not survive a re-run.** The one-to-one guard was per-run,
   so a code won on run one was free again on run two: Jack Clarke matched, then
   Harry Clarke took his code. Three FPL players ended up with two claimants. The
   matcher is now seeded from the existing bridge.

Re-runs revise one thing and one thing only: the script's own assumptions. Every
match, and every `unmapped` row a person wrote or confirmed, survives untouched —
the pool mutates constantly, and a run that quietly overwrote a human decision
would be untrustworthy exactly where it was most carefully made. See the residue
section below for why the assumptions are the exception.

### Ranking the audit

`confidence` cannot rank it: every fuzzy row scores 100, because
`token_set_ratio` saturates whenever one name's tokens contain the other's.
`MappedEntry.agreement` is the second signal — it compares the two *full* names
and reports `identical`, `contained` or `conflicting`. Full names only: FPL
publishes a bare surname as a name variant, so scoring against variants makes
every genuine conflict read as containment.

That splits the 66 fuzzy rows **53 `contained` / 13 `conflicting`**. Eleven of the
thirteen are plainly one player written two ways (Danny/Daniel Ballard,
Kostas/Konstantinos Tsimikas, Djordje/Đorđe Petrović — Serbian `Đ` transliterates
to `Dj` in one feed and folds to `d` in ours). Two looked unsettleable from the
payloads alone, because the feeds agree on club *and* position but not on given
name:

- `Andrews, Keith` → `Kaine Andrews` (COV)
- `Koumas, Louie` → `Lewis Koumas` (LIV)

**Settled 19 Aug 2026, all 13 `conflicting` rows audited.** Club is a hard filter
before fuzzy scoring ever runs, so both pools held exactly one candidate of that
surname — the same uniqueness that makes the other eleven obviously one player
(Ballard, Tsimikas, Petrović, ...) applies here too. Two different real people
sharing a surname *and* a specific club, with FPL listing only one of them, is
the coincidence that would have to be true for these to be wrong; a first-name
slip in one feed is the far likelier read. Signed off as correct rather than
overridden to `unmapped`.

Adding the field changed no assignment: regenerating from an empty bridge
reproduced the same 542 rows with zero `fplCode` reassignments.

### What the coverage number means

78% understates it badly. Roster limits are 14 players across 16 teams, so **224
of the 699 will ever be rostered**. Against FPL's top 224 by price the bridge
covers 223 — and the miss, Nicolas Jackson, is absent from Fantrax's pool
entirely rather than unmatched. The 157 then in review were overwhelmingly academy
players nobody will draft: 156 of them scored below 60 against their best
candidate, which is noise. The single real match in that pile was `Ehor Yarmolyuk`
→ `Yehor Yarmoliuk` at 72, a Ukrainian transliteration that belonged in the alias
file — and the residue section below is how that one row stopped being buried
under the other 156.

**Outstanding:** the 13 `conflicting` rows are now audited (see above); the other
555 mapped rows — 499 exact, 53 fuzzy `contained`, 3 alias — still have
`auditedAt` unset.

### The residue, and why the script may answer for it

*19 Aug 2026.* The review file held 157 rows, of which perhaps two were real
questions. Nothing separated them, so nobody read it, which is the failure mode
worth naming: a review file that is never empty enough to read is a review file
that does not exist.

`UnmappedEntry` now records **who concluded it**, not just that it was concluded.
`unmappedBy: "no-fpl-match"` is the script's; `"manual"` is a person's, and no
threshold may ever write it. `auditedAt` stays a separate question — a person may
confirm what the script concluded, and doing so is what makes the row final.

That split buys the thing `auditedAt` alone could not: **an assumption is
recorded but not settled.** "Nobody in FPL looks like him" is only ever true of
the list that run read, and FPL adds players all window. So `settledIds` leaves
assumed ids out and they go back through the matcher every run, and `mergeBridge`
keeps an assumption only by being handed it again — the mechanism that promotes an
academy player FPL lists in January, and the one that stops the file claiming "no
FPL counterpart" about somebody this run has just sent to review instead. It
earns its keep immediately: the first run over the 19 Aug pool dropped 32 rows
recorded against pools the commissioner has since trimmed, and turned 6 more
into exact matches.

**`ABSENCE_MAX_SCORE = 50`, and it is not `FUZZY_MIN_SCORE`.** 88 asks "is this
him?"; the ceiling asks "is anyone here close enough that a person should look?",
and between 51 and 87 the honest answers are no and yes. Set below the hole in the
first residue's distribution (92 scored rows, 17–72, empty between 55 and 72). The
tempting ceiling is the empty band just under 88, and it is a trap: the top score
in the file was `Ehor Yarmolyuk` → `Yehor Yarmoliuk` at 72, the same Brentford
midfielder. A ceiling above him files a first-team starter as absent and nobody
ever looks again.

Bridge now, against the 19 Aug pool: **688 rows — 568 mapped (499 exact, 66
fuzzy, 3 alias), 120 `no-fpl-match`, review 3.** The three are academy players
scoring 52–55 against unrelated seniors — the residue the ceiling exists to
surface, and a person's call. Yarmolyuk is the third alias.

The totals track the pool rather than accumulating, which is the point: a bridge
row for a player Fantrax no longer carries is only worth keeping when somebody
decided it.

### The empty-league pass, 19 Aug 2026 — and the league's own name is two seasons stale

Ran every page against `FANTRAX_LEAGUE_ID=ayyoh3n2mr326v2o`, the real league,
which has no teams until 10 Oct. **All nine routes answer 200 and every one of
them degrades honestly** — the undrafted sentence on the paper, "No table yet"
with the section nav intact, "Nobody plays anybody yet", "Nobody has a squad
yet", each carrying the provider's own tell (`getTeamRosters → NO_TEAMS`,
`getStandings → 0 rows`, `38 periods, 0 pairings`). The football tabs are
unaffected, as designed: `/gw/1` lists GW1's fixtures and `/matchday` names the
first kickoff without the league layer being involved at all.

The player pool works pre-draft too — 670 rows, everyone on Waivers — which
makes it the one league page worth opening before draft night.

**One finding, and it is not a code fault.** `getLeagueInfo.leagueName` for the
real league is **"Tim Hortons Pro League 24/25"**. The schedule page prints it as
its subtitle, correctly and verbatim (§3: server-driven, never our copy), so on
10 Oct sixteen people will read "24/25" directly beneath a masthead saying 26/27.

**This is a commissioner setting, fixable in Fantrax in a minute, and invisible
to any test we could write.** It belongs in the ship-day runbook rather than in
the code.

*Settled 25 Sep 2026: ayyoh was never the real league. See that day's entry.*

## Injury is not a per-match fact anywhere we read (10 Sep 2026)

Asked for on the team sheet — `cm9900/16.jpg` marks a man `inj 7`, injured during
the match at the seventh minute. **Neither feed publishes one.**

- The fixture detail's `events` array carries eight types over 862 rows: `PS`,
  `PE`, `G`, `O`, `P`, `MP`, `B`, `S`. No injury.
- Opta's textstream carries **25** types over 1,103 events across ten fixtures —
  `free kick lost` 241, `free kick won` 234, `miss` 95, down to `own goal` and
  `red card` at one apiece. No injury.
- Thirteen of those 1,103 lines mention injury, a stretcher or a knock **in the
  prose**. Reading it out would be parsing sentences for a fact, which CODE_RULES
  §3 forbids at runtime, and it would be wrong on every line that phrases it
  differently.
- `start delay` / `end delay` appear 8 times each and often bracket an injury.
  That is an inference and not the fact — a delay is also a floodlight, a crowd
  incident or a VAR check.

FPL's `status` (`i` injured, `d` doubtful, `s` suspended) is a statement about
**now**, not about the match. Printing it beside a man on a team sheet for a
match played a fortnight ago would say he was injured that day, which is not what
it means.

So the card block on the team sheet carries a booking and a sending off and
nothing else. **A red card is already drawn** — `--color-bad` against the
booking's accent — and reads correctly; it looked absent only because there was
exactly one red card in gameweeks 1-3 (Brighton v Aston Villa, 40', FPL fixture
7), and the match being looked at had none.

## A doubt DOES carry a date — `news_added`, 198/198 (17 Sep 2026)

**Counted live against `bootstrap-static`, and it overturns something two files
asserted in writing.** `core/inbox/items.ts` set `at: null` on every injury item
with a comment saying FPL "publishes no 'as of'" for a doubt, and
`gazette/types.ts` said the same; the inbox therefore dated every injury to its
round and the blue block read `GW4` where every other row read a date.

- 659 elements. **198 carry a non-empty `news` string.**
- **198 of those 198 carry `news_added`** — an ISO instant with microseconds,
  e.g. `Saliba 2026-07-23T12:01:23.289376Z`, `White 2026-09-15T19:30:09.494382Z`.
- It is the moment FPL ATTACHED THE LINE, which is exactly the "as of" the
  comment said did not exist. It moves when they revise the note.

So a doubt is an event with a stamp like any other item on the inbox, it sorts
into one feed with the transaction business, and nothing has to invent a date.
The domain type has carried it as `FootballPlayer.newsAdded` since the first
mapper — nothing had ever read it.

**The lesson is the one this file exists for**: the claim was never probed, it
was reasoned from what a doubt *is* ("a state that holds now"), and it was
written down twice at length in the voice of a settled fact. Count it before
building on it.

## Weather is not published either (10 Sep 2026)

Counted across every key at every depth of the fixture detail: no `weather`,
`temperature`, `wind`, `rain`, `condition` or `climate`. FPL publishes none. CM's
own foot line carries it and ours cannot, so the line draws referee and
attendance and holds no empty slot — a slot implies a gap that could be filled.

## The fixture detail's own `events` array, and why it retired a sister-repo read (10 Sep 2026)

`GET /fixtures/{id}` carries an `events` array beside the team sheets. It is not the
textstream and it was neither typed nor documented until now — the full count is in
`docs/providers/premier-league-api.md`, and the standing facts are these.

**It is on 30/30 completed fixtures and absent on all 10 upcoming ones**, which makes it an
exact tell for "has this been played". 862 rows over gameweeks 1-3: 538 substitution rows
(269 `ON`, 269 `OFF`), 118 bookings, 76 goals, 5 own goals, 4 penalties, 1 missed penalty,
120 period marks.

**What it replaced.** The match screen's shirt numbers, sub notes and player ordering came
from the sister repo's `matches/26-27.json`, which covers fixtures **1-20** of a season
whose `shots` and `touches` exports already cover **1-30**. Ipswich 0-2 Liverpool — the
match Craig was looking at — had no sub notes, no numbers and no order at all. The
replacement costs no request: `matchFeed.ts` already fetches and caches this detail for the
team sheets.

**Three traps, each counted rather than guessed:**

- **Three goal types.** `G` + `O` + `P` = 85, which is exactly the goal count the sister
  repo's independent shot export gives for the same 30 fixtures. Reading only `G` drops
  nine; filing `O` under goals credits a man with an own goal.
- **A card can belong to nobody** — one booking in 118 carries a `teamId` and no
  `personId`, a bench or staff card.
- **A substitution pairs on the feed's ORDER, not on the minute.** 269/269 adjacent pairs
  are an `ON` followed by its own `OFF`. This is load-bearing: a side can make three changes
  in one minute, and pairing on the clock drew *"Flemming for Maeda"* when he came on for
  Emersonn — two true men and one false sentence. `plSubstitutions` owns this join because
  `plManMatches` is per-man and has already lost the order.

**Highlights are not available and this is settled.** No `highlights`/`video`/`media` key on
any endpoint; `content.pulselive.com` no longer resolves; the match page names
`checkout.plplus.premierleague.com` and `epl.tv3cloud.com`, which is DRM'd subscription OTT.
There is nothing to embed. Do not re-probe.

## The average touch position is already in the touch cloud (11 Sep 2026)

**Do not re-derive and do not wait for the export.** `docs/providers/intel-export.md` §3
asks the sister repo for `positions/26-27.json` and both it and `docs/ui/match.md` called the
average-position map blocked on it. It is not blocked and never was after 10 Sep:
`averageTouchPosition` in `packages/core/src/football/intel/touches.ts` is the whole of it.

**The measurement.** `data/staging/sofascore/avg_positions.parquet` in the sister repo
(99,818 rows, **925 of them 26-27 Premier League — 30 matches, 385 players**) is the *mean of
the same heat map* our touch cloud is built from. Checked man by man for SofaScore match
16363243: **identical `points_count` against our cloud length on 30/30 men**, and the means
agree to 0.44 — the half-unit the export's truncation to integers costs. Joined back through
`data/intel/touches/26-27.json` for FPL fixture 8, 8 of 8 cleanly-matched men agree; the two
that did not were collisions in the throwaway join-by-touch-count, not disagreements.

**Coverage is better than the table's, not worse.** The cloud has all **30 of 30** fixtures
and **438 of 440** starters (the two misses are men with no heat map file at all). The table
covers the same 30. So the export would buy nothing this season, and `points_count` and
`team_side` — its only two extra columns — are the cloud's own length and `PlTeamSheet`,
which is an exact eleven at 30/30.

**What the request is still for:** seasons we do not hold a cloud for. Nothing else.

**Both sides are in their OWN attacking frame.** Counted over fixtures 1-3: both keepers
average x≈9-13 and both centre-forwards x≈53-65. One man on one pitch draws as-is, which is
what `/players/analysis` does. **Two sides on one pitch means turning the away cloud round —
`{100 - x, 100 - y}`, both axes**, because turning a pitch about swaps the touchlines as well
as the goals. `touches.ts`'s docblock used to say the direction was "NOT normalised", which
reads as though the sides arrive in one shared frame and only need drawing; a map built on
that sentence puts the away keeper in the opposite goal.

**A side's average is the average of its TOUCHES, never of its men's averages** — a
substitute's two touches would otherwise weigh what a centre-half's 153 do. Which is why the
function takes points and not centres. Real answers, starters only, outfield ten: Man City
**53.3** against Bournemouth **40.4**; Liverpool **55.1** at Newcastle **40.3**; across all 20
logged fixtures the figure runs **40.3 to 55.4**, mean 47.7.

## The Premier League's own API — probed live 4 Sep 2026, do not re-derive

**The full endpoint surface is catalogued in `docs/providers/premier-league-api.md`** —
eighteen endpoints that answer, eight that 404, every metric vocabulary in full, and CM's
Match Stats board mapped row by row onto Opta's own names. What follows is the part that
is a decision rather than a field list.

`www.premierleague.com` is a shell over `footballapi.pulselive.com`. Public, and
re-tested with each header removed in turn: **no headers are required at all**. Two
response headers set the terms — `cache-control: max-age=30`, which is already
`PAGE_REVALIDATE`, and `access-control-allow-origin: https://www.premierleague.com`,
so it is a **server-side read only** and may never be reached from a client component.

It is the football layer's second provider (`football/premierleague/`). FPL says what a
player scored; this says what happened.

### The joins are ids neither provider chose, and both were counted

| | ours | theirs | evidence |
|---|---|---|---|
| Fixture | FPL `fixture.code` | `altIds.opta` less its `g` | identical |
| Player | FPL `opta_code` | a squad player's `altIds.opta` | `opta_code` non-null 652/652; a full match's lineup+bench joined **40 of 40** |

**`altIds=true` is not optional on the round read.** Without it, **0 of 10** fixtures
carry any `altIds`; with it, 10 of 10. The failure is an empty screen rather than an
error. The same parameter is required on `/football/players`.

### The reads, and what each is for

- `/fixtures?comps=1&compSeasons=…&gameweekNumbers=N&altIds=true` — one request for the
  round. Live clock (`clock.label`, a real one, where FPL has only `minutes`), `phase`,
  `halfTimeScore`, `ground`, `matchOfficials`, `attendance` — **and `goals`**: scorer,
  assister and minute for every goal in all ten matches. Counted across GW1–3, that array
  reconciles with the scoreline on **21 of 21** played fixtures.
- `/fixtures/{id}` — team sheets, formations (as lines of player ids), shirt numbers,
  captain. **The only complete source of the player-id map**: `/players` misses 20 of the
  360 players who appear in a round's events, 14 in a goal, card or substitution, one a
  scorer. All twenty are on a team sheet. `scripts/pl-bridge.ts` harvests from sheets and
  accumulates; re-checked against every player named in every goal and event of GW1–3,
  **0 unresolved of 360**.
- `/fixtures/{id}/textstream/EN?pageSize=300` — Opta's minute-stamped commentary. 99–107
  events for a full match. **`pageSize=100` truncates.** All 30 fixtures of GW1–3 answer
  200, an unstarted one with an empty `content`.
- `/stats/match/{id}` — **~170 Opta metrics per side**, 34 KB, present on **21 of 21**
  played fixtures.
- `/stats/team/{id}?comps=1&compSeasons=…&altIds=true` — one club's season, ~215 metrics summed over its
  league matches, with the same nought-omitted rule; Data › Teams reads it (30 Sep 2026).

### `time.secs` is per-fixture and not monotonic

Elapsed seconds from that fixture's own kick-off, so a 12:30 match and a 17:30 one both
start at nought — a round interleaved on it alone puts the afternoon out of order. Order
on `kickoff.millis + secs × 1000` (`MatchEvent.absolute`). It also runs **backwards**
across the interval: `end 1` carries 2910 and the second half's `start` carries 2700.
Every period-boundary type is outside `MatchEventKind`, so the events we keep are safely
ordered — a test pins that, because it is a consequence of the kind list and not a
property of the feed.

### The feed is append-only

A goal cancelled by VAR is published as the cancellation and **never also as a goal**, so
counting it never has to be un-printed. `penalty goal` is its own type — a goals feed
reading only `goal` loses every penalty. `end 14` means "match ends" and its minute label
is junk.

### `/stats/match` OMITS A METRIC THAT IS ZERO — and that inverts a binding rule

Counted across 40 team-sides of two completed rounds:

| | present |
|---|---|
| Shots · Off target · Fouls · Possession · Passes completed · Tackles won · Headers won | **40/40** |
| Corners | 39/40 |
| On target | 37/40 |
| Yellow cards | 36/40 |
| Offsides | 27/40 |
| **Red cards** | **1/40** |

There was exactly **one red card** in those rounds. The metric is absent because the
value is nought, not because it is unknown.

**So absence here means ZERO, which is the opposite of `docs/rules/DESIGN.md` §7's "Absence is `—`,
never `0`".** That rule is about a figure a provider could not give us; this is a
provider saying nought by saying nothing. A Match Stats board printing `—` for red cards
would be hedging a fact we have. **Any reader of this endpoint defaults a missing metric
to 0 and says so at the call site** — and that is the one place in the app where it is
correct to do so.

### What this makes shippable that `MatchTabs` records as blocked

`apps/companion/app/prem/match/[id]/MatchTabs.tsx` ships two tabs where CM runs four, on
the stated ground that *"the two missing ones are the two we have no data for"* — Match
Stats and Action Zones — because "FPL publishes no possession, no shots, no corners and
no zones anywhere". That is now false for the first of them: possession, shots, on
target, corners, fouls, offsides, tackles and headers are all on `/stats/match`, which is
**cm9900/22.jpg's board almost row for row**. Match Report is the textstream. Neither is
built yet; the docblock's condition — *"Stats and Zones arrive with their data"* — is met
for Stats and still unmet for Zones.

## Sunderland's red is 0.02 under AA, and `inkOn` cannot fix it (5 Sep 2026)

`sweep` reports one AA failure on `/prem/match/{id}` whenever Sunderland are on
it: `SUN` at **4.48:1 against a needed 4.5**, at 18px on the club's own plate.

*It had a second site for two hours on 21 Sep 2026 and no longer does.* The
lineup planner moved to `PitchMarker`, whose fixture band took the OPPONENT's
colour, so any squad holding a man whose club plays Sunderland reported the same
4.48 at 9px and 10px. Craig then asked for that band to be the desk's plain navy
("the fixture row should just be blue like this page"), which removed the club
colour from every pitch and the failure with it. Recorded because the pair is the
point: the ratio is a property of the club's own colour, so a site appears
wherever that colour carries text and disappears when it stops.

**It is not a bug in `inkOn`.** That function picks the BETTER of white and the
desk's near-black against the plate, and for this red white IS the better one —
4.48 is the best ratio the club's own colour allows. Nothing in the code is
choosing wrongly.

Which leaves two answers and neither is free:

- **Darken the plate** when neither ink clears the floor. That is a change to
  what a club's colour IS, on every screen that draws one, to buy 0.02 on one
  club — and `clubColours` exists so a side looks like itself.
- **Raise the type** to 24px bold, where the large-text floor is 3:1 and this
  clears comfortably. That is a density decision about the match header, which
  DESIGN §6's table owns.

Recorded rather than taken, because the right one is Craig's. Until then `sweep`
has one standing failure on the fixtures Sunderland appear in, and a run that
reports exactly this and nothing else is a clean run.

## Workstream B surveyed against the tree (5 Sep 2026)

Eight read-only agents mapped the edition pipeline before any of Workstream B was
built. **The plan is wrong in about twenty-five specific places**, and most of
them are the kind that only shows up when you try to write the line. Recorded
here rather than in the plan file, because the plan is a dated document and this
is what the tree says.

*28 Sep 2026: `roundFootball`, `withFootball`, `RoundFacts` and `briefs/matchReport.ts` were deleted
with the retired match-report path; the lines below that name them are history.*

### The three that change what a change IS

- **B1's guard cannot go where the plan puts it.** `write-edition.ts` never names
  `roundFootball`; the fetch is at `facts.ts:124`, inside `gatherRoundFacts`, and
  `RoundFacts.football` was a required field read at `assemble.ts:166`. The
  premise held — the fetch was 33 lines before the quiet exit — so the fix was to
  split the TYPE (`DeskFacts` / `RoundFacts`) and add `withFootball` at the one
  place a brief is built. **Done.**
- **`dispatch.file` cannot add a second subject.** `subjects` is hard-wired to one
  value at `newsroom.ts:126` and `:175`, and `ColumnMeta.subject` is a `string`.
  Worse, `Assignment` (`newsdesk.ts:26-35`) carries `fixtureId` — FPL's per-season
  id — and not the club-code `stake.key` the `fixture:gw{gw}:{key}` subject needs;
  that key exists only as a suffix of `assignment.key` and is computed at
  `relevance.ts:81`. B5's supersession is a three-file change, not a table.
- **A new story kind has five tables to join and only one of them fails loudly.**
  `KIND_WEIGHT` (`frontPage.ts:35`) is the only total `Record<StoryKind, …>` in
  the tree and will not compile without a row. `STORY_KINDS` (`story.ts:36-40`) is
  a plain array, so omitting the kind there makes `normalizeStory` refuse every
  story of it **with a green typecheck and a green build** — which is exactly the
  failure B7 has just swept up. `KICKER`, `STORY_BYLINE` and `faceOf` all take
  an unhandled kind silently.

### Counts the plan quotes that have moved or were never right

- `plFixtureByCode` **does not exist**, under that or any name. The two things the
  plan conflates point in opposite directions: `commentary.ts:148` `theirFixtureId`
  takes an FPL code and returns the PROVIDER's id; `football.ts:64` builds a map
  over OUR fixtures. `optaToCode` IS duplicated — `football.ts:66-68` inline vs
  `commentary.ts:47-53` as a function — and the two have drifted textually.
- `commentary.ts:41-58` is the wrong range and not a duplicate of core's
  `plPlayerCodes`: it builds the map from the checked-in bridge, round-wide, with
  no detail request; `plPlayerCodes` harvests it from ONE fixture's `teamLists`,
  which the round read does not carry.
- **`plMatchFacts` needs the detail read for `referee` only.** On the round read:
  `ground` 10/10, `attendance` 9/10, `matchOfficials` **0/10**. Both reads answer
  with `RawPlFixture`, so a round-only call gives three of the four fields at zero
  extra requests — which the signature or the docblock should say.
- **The team sheet is not as coarse as D1 assumes.** Beside `matchPosition`'s
  single letter, each squad player carries an `info` block — absent from
  `RawPlSquadPlayer` — with `info.positionInfo` on 40/40 giving "Left Winger",
  "Centre Defensive Midfielder" and thirteen more, plus `info.position`, which
  disagrees with `matchPosition` on 5 of 40. The letter is where he played today;
  the string is where he is registered. **D1's verdict on intel `position` should
  be re-argued against `positionInfo`, not against the letter.**
- `banned.ts` does **not** ban every ground. Five of the twenty have no entry at
  all (Vitality, Coventry Building Society, MKM, The City Ground, Tottenham
  Hotspur Stadium) and four more only by nickname — and the whole-word regex at
  `banned.ts:66` will not find "the Emirates" inside "Emirates Stadium". No city
  is banned either, although `house.ts:39` forbids them.
- `house.ts:40` — *"A MINUTES FIGURE IS NOT A SUBSTITUTION"* — is the rule that
  blocks B2's per-man `on 61'/off 78'` line, and B3 does not name it. `HEADLINE`
  at `house.ts:63` restates the ban a fourth time.
- `TIE_REPORT`'s rule is two sentences (`matches.ts:65`), not the tail fragment B3
  quotes; removing the tail leaves a prompt still forbidding the minutes.
- There are **three** stale intel references, not two:
  `briefs/matchReport.test.ts:109` carries the same clause and asserts the brief
  still says "never account for it" — so that test contradicts B3 and moves with it.
- `manFootball` can be called by **two** of its three briefs as written:
  `TieReportSide.scorers` is `{name, position, points}` with no code
  (`tieReport.ts:26`), and `sideOf` does not emit one. And `eleven`/`dodgers` are
  not football-less — they already print goals, assists, clean sheets, saves and
  minutes through `did(pick)` (`briefs/columns.ts:157-164`). What they lack is the
  minute-stamp and the on/off.
- `stateOf` has three callers and only one is tie-shaped, so B2's `ties.ts` split
  leaves the fixture-shaped file importing from it.
- **`prepare` is in `dispatch.ts:61`, not `assemble.ts`**, returns
  `{system, brief} | null` from TWO return sites both of which B3's lifts must
  cover, and has no test file at all. B3's test is a new `dispatch.test.ts`.
- **B6's line would not compile**: `wireLines` takes five arguments
  (`events, breaks, snapshot, owners, mine`) as of 5 Sep, and `Wire.lines` is
  `WireRow[]` — a union — so a stop press must branch on `isBreak` or filter, and
  then answer whether the paper prints FULL TIME.
- `plRound`'s literal keyParts is `["pl-round"]`; the gameweek is the cached
  function's argument. And `warm.yml` curls `/matchday` every 5 minutes against a
  30-second revalidate, so the front page shares one entry per 30s window across
  both pages — not "zero upstream requests".
- The archive 404 does not arrive at GW5. `paper.json` holds 16, the cap is 24,
  `GAZETTA_STORY_CAP` is 10 and six GW3 assignments are already queued, so the
  first successful firing writes `gw2-wire` and `gw2-dodgers` out — potentially
  the week of 7 Sep.
- `editions.yml` had failed **75** runs in a row as of 17:07Z on 5 Sep, not 69.
  The count moves about 27 a day, so quote the date with it or drop the number.
- Setting `OPENAI_API_KEY` does not give every story a picture: `write-edition.ts:245`
  draws only when the merged paper's LEAD is one of this firing's filings — at most
  one image per firing, and none when an older story leads.
- The per-firing PL cost is `1 + 3 × (fixtures not "U")`, so 31 is the steady state
  and not the constant: 25 during a Saturday, 1 before a round's first kickoff.
  `politeFetch` retries twice more on a retryable status, so 31 is a floor, and
  `football.ts:74`'s loop is serial, so the wall clock is the sum.

### The order the tree agrees with

B7 → B1 are done. `map.ts`'s split now has a second in-folder dependent
(`breaks.ts`, which imports `plFixtureCode` — that stays in `map.ts`, so the split
is unaffected). `PlTeamSheet` and the private `squadMan` must move with
`plTeamSheets`, and `index.ts:43-52` is the barrel edit.

## Open — amber outside the standings tables (counted 5 Sep 2026)

DESIGN §3's amber slot was narrowed to "never a column of a standings table" and
`/league` and `/prem` were corrected. `register-warden` counted six further
surfaces that set SEVERAL amber measures on one line — the shape the narrowing
condemns — and they are boards of measures rather than standings tables, so
whether the slot should reach them is a separate question and Craig's:

| File | What is amber |
|---|---|
| `prem/club/[code]/SquadTable.tsx:169,172` | goals and assists, with minutes and starts ink on the same line |
| `prem/club/[code]/stats/PlayerBoard.tsx:176` | every measure column |
| `players/[fantraxId]/MatchLog.tsx:124,184` | the FPts column, on a row of sixteen figures |
| `players/[fantraxId]/AttributeGrid.tsx:98` | thirty ratings; its docblock quotes the RETIRED wording |
| `components/league/SeasonGrid.tsx:47` | the same, and quotes it too |

Three more put amber on something that is not a figure under either wording —
position letters at `components/league/SquadRows.tsx:228` and
`squad/[teamId]/transfers/Ledger.tsx:188` — and three put it on a
PARAGRAPH of prose (`components/league/PlayerCard.tsx:92`,
`components/league/LivePlayerCard.tsx:109,193`), where the unresolved-slot reason
reads as a doubt and `--color-bad` is the slot for that.

Two stale sentences found in the same count, both harmless to the pixel:
`league/team-stats/page.tsx:217` says `--color-mid` "is the right slot" for a
column it correctly draws in ink; and DESIGN §3 and `league/page.tsx:133` both
give the cut line's red a reason citing the YOURS chip, which went on 5 Sep — the
count still holds (the border and the accent NAME), the citation does not.

**Also open, and older**: the playoff cut line is `border-accent/80` on both
`/league` and `/prem`, DESIGN §3 says it should be red, and `docs/ui/prem.md:60`
records the yellow as settled. Both cannot be true, and the narrowed amber
paragraph ends "only yours takes the accent", which sharpens it.

## Settled — one row style across tables, fixture lists and squad lists (7 Sep 2026)

Craig, with a crop of a Championship Manager squad list: *"the league placing
(now this is site wide)… theres a VERY small gap between rows i think (Can you
even see it). Font is bolder and stands out more, and has a slight shadow. this
is the same for league tables/fixture pages/squad lists etc. We need to have this
style throughout the app, so it means creating a shared universal code rather
than hardcoding a different style to each page"*, and then *"the blue has a
gradient down the page"*.

**The reference was measured rather than judged**, down a column of index blocks
in `cm0102/07.jpg` at x 128 and `cm9900/25.jpg` at x 118:

| | CM 99/00 | CM 01/02 | Ours, before | Ours, after |
|---|---|---|---|---|
| block | 2px light edge, flat body, 2px dark | 141 → 125 → 73 in blue, top to bottom | flat `rgb(31 60 156)`, whole row | a slice of one page-tall ramp |
| down the column | — | light at the head, dark at the foot | no change at all | `rgb(53 84 169)` at 1st → `rgb(22 46 124)` at 10th |
| gap between blocks | 1px | 0 — the gradient's dark end IS the gap | 1px in `--color-bg` | unchanged, and now legible |
| row rule | none | none | **two values**: `--color-bg` on a table, `--color-line` on a list | `--color-bg` on both |

Three edits, none of them at a call site:

1. **The blue is ONE gradient down the page**, not one per chip. The first
   attempt ramped each block separately and Craig rejected it the same hour:
   *"the gradient is going down the whole list, not a gradient for each
   individual piece."* He is right and the distinction matters — a per-block ramp
   gives every chip the same light top and the same dark base, so a column is one
   shape repeated, where CM's is one shape cut into slices and where a chip sits
   on the ramp is itself information.

   **`background-attachment: fixed` is the mechanism**, and it is the only way in
   CSS for many separate elements to share one gradient without each learning its
   own row number — it moves the background positioning area from the element to
   the viewport. Zero call sites, which was the requirement.

   Three consequences. The gradient is anchored to the SCREEN and not to the
   list, so a chip changes shade as the page scrolls under it. **The 1px row rule
   is now the only thing separating two chips** — CM's own answer, and the "VERY
   small gap" the question was about. And the ink has to clear its floor against
   every point on the ramp rather than one flat face: measured down `/league` at
   390, the ten chips run `rgb(53 84 169)` at 1st to `rgb(22 46 124)` at 10th and
   `--color-ink` on them is **6.4:1 to 11.2:1**, with `sweep.mjs` clean at both
   widths.

   `background-color` stays declared and the gradient is `background-image`,
   because the `background` shorthand would reset the colour to `transparent` and
   both `sweep.mjs` and `groundfit.mjs` walk `background-color` up the ancestor
   chain — a block that paints solid blue and reports transparent would take
   every index cell in the app out of both instruments at once. It is also the
   fallback wherever `fixed` is refused.

   **Unwitnessed on hardware**: `background-attachment: fixed` is the classic iOS
   Safari jank case. It is cheap here (a 32px chip, not a full-bleed hero), but
   the standing "look at the desk on a real phone" work item now has a second
   thing to look at.
2. **`.cm-index` owns its text**, the way `.cm-bevel` owns its ink: size, weight
   800 and CM's shadow, on the class, so all twenty blue blocks take it without a
   call site knowing. They had been writing that text **four sizes and three
   weights** between them — `text-3xs`, `text-2xs`, `text-sm`, one stepping
   `3xs`→`2xs`, seventeen `font-bold`, one with no weight and one at
   `opacity-60`. All twenty now set layout and nothing else.

   **The size took two goes.** It was left at the call sites first, behind a
   `PLACING` recipe used at the four ordinal sites, on the argument that a chip
   holding a date is not a placing and blanket-sizing it is how a `w-16` box
   starts wrapping. Craig overruled it the same hour: *"i think we can have the
   same for now and il find the correct exceptions (such as ones that hold a date
   for example)."* He is right about which way the default falls — **one size
   everywhere makes an exception an ADDITION**, a `text-3xs` written after the
   class that a reader can grep and a screen can be checked against, where twenty
   disagreeing sites cannot be told from twenty decisions. The wrapping risk is
   real, and it is now a list somebody can read off a screen. **Found so far,
   7 Sep 2026:**

   | Site | What the chip holds | What happened |
   |---|---|---|
   | `news/page.tsx:151` | `Sat 12 Sept 14:45` in a `w-16` box | wraps to **three lines**, taking the row to ~110px. The clearest exception in the app and the first to want a `text-3xs` back. |
   | `squad/[teamId]/transfers/Ledger.tsx:88` | a short date, `w-24 truncate` | **unverified** — the dummy league's team has made no moves, so the ledger draws its empty state. Check on the real league. |
   | `players/[fantraxId]/Inbox.tsx:102` | a date, `w-24` | no overflow measured. |
   | `league/schedule/Season.tsx:57` | `GW11` plus a deadline | fits at both widths, read back off `/squad/[teamId]/fixtures`. |

   The rest — placings, scores, shirt numbers, `GW{n}` — measured clean at 390
   and 1440 by walking every `.cm-index` on nineteen routes for `scrollWidth >
   clientWidth`. **That check has a hole and the news chip is it**: a box with no
   fixed height does not overflow, it GROWS, so the instrument reported nothing
   while the row tripled. Overflow is the wrong question for a chip free to get
   taller; row height is the right one, and the screenshot is what caught it.

   800 is a weight `layout.tsx` did not load and now does, for this alone. It is
   the only thing on the desk heavier than 700, and the reference is the reason:
   `cm9900/24.jpg` sets the placing heavier than the club name beside it, which
   is the opposite of the ratio inside a row.

   **This was aimed at the wrong thing for an hour**, and the mistake is worth
   recording because the message was not ambiguous. Craig wrote "the league
   placing… Font is bolder and stands out more, and has a slight shadow", and
   this session read "placing" as the row and put the shadow, an 800 weight and a
   size step on `ROW_NAME`. His correction: *"i mean the text in the blue box,
   you did the row itself, undo and change blue box text"*. `ROW_NAME` is back to
   `font-chrome text-sm font-bold lg:text-base`, unchanged from where 5 Sep left
   it. **The noun in a UI complaint is usually the object**: "placing" is the
   ordinal, not the line it sits on.
3. **`.cm-rows` rules its rows in `--color-bg`**, which is `ROW_RULE`'s colour.
   `desk.ts` had carried this disagreement as "phase 2's to settle" since
   `ROW_RULE` was named, and a universal row style is what makes it one edit.

**And three sites were still outside `ROW_NAME`**, which is the "hardcoding a
different style to each page" half of the same message: `components/league/SquadRows`
at `text-sm font-medium` (the squad list Craig named), `squad/page` at a bare
`font-semibold`, and `components/football/MatchList` at `text-sm font-semibold` —
all three in the UI face rather than the chrome one. `desk.ts`'s `ROW_NAME`
docblock records the September count that folded seven other spellings in; these
are the three it missed.

**And three sites were still outside `ROW_NAME`**, which is the "hardcoding a
different style to each page" half of the same message: `components/league/SquadRows`
at `text-sm font-medium` (the squad list Craig named), `squad/page` at a bare
`font-semibold`, and `components/football/MatchList` at `text-sm font-semibold` —
all three in the UI face rather than the chrome one. `desk.ts`'s `ROW_NAME`
docblock records the September count that folded seven other spellings in; these
are the three it missed. That part stands: it is what makes a squad row and a
table row the same object, and it is independent of the placing.

**Left inert rather than swept**: the seventeen `font-bold` and the sizes on
non-placing `.cm-index` sites are now no-ops against the unlayered class. They go
as each file is next touched, rather than in a twenty-file diff that would bury
the three edits above.

## Settled — the round head is one component (7 Sep 2026)

Craig: *"this doesnt actually show what gameweek it is"* (`/league/schedule`).

Three copies of one strip, counted the same day. `prem/Rounds` and
`league/results` wrote `cm-bevel flex h-7 items-center px-1.5 font-chrome
text-2xs font-bold uppercase text-ink` byte for byte and both said
`Gameweek {n}`; `league/schedule/RoundHeader` wrote a fourth spelling that said
DEADLINE and a date and never named the round at all. So the bug and the
duplication were one thing: the number that went missing is the number the other
two copies had.

`components/shell/RoundHead` now owns it, and the gameweek is the component's own
rather than a caller's string — the one thing all three heads must say is the one
thing a caller cannot get wrong. The schedule's date came down to
`londonDayAndDate` in the same change, because "Saturday 12 September" spelled
out took 60% of a 390px plate on its own.

**Two dead utilities went with it.** `.cm-bevel` sets both `color:
var(--color-bg)` and `font-family: var(--font-chrome)` unlayered, which beats a
`@layer utilities` declaration whatever the class order — so `text-ink` and
`font-chrome` on a bevelled plate have never done anything. The ink one is worth
recording: `--color-ink` on that plate is 2.27:1, so what two shipped sites asked
for was a contrast failure and what saved them was the cascade. Anything wearing
`.cm-bevel` should carry neither.

## Settled — the three dense grids joined the row style (10 Sep 2026)

Craig, on `/squad/[teamId]/stats`: *"this page, using the non standard font
agreed in other similar tables, refactor"*.

**Why three earlier sweeps walked past them.** `ROW_NAME` had already collected
fifteen sites over 5–7 Sep and its docblock lists the four deliberate
exclusions, so the assumption was that the remainder were exclusions too. They
were not: the three misses are the dense stat GRIDS, and what they have in
common is that **none of them writes a name into a `<span>` of its own** —

| | how the name was set |
|---|---|
| `squad/[teamId]/stats/StatBoard` | nothing on the name at all; it inherited `text-2xs` from the `<td>` |
| `components/league/SeasonGrid` | `text-2xs` on the `<td>` |
| `prem/club/[code]/stats/PlayerBoard` | `text-sm font-bold` — the size and the weight, in the UI face |

A grep for a name's own class string finds none of the three. The lesson is the
counting method rather than the miss: a class on a `<td>` that its child inherits
is invisible to every search written for the child.

**The row height does not move, and the reason is in the stylesheet rather than
in the measurement.** `desk.css` sets `.cm-index` to `--text-sm`, and to
`--text-base` above 64rem (the `@layer components` block under the size
argument) — which is **exactly the pair `ROW_NAME` grows the name to**. So the
index block in the same row was already the taller of the two by construction,
and the name growing to match it cannot move the row. The worry it answers was
`SeasonGrid`, which carries **no `.cm-row` anywhere in the file**: its `<tr>` has
only `ROW_RULE`, so nothing else caps it.

Confirmed against the box as well, by building its exact `<tr>` in the live page:

| | 390px | 1440px |
|---|---|---|
| before — `text-2xs` | 11px/14px, row **26.5px** | 12px/15px, row **30.5px** |
| after — `ROW_NAME` | 14px/18px, row **26.5px** | 16px/22px, row **30.5px** |

**The standing fact is conditional, and must be quoted with its condition: a grid
may take `ROW_NAME` with no `.cm-row` floor *while `.cm-index` is set to the same
step*.** Those are two independent declarations in two files that have agreed
only since 7 Sep, and nothing holds them together — `desk.ts` names one and
`desk.css` the other. Give `ROW_NAME` a further step without giving `.cm-index`
the same one and the floor is gone, with `SeasonGrid` the row that has nothing
else propping it up. Do not re-derive this, and do not add a `.cm-row` to
`SeasonGrid` on the strength of it today.

`PlayerBoard`'s long names widen its name column on the desk — 555px → 588px at
1440 — and the table still overflows its panel by **0px**, so the `lg:` step is
paid for out of slack the column already had. At 390 the column does not move
(243px → 242px), because `ROW_NAME` is `text-sm` there and that is what it was.

**`SeasonGrid` is not shootable against the dummy league `config.ts` defaults
to** — which is not the same as unshootable, and the stronger phrasing was in
this section for an hour before being corrected. It looks like a broken route
either way, so the two gates are worth naming:

- `page.tsx:157` — `display.show === "squad" ? await squadSeason(teamId) : null`.
  A **rival's** page never renders it whatever the data says, because the panel
  is tied to the branch that labels a figure a season total.
- `page.tsx:258` — `season !== null`. `squadSeason` returns null only when
  `readTeamStats` does, which is a property of **the league you point at**, not
  of the tree.

So the route to an image is the documented one: `FANTRAX_LEAGUE_ID=ayyoh3n2mr326v2o`,
and CLAUDE.md's own standing line — *"Running against the real league now is how
the empty states get tested"*. Probing 31 Aug against the rehearsal league is
where that component's column counts came from, and the same pointing is needed
to see it. **`SeasonGrid` is therefore the one file in this change whose
`ROW_NAME` edit has no image behind it, and also the one with no `.cm-row`** —
five minutes with a real-league cookie closes that, rather than a standing
exception. Its verification here is a measurement plus the stylesheet, which is
sound but is not a screenshot.

**The refactor Craig asked for in the same sentence: the board's columns are one
list.** `StatBoard` branched on `view === "underlying"` in three separate places
— the head strip, the cell row and the glossary — and appended the fantasy total
as a fourth special case inside each of them. One column's existence was
therefore stated six times, and its arithmetic a seventh, in a sort comparator
that searched `UNDERLYING`, then `PLAYER_CATEGORIES`, then special-cased `"pts"`.
Six of the seven were free to disagree with the one that mattered.

`statViews.ts` now owns a `Measure` — head, label, and **the function that reads
it off a row** — and `measuresFor(view)` returns the columns on screen. The head
strip, the cells and the glossary walk that one list, so a view cannot put a
column in the table and leave it out of the key. The file was the right home
already: it is the pure, JSX-free half of this screen, split off when the
component crossed the 300-line ceiling.

Two things about it are decisions rather than mechanics:

- **`readingOf` resolves a key against every view, not the visible one.** Sorting
  outlives its column — order the squad by goals, switch to the defensive group,
  and the order stands, which is what the old comparator did by accident of
  reaching straight into `PLAYER_CATEGORIES`. A comparator that could only see
  what is on screen would drop silently back to roster order on the switch, and
  that would have been a behaviour change smuggled into a refactor.
- **The total is a `Measure` with a `loud` flag, not an epilogue.** It is what
  the board adds up to, so it wears the accent where the others take the tone
  ladder; making it a column is what removed the three special cases.

Verified by reading the rendered table in all five views: heads, glossary keys
and row cells agree in each, `xG` still prints to two places and a null still
prints an em dash against a played nought. `StatBoard` went 292 → 254 lines.

## Settled — the pool board marks standouts, and the rule is a threshold (10 Sep 2026)

Craig put Opta's season-stats grid beside `/players` — *"it organises the data
much better than us, but we still keep our standard CM style"* — and the board
took three of its ideas plus a fourth that is ours.

**The shading is a THRESHOLD, not a ramp, and that was Craig's call.** Opta shades
every numeric cell on a continuous brown-to-purple scale. DESIGN §3 cannot have
one: a hue sliding through a range is a colour saying twenty things where every
other colour in that table says one. Asked, Craig ruled *"magnitude ramp, but
maybe just highlight the really good values? we also can use better colours for
us too"*, which is a better rule than the one it replaces — a cell is lit or it is
not, so there is no second strength to misread. Two new slots, `--color-hot` and
`--color-cold`, both grounds; DESIGN §3 carries the derivation and the ratios.

**They are the direction pair filled, and they shipped brown first.** The first
cut took the reference's own hue and Craig threw it out on sight — *"can we use
more fun CM colours than brown though?"*. Brown is nobody's slot in `tokens.css`,
and the answer was already in the table: `--color-up` and `--color-bad` at a
ground lightness. No new hue, and nobody has ever misread green.

**What earns a mark, and the wrong turn on the way to it.** The first cut took the
top DECILE by rank — the tenth-best figure and everything at or above it. That is
right for a continuous measure and wrong for almost every column here, because
these are small integers: goals after three rounds run 0–3, so the tenth-best
figure is a 2 and every 2 lights, which is a third of the column. Bolting a
ceiling onto the decile then over-corrected and put `G` and `CS` dark — the two
columns the marks were most useful on. Both faults were visible on screen and
neither was visible in the tests, which is why this is recorded.

The rule that shipped is stated the way a reader would state it: **light the
highest figures, taking whole values at a time, for as long as that stays inside a
sixth of the men who have a figure at all.** Consequences worth knowing before
anyone "fixes" them:

- A column whose top value is common lights **nothing**. `GP` three rounds in is 3
  for everyone; `Min` in August has thirty men in a hundred on 270; `YC` is a
  column of ones. All three are dark, and that is the true answer.
- `Min` will begin to light later in the season as the ever-presents thin out.
  Playing every minute is remarkable in April and ordinary in August.
- Noughts are dropped before the population is sized. `G` reads nought for 490 of
  652, and counting them would make the top sixth "anyone who has scored twice" —
  a statement about squad size, not football.
- **Whole values or none.** Ten of the thirty men tied on 270 cannot be lit and
  the other twenty left dark; there is no difference between them a reader can
  see.
- The population is **the rows actually drawn**, not all six hundred matching
  ones. Over the full set the top sixth is a hundred men and the first page would
  be solid. So a mark means "the top of this column, among what is in front of
  you", and it re-reads on every filter.

**The board is opaque, and it is the only table in the app that is.** Craig:
*"also it needs to be opaque too"*. `.cm-panel` is deliberately 88% and its
docblock defends it well for a ten-row table in `text-base`; it does not hold for
twenty-four columns of `text-2xs` over a photograph containing a white crowd and a
red hoarding. The tell was already on screen — the frozen name column has carried
an opaque fill since it was frozen, so the board rendered with one solid column
and twenty-three translucent ones.

**Three other things came from the reference**, all of them URL state so the board
stays a server component and a filtered view stays shareable: stat-group plates
(`All` first and still the default, so nothing Craig asked for on 6 Sep left the
board), a per-90 toggle, and a minutes floor as chips rather than Opta's slider.

*The minutes floor lasted a morning* — *"per 90 is just a toggle, remove the
minutes thing"*. It was two chips, a derivation, a narrowing and a filter clause
to answer "hide men who barely play", which a reader answers by looking at the
`Min` column. Worth keeping from it: it shipped hardcoded as `[0, 90, 450]` and
the `450+` chip emptied the board to "0 of 672", because a constant that encodes
how far through a season we are fails silently and only for part of the year. The
guard that mattered survives as arithmetic rather than a control — `per90`
refuses anybody under one match, which is what stops four minutes and a goal
reading as 22.5 per 90.

**Two traps found while wiring it, both recorded in code:**

- The per-90 toggle changes what a column PRINTS, so it has to change what the
  table SORTS by. `figureOf` is now the single answer for "what does this column
  show for this man", read by the cell, the comparator and the mark arithmetic.
  Three readers working it out separately is a table sorted by a number nobody
  can see.
- A stat-group plate could hide the column the board is ordered by, which is
  `desk.ts`'s `standDown` rule arriving in a second place: a hidden column is
  DELETED, taking the pressed plate, the arrow and `aria-sort` with it.
  `columnsIn` therefore always keeps the sorted column, whatever plate is on.

**"Messy" meant something more specific than clutter, and the diagnosis is worth
keeping.** Craig: *"when i said messy, i meant essentially three rows of column
headers"*. The board had a blue stat-group strip, a grey field of eleven filter
chips, and then the table's own grey head strip — and the middle two wear THE
SAME BEVEL. `cm-bevel` means "something you press", which a chip and a column
head both are, so three consecutive full-width rows of small bold capitals read
as three header rows stacked and a reader cannot tell which belongs to the table.
It was never the number of controls; it was that a control and a column head are
the same object in this vocabulary. Worth remembering before adding a fourth
bevelled row anywhere on the desk.

**The fix went behind one `Filter` plate and then came half back out**, on
Craig's second look at Opta's DESKTOP shot: *"i think we can get most things onto
one row though"*. He is right — their grid runs search, stat-group tabs, `PER 90`
and `MIN MINUTES` across one line and keeps only the position and team pickers in
the drawer. Hiding everything cured the stacking and threw the desk's width away
with it, and made the most frequent action — changing the stat group — two taps.

So the row holds what a reader changes often and the drawer holds the tail, and
**what is on the row grows with the width in two steps, both measured**. Read off
the rendered page at five widths on 10 Sep 2026 (`row` is the control row's inner
width, and the frame is max-width capped so 1440 is barely wider than 1280):

```
1024   row  842   form 176 + plates 579 + filter 75 = 830   fits
1280   row 1098   …plus the figure chips, 1136            over
1440   row 1100   the same                                over
1536   row 1354   1152                                    fits
1800   row 1484
```

`lg` therefore takes the stat groups and **`2xl` adds the figure chips**. `xl`
was the first guess and it is wrong by 36px — and it failed SILENTLY, which is
the part worth recording: the plate strip is `flex-1`, so rather than overflowing
it quietly took 525 of the 579 it needs and wrapped `Market` onto a line of its
own. A row that fits because one of its children folded is not a row that fits,
and only a screenshot showed it. The row is now one line at every width from 390
to 1800, verified by comparing the row's height against its tallest child rather
than by counting distinct `top` values — with `items-center`, children on the
same line have different tops, and the first probe reported three lines where
there was one.

The plate carries a count of what is on, so a shut drawer cannot hide a filtered
board — and the count is per width, totalling only what the drawer still holds at
that step, because counting controls a reader can already see wearing their own
pressed bevels is the screen saying it twice. The caption above names the stat
group, so a closed drawer cannot hide which columns are on either. Inside, three
labelled bands — Columns, Figures, Who — which the flat field never had; eleven
chips were doing three unrelated jobs with nothing saying so.

**One regression caught by an instrument rather than by eye:** making the strip a
component left its `<nav aria-label="Stat groups">` behind in the layout file, so
for one build it was six bare links with no landmark and no label — and "All" and
"Scoring" say nothing out of context. The probe looked for the element and got
null. The `<nav>` lives inside the component now, so a future move cannot strand
it again.

**The drawer opens through the URL (`?panel=1`) and not through React state.**
Every other control on this page is a link, which is what lets a filtered board
be shared and read with no JavaScript; a `useState` drawer would make the one
control that reveals all the others the only one needing a script. It also means
"the board with the filters open on Defensive" is a link you can send somebody.

**One control size for the whole row** — *"all buttons different sizes, we can CM
this now"*. Five kinds of control at four heights and three type sizes. `desk.css`
already puts the chrome face on every plate class; the geometry is layout and
belongs to the caller, so `players/BoardControls` exports `PLATE` and the row now
differs only in colour. Two stated exceptions: the search field keeps
`text-base`, because an iPhone zooms the page on focus below 16px; and the club
`<select>` is the app's one dropdown (`shell/QuerySelect`, `SELECT`) since 2 Oct 2026, when
`PLATE_TYPE` went with its last caller.

**The club filter is the one thing the removed columns actually cost.** Position
and status have had filters since 6 Sep — they predate this work, so dropping
those columns traded nothing. Club had none, and it is a `<select>` rather than
chips: twenty clubs is a wall, and it is single-value where the others are unions
because nobody asks for "Arsenal or Chelsea". The list is read off the POOL, not
the football layer's twenty, so no option can empty the board.

**Three smaller calls the same day, all Craig's:** the `Rk` column is gone
outright rather than merely standing down on a phone; the `Opp` cell is trimmed
to the fixture (`MCI`, `@CHE`) with `fixtureOnly`, which also retires the `(ET)`
in its heading — a zone note over a column with no clock in it is furniture
explaining something that is no longer there — and, the time gone, the column is
narrow enough to come back to the phone.

**1 Oct 2026: status joined the row and `Find` left it.** Craig: *"on desktop have ww/fa filter in view"*,
*"mobile can have owned button show by default, find a player bar super wide, theres space"*. The status chips
(`Owned`, `WW`, `FA`) sit on the row under a thumb and from `xl`; between `lg` and `xl` the sheet carries them.
`Find` went at every width (the box searches as you type, and Enter submits it without a script), the box is
`w-36` from `lg`, and under a thumb it grows from a 104px basis, below which the chips and Filter take a second
line together. Re-measured in Chrome and WebKit, with the rehearsal league's two statuses and with a third (`FA`)
cloned into the page for the real league after its draft:

```
        two chips                         three, one pressed
320     search, then chips on line 2      the same
360     one line, search 137              two lines
390     one line, search 167              one line, search 110
1024    one line: 144 + plates 614 + Filter 72 (status in the sheet); Attributes had folded since it arrived
1440    one line: plates 675 of 592       one line: plates 612 of 592
```

## The pitch had no ceiling, and that is what "too big on mobile" was (11 Sep 2026)

Craig, with the head-to-head open on a wide phone: *"too big on mobile still /
scores too hard to read."*

**`.pitch` had an `aspect-ratio` and no `max-height`**, and `--pitch-ratio` is
0.62 from 0 all the way to `lg`. So the pitch's height was `width / 0.62` with no
bound, and every width between a phone and a desk drew a taller one. Measured on
the head-to-head in an 844px viewport:

| width | pitch height | card | figure |
|---|---|---|---|
| 390 | 629px | 68px | 53px |
| 430 | 694px | 76px | 53px |
| 496 | **800px** | 90px | 53px |
| 768 | **1,239px** | 110px | 53px |

**The cards did not grow with it — the figure is 53px at all four.** `.pitch-figure`
caps a card by the room a ROW has, so all the extra height went into the GAPS
between the lines. That is what "too big" looked like on screen: not big cards,
but four rows flung to the corners of a pitch two-thirds taller than the screen,
with the forwards below the fold. The 0.62 comment had always said it was
measured against a 361px column, and it is right there; what it never had was a
bound for every width after it.

`.pitch` now carries `max-height: calc(100svh - var(--pitch-page))` — the same
budget `.pitch-figure` already divides up, so the two cannot disagree. Every
width above now lands on **420px** (the with-bench budget). Past the cap the
pitch draws squatter and nothing inside distorts, because the ground is a viewBox
that stretches.

### `--pitch-frame`, and the 13px the ceiling exposed

Capping the height uncovered a second bug that had been hiding in the slack:
`PitchFrame`'s trapezoid spends 40px INSIDE the pitch that `CmGround`'s diagram
does not — `--pitch-boards` (1.75rem) above for the hoardings and goal, `pb-3`
below — and the row budget knew nothing about it. The lineup planner asked for
433px of rows inside a 420px pitch and clipped the forwards' fixture band by 13.

`--pitch-frame` is 0 by default and 2.5rem on `.pitch-framed`, subtracted from
the ROW budget rather than from the pitch's height, because that is where it is
spent: the box does not grow, the cards shrink. Before the ceiling the pitch
simply got taller and the overflow had somewhere to go.

### The score was set at the floor

The band carries two different kinds of thing and was setting both at
`text-3xs` — **9px**, which DESIGN §8 records as the FLOOR on a pitch rather than
a size to reach for. A fixture is three letters and reads fine there; a score is
the figure a manager opened the screen for and was the smallest thing on the
card. It takes `text-xs` now when it is showing points.

`PitchPlayer` had already learned this and says so in its own docblock — "two
clamps bottoming at 7px and 9px, which made the number a manager came for the
smallest thing on a live pitch" — and sits at `text-xs`. This is the same lesson
arriving at the second card, a week after `ROW_FIGURE` went through it in tables.

**`KEPT` is 0.62 now**, down from 0.70 and 0.80 (*"the shirt does not need to be
that long, we can cut it a lottle"*), which draws the kit slightly wider than
tall. ~0.55 is the real floor: below it the crop starts eating the sponsor.

## The repo-wide refactor, and the counts it settled (11 Sep 2026)

Counts worth keeping, because each one closes a question that otherwise gets
answered from taste next time.

**`STICKY_LEAD` reached three and moved**, exactly as `e15c8ab` predicted when it
declined at two. It had been DECLARED twice — byte-identical strings in
`players/Cell` and `prem/match/[id]/PlayerStats` — with a third file importing
one of them. It is `desk.ts`'s now.

**`DASH` was re-counted and both recorded figures were wrong.** `desk.ts` carried
two: "nine named against 68 unnamed in 34 others" in its header and "11 against
55 in 32 files" in its declines section, taken the same day, disagreeing with
each other. The truth on 11 Sep is **10 named against 53 unnamed across 34
files**, and the older numbers were inflated by counting the em dash in PROSE as
well as in absence positions. The grep is now written down narrowed to absence
positions. **No file does both** — each of the 44 either names it or inlines it —
so the scatter is between files, not inside any.

**Test fixtures look like a problem and are not.** 16 builder names are shared by
3+ of the 120 test files — `player` in 11, `fixture` in 8, `team` in 6 — which
reads like a missing shared factory. Comparing BODIES rather than names: only
**8 are byte-identical, and every one of the 8 is at exactly two files**. The
shared names are different builders for different domains (a gazette `player` is
a `StoryFace`, a football one a `FootballPlayer`), so the collision is
coincidence. `__fixtures__` directories already exist for the cases that were
real.

**Dead exports went from 8 to 0.** One was a genuine dead pipeline —
`app/intel.ts`'s `intelLine`, "for arranging a pitch", which nothing has called
since the pitch began arranging from `predictedEleven` and `PlTeamSheet.shape`.
Two more were `prem/PremNav`'s `RESULTS` and `FIXTURES`, kept alive by a docblock
describing a consumer in `MatchFoot` — a file that no longer exists. The other
five were exports with no consumer outside their own module and are now private.

## The pitch draws kits, not photographs (10 Sep 2026)

Craig: *"potraits dont work — lets go back to classic shirts for the pitch view
that all sites work"*, and two calls with it: reverse the direction of play, and
put a shirt number on the two screens where all eleven men wear the same kit.

**The photographs were not missing.** Counted the same day across 60 random
players: the Premier League's `110x140` set answers for **51/60** and `500x500`
for **49/60**. So this is a look decision and not a bug fix, and the reason is
the LADDER rather than the assets. `PlayerImage` falls photograph → ours → kit →
initials, so a line of eleven reliably holds nine faces, a shirt and a set of
letters. One man in seven is enough to spoil every pitch and nowhere near enough
to notice on a profile page — which is exactly why the ladder survives for the
four callers that are about one man, and why no pitch uses it any more.

### The kit source, counted — do not re-derive

`https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_{code}[_1]-{size}.png`,
all twenty clubs in both kits, 10 Sep 2026:

| | Counted | Real pixels | Bytes |
|---|---|---|---|
| `-110` | **40/40** | 110×145 | 7–12 KB |
| `-220` | **40/40** | 220×290 | 20–42 KB |
| `-440` | **0/40** — 404 | — | — |
| `-220.webp` | **40/40** genuine RIFF/WEBP | 220×290 | mean 10 KB |

So **220 is the ceiling this host publishes**, not a number picked for headroom.
`shirtUrl` asks for it and takes no size parameter: every caller draws a kit at
or above `PitchRows.MAX_CARD` (110px), so the argument would have one value at
every call site. The `.webp` is deliberately not asked for — `next/image`
re-encodes whatever it fetches, so a second URL shape buys one origin fetch per
club per deploy and costs a second thing to keep in step.
Since 5 Oct kits load unoptimized (see the decision above), so the browser takes the PNG
as it is; the `.webp` would now save about two thirds of each kit's bytes and is not yet taken.

Also present and not used: `shirt_0-220.png`, a grey blank with a white cross —
FPL's own "unknown club". `resources.premierleague.com/…/kits/` is a 403 and
there is no SVG. The `special/` prefix returns the standard file byte-for-byte.

### The pitch card, settled — kit, CM plate, the opponent's colour (10 Sep 2026)

Six sketches on the desk's own tokens, then three, then Craig's call. What ships:

- **A translucent wash** — 45% of the desk blue-black, **no border, no padding**.
  This reverses the 31 Aug decision that took the plates OFF the marker ("a row
  of black bars is what made this read as cards on grass rather than as a team"),
  because the sites Craig put beside it all box the shirt and DESIGN §2 was
  always on the box's side — nothing else on the desk prints on bare ground.
  It went to `raised` and then to a SOLID ground first, on my misreading of "make
  the background a little more opaque"; he meant more transparent.
- **The name on `cm-bevel`**, CM's own plate in CM's own face.
- **The fixture in the OPPONENT's club colour**, ink from `inkOn` — Hull's orange
  and Spurs' white take dark, Brighton's blue takes white. Only when the line
  really is one club's fixture: a double gameweek names two opponents and has no
  single colour, and a caller-supplied band (our league's position, on a club's
  predicted eleven) is not a fixture at all. Both fall back to a plain plate.
- **No number.** It rode on the chest for one afternoon. `squadNumbers` — the
  helper that dropped a collided number from both men — went with it; the
  collision counts and the reason live on in `IntelPlayer.squadNumber`'s docblock
  for whoever writes it back.

**What this cost the pitch, and it is worth knowing:** the band used to carry
FPL's fixture DIFFICULTY. It now says who rather than how hard. On the lineup
planner — the one screen where a manager is actually picking a side — difficulty
was arguably the more useful read, and `FixtureChip` still carries it everywhere
else.

**The chrome budget on a phone is the thing to watch.** A 390 card is 58px on a
five-man line. The bevel takes 4 of those in border and is the price of the
idiom; a card border and padding were taking another 6 before a letter was drawn,
which is `MBEU…` instead of `MBEUMO`. Hence the wash with no border, plates run
to the card edge, and the shirt inset instead — a kit reads at any width and a
truncated name does not.

### The kit is LONG, counted off the alpha channel

Craig, 10 Sep 2026, beside two other sites' pitches: *"our shirts seem a little
long."* It is the asset and not the box. Walking the alpha channel of nine of the
forty (palette PNGs with a `tRNS` chunk, so a plain RGBA read returns nothing):

| | Canvas | Visible jersey | Padding | Ratio |
|---|---|---|---|---|
| outfield | 220×290 | **193×284** | L15 R12 T4 B2 | **0.680** |
| keeper | 220×290 | **207×283** | L7 R6 T3 B4 | **0.731** |

Identical across every club checked, so it is a template and not per-club. The
sites he put beside it draw a shirt at about **0.88**: ours is a photographed
full-length jersey, theirs a stubbier illustration, and no box arithmetic turns
one into the other — the padding is 2–4px, so there is nothing to reclaim.

So the hem is cropped. `KEPT` in `PlayerShirt` is the fraction of the jersey
drawn and everything else derives from it: the card's shape is `0.680 / KEPT` and
the numeral sits at `0.52 / KEPT` down what survives. Cropping the FOOT is the
point — collar, crest, sponsor and number are the top four fifths.

The consequence for the fold is favourable: a 110×129 card is **16px shorter**
than the 110×145 it replaced, on every row of every pitch.

### Where a number comes from, and where there is none

| Screen | Source | Counted |
|---|---|---|
| `/prem/match/[id]/players` | `PlSquadMan.shirt` (`matchShirtNumber`) | **30/30** |
| `/prem/club/[code]` predicted XI | `IntelPlayer.squadNumber` | **197/220** starters (527/651 squad-wide) |
| every fantasy pitch | none | FPL's `squad_number` is null on all |

The split is not an accident and is the whole design: a fantasy eleven wears
eleven different kits and is told apart by them, so a number would be noise. It
is the two screens where all eleven wear the SAME kit that have nothing else —
and they are exactly the two where a real club's own sources publish one.

### The chest numeral needs a ring, and the ring is load-bearing

`inkOn` answers for the club's PRIMARY, and `clubColours` documents that field as
"shirt base — the colour a fan would name first", which is the **outfield**
shirt. Arsenal's `#EF0107` therefore returns white and Arsenal's keeper top is
white. Seven of the twenty are reds whose keeper kits are not red; three (FUL,
LEE, TOT) are white clubs whose keeper kits are not white. A per-club keeper
palette would be a second table to keep true twice a season for one numeral, so
the numeral takes a one-pixel outline in whichever ink it is not — one rule that
survives both kits, and how a real shirt prints a number anyway.

Positioned just **below** the sponsor: all forty files are shot to one template,
and 40% put "FLY BE4ER" across Arsenal's chest.

### The card and the kit have to be one rectangle

`.pitch-figure` carries an aspect-ratio AND a max-height, and on a short viewport
the cap wins — the box stops being the kit's shape and `object-contain`
letterboxes the shirt inside it. A numeral pinned to the BOX then slides down the
kit as the cap bites: it sat on the chest at one viewport and below the hem at
another. So the kit and its number share an inner box that takes the card's
height and derives its width from the ratio.

`PlayerShirt` also sets `--pitch-figure` on its **own root**, not in each caller:
`.pitch-figure` falls back to `1.32`, a LANDSCAPE box, so a caller that forgot to
declare the shape drew 63px of shirt in a 110px card. `PitchMarker` did exactly
that for one commit.

### The sister repo's squad numbers collide, and the docblock said they did not

`IntelPlayer.squadNumber` claimed the exporter cleared a number that collided
inside a club. Counted against the export in the tree on 10 Sep 2026:

- **20/20 clubs** carry a duplicate number somewhere in the squad.
- **13/20 predicted elevens** carry one among the eleven starters — Villa two
  number 2s *and* two number 4s, Liverpool two 10s (Mac Allister, Wirtz), City
  two 18s (Cherki, Semenyo).

Harmless while the number was a table column, where the name in the same row does
the identifying. Not harmless the day a pitch drew eleven identical kits and asked
the number to tell them apart. `squadNumbers` (`intel/map.ts`) drops a collided
number from **both** men — we cannot know which has the better claim, and giving
it to whoever the file lists first prints a confident wrong number on somebody.

**The match page is unaffected.** `PlSquadMan.shirt` is the number he wore in that
match, off the Premier League's own team sheet, and two men in one lineup cannot
share one.

### The opponent band is a new surface for a recorded sub-AA pair

`inkOn` picks whichever ink contrasts more, which is not the same as clearing
4.5:1 — its own docblock says so, and `clubs.ts` records the two tightest as
Arsenal **4.49** and Sunderland **4.48**. Recomputed across all twenty on 10 Sep
2026 when the pitch band took the opponent's colour: **2 of 20 under AA**, those
same two, by two hundredths.

Nothing new is broken — it is the palette's own limit and both numbers were
already written down — but the count of SURFACES carrying it went up: every card
whose opponent is Arsenal or Sunderland now draws that pair, on every pitch.
`sweep` cannot see it, because a pitch card sits on an SVG ground it reports as
"not auditable here". Fixing it means changing a club's colour, which is a
palette decision and not this one.

## Keeper at the top — the direction reversed (10 Sep 2026)

Craig: *"currently we go strikers at top, keeper bottom, lets reverse this."*
This reverses the 5 Sep decision, which was argued off `cm9900/19.jpg` — Everton's
number 1 at the FOOT of the tactics pitch. His league, his call, and it puts the
app level with how FPL, Fantrax and every other fantasy site draw a side.

**One line, in `PitchRows`, and it is a deletion.** Every arrangement in the tree
already hands its rows over goal-first — `join/lineup.ts`'s `PITCH_ORDER`,
`intel/map.ts`'s `predictedEleven`, `fpl-entry/lineup.ts`'s sort, and the Premier
League's own formation grid — because back-to-front is what an arrangement MEANS:
`lineup()` derives the shape string from its line order, so flipping any of them
would print a 1-3-4-3 as "3-4-3-1". Which end it is drawn from is a view's
decision, and there is one view. Six pitches cannot disagree.

**The grounds' padding had to flip with it.** `CmGround` leaves the attacking end
empty and pins the keeper to his own line with near-zero padding at the end he is
on — that end is the head now, so the 16% moved to the foot. Left alone it would
have held the keeper a sixth of a pitch off his line and pushed the forwards
through the far goal. `PitchFrame` needed nothing: its goal and hoardings are at
the top, so the keeper now stands in the goal he is defending.

## `.cm-tab`'s height cannot be overridden by a utility (10 Sep 2026)

`league/GroupNav` has carried `lg:min-h-9` since the day it was written, and it
has **never taken effect**. Measured on the shipped `/league/team-stats` board:
the plate computes `min-height: 56px`, and its class list ends
`… min-h-11 px-2 text-2xs lg:min-h-9`.

`desk.css` sets `.cm-tab { min-height: 3.5rem }` inside a `@media (min-width:
64rem)` block. A Tailwind utility and that rule are both **one class** of
specificity, so the cascade falls through to source order — and `desk.css` is
emitted after the utilities. Any call site trying to shrink a `.cm-tab` with a
`min-h-*` is writing a class that does nothing, silently, and the two places that
tried both believed they had.

The fix is a modifier in the same file, `.cm-tab-quiet` (44px, 36 above `lg`),
added for the pool board's stat groups when Craig asked *"we already have blue
bars on this page, do we need them this big?"*. `GroupNav` is **not** changed
here — its plates are a foot row under a ten-row board rather than a second strip
competing with a section nav, and changing how a shipped screen looks was not
what was asked. But its dead utility is now a known thing rather than a puzzle
for whoever next wonders why the plates will not shrink.

## Recorded rule exceptions

### `packages/core/src/config.ts` (recorded 5 Sep 2026)

Past §4's 300-line hard ceiling, and it is the one file where §3 outranks §4:
**"zero magic values in logic or UI — all live in one config module"**. Splitting
it means a second config module, and the day there are two of those is the day a
value is added to the wrong one. About 40% of the file is docblock, and every
constant in it carries the count or the probe it came from — which is the point
of the file rather than padding.

**The condition for revisiting**: a second RESPONSIBILITY arriving, not growth. A
provider adapter's own constants, a build-time table, anything that is not "a
value this app must not repeat".

Recorded on the commit that added `FANTRAX_TIMEZONE`, which is what CODE_RULES
asks for and what nobody had done for this file.

### Files over the ceiling with NO entry: none (counted 23 Sep 2026)

Derive it rather than editing it by hand:

```
git ls-files | grep -E '\.(ts|tsx|mjs|css)$' | xargs wc -l | awk '$1>300 && $2!="total"' | sort -rn
```

On 23 Sep that returned the three recorded here (`desk.css`, `config.ts`,
`tokens.css`) and six tests under §4's 500-line test ceiling, and nothing else.
The eleven listed on 6 Sep and the thirteen found on 23 Sep were split by
responsibility (#49, #50) or had their essay comments cut to one line (§2),
which is the fix for the files that were long only in comments.

### `desk.css` and `tokens.css` (recorded 3 Sep 2026)

Both are past CODE_RULES §4's 300-line hard ceiling, and `line_ceiling.sh`
covers `.css` — so it has been asking for this entry on every commit that
touched either, and nobody wrote it. Recorded now rather than split now, and the
reason is that neither is doing two jobs:

- **`desk.css`** is one job — the Championship Manager desk. `.cm-panel`,
  `.cm-bevel`, `.cm-row`, `.cm-rows`, `.cm-index`, `.cm-tab`, `.cm-thumbrail`,
  `.cm-out`, `.cm-scroll`. Splitting it by count rather than by responsibility means
  choosing an arbitrary line, and §4's own rule is one responsibility per file
  with the filename saying it. A second file would have to be called something
  like `desk-more.css`, which is `misc.ts` wearing a stylesheet's clothes.
- **`tokens.css`** already paid this once: its header records that
  `paper.css` was split out of it *because* the pair crossed 300. What is left
  is the single `@theme` layer — 111 custom properties, one palette. Cutting it
  again splits a palette in half, and docs/rules/DESIGN.md's whole argument is that the
  palette is one table in which every colour is a slot.

**The condition for revisiting**: either file gaining a second responsibility —
a second register, a component's own geometry, anything that is not the desk or
is not the token table. Growth alone is not it. `paper.css` and `pitch.css` are
the precedent for how a real split looks: a register and a geometry, each named
for what it is.

**No line counts in this entry, deliberately.** It carried three and every one of
them went stale the next time somebody touched a stylesheet — `paper.css` was
recorded at 288 while it stood at 342. An exception names the FILE; what the file
measures today is `scripts/line_ceiling.sh`'s answer and not a doc's.


Each entry is a deliberate departure from `docs/rules/CODE_RULES.md`, recorded in the commit
that made it.

### `revalidate` literal in every route segment (§3, no hardcoding)

Next requires a route segment's `export const revalidate` to be a statically
analysable literal, so it cannot be imported from `apps/companion/app/config.ts`.
Every route segment therefore repeats `PAGE_REVALIDATE` as a literal, and every
route added later will too — a standing exception, not a per-file one. The
`PAGE_REVALIDATE` docblock in the app's config is the canonical statement; a
comment at each site points back to it, and `scripts/revalidate.test.ts` fails
when they disagree. (Moved from core's config 23 Sep 2026: a cache window is the
app's concern, not the domain's.)

(This entry used to name one file and one export that no longer exists. An
explicit list of route files is the thing that rotted, which is why there is no
longer one here.)

### The root layout swallows a failed snapshot read (§2, no defensive try/catch)

`offerLive()` in `apps/companion/app/football.ts:142` wraps `footballNow()` — and
so `getFootballSnapshot()` under it — in a `try/catch` that returns `true`. The
root layout calls it to decide whether the Live section exists. §2 forbids
exactly this, swallow and default, and the rest of the tree honours it: the FPL
client says so in a comment as it rethrows, and `refusals.ts` catches only
`FantraxError`.

It stands for two reasons that do not apply anywhere else. A root layout that
throws takes **every route** down with it, including the pages that would
otherwise have rendered fine and reported the failure themselves. And the default
is chosen, not convenient: **it fails open**, offering the Live section rather
than hiding it. A section that should not be there leads to a page that says
plainly it could not read anything; one that silently vanishes mid-match is the
failure nobody can diagnose from a phone.

**Corrected 3 Sep 2026, and the correction is the point.** This entry named
`footballIsOn()` in `layout.tsx`, which has not existed for some time — the
function was renamed and moved to `football.ts`, and the only `footballIsOn` left
in the tree is dead text inside `.next` build chunks. It also said "there is no
`error.tsx` in the app, so the alternative is a blank screen", and
`apps/companion/app/error.tsx` has existed since 22 Aug 2026 (`ea854494`). Both
were found by `docs-drift-auditor` on the first run after this file's standing
half stopped being exempt from it, which is the whole argument for the split.

**The escape hatch it named is still shut, for a different reason than it
thought.** The entry said "if an `error.tsx` ever lands, this should be
revisited". One did, and revisiting it does not help: Next's App Router does not
route a throw from the **root** layout to `app/error.tsx` — only
`app/global-error.tsx` catches that. **One landed on 1 Oct 2026, and the exception
still stands**: `global-error.tsx` replaces the whole document, rail included, so a
layout that throws still takes every route down; it is only no longer a blank page.

### Branching on a Fantrax error code in `app/squad/league.ts` (§3-adjacent)

The adapter deliberately never branches on a specific code — the vocabulary is
undocumented and inconsistent, so `errors.ts` keys off the envelope's presence
alone, and that rule stands where it is: in detection, where a code cannot be
trusted to identify a condition.

`getLeagueSquads` breaks it, once, in presentation. It treats `NO_TEAMS` as "no
squads exist yet" and every other code as "Fantrax did not answer", because
collapsing the two tells sixteen managers with drafted squads that nobody has
drafted, on the strength of a five-minute outage. The allowlist is safe here
precisely because it fails toward hedging: an unrecognised code says Fantrax is
not answering, which is a hedged right answer even for a league that genuinely
has no teams. The reverse — a confident wrong one — is what principle 4 forbids.

### Next's `next.revalidate` inside `packages/core` (§5) — RESOLVED, removed

Both provider clients used to pass Next's `next: { revalidate }` extension to
`fetch`, which §5 forbids inside core. Resolved by deleting it rather than by
typing around it: the clients now use plain `fetch` with standard options only,
and freshness is the route's business via each segment's `revalidate`.

The cost is real and accepted: per-endpoint TTLs are gone, so a page render
refetches bootstrap (1.3 MB) rather than reusing a data-cache entry. FPL's API is
public and unmetered, and a rules-clean core is worth more than the bytes.

Follow-up worth knowing about: `/gw/[gameweek]` builds as a dynamic route, so it
re-renders per request instead of being served from the full route cache. That
was masked before by fetch-level caching. Not worth acting on until the app is
actually in front of people after the draft — noted so it is a decision rather
than a surprise.

Also note: `npm run typecheck` had never passed before this — the failure was
invisible because `CLAUDE.md`'s verify section lists only `npm test` and
`npm run build`. Both now gate every commit alongside typecheck.

### `process.env` inside `packages/core/src/config.ts` (§5, purity at the core)

`FANTRAX_LEAGUE_ID` reads the environment, defaulting to the dummy league.
Setting that variable is the entire 10 Oct swap, and it is what lets CI point a
build at the real (empty) league today and watch every view meet its empty states.

§5's ban on environment reads names mappers, scoring and engines — the places
where an unseen `process.env` makes behaviour untestable. A config module is the
one place the read is legible, and §3 explicitly offers "one config module or
environment" as the home for a league id.

Core's tsconfig still omits node types, so nothing in `packages/core` can reach
for `fs`. The single global is declared locally in `config.ts` rather than opening
that door for one string.

### The root layout's sibling: `getFootballSnapshot` no longer swallows (§2) — RESOLVED

*19 Aug 2026, before GW1.* `football/snapshot.ts` answered a failed live read
with `{elements: []}` — the exact shape FPL sends before a season starts. The two
are then indistinguishable, and on a Saturday they are opposite claims: "nobody
has scored yet" and "we cannot see the pitch". Every view rendered the first and
stated it as fact.

The failed read is now `null`, `FootballSnapshot.statsUnavailable` carries which
happened, and the gameweek view says so instead of printing a scoreline with no
scorers under it. This is principle 4 in the one place it had quietly lapsed, and
GW1 on 21 Aug is the first time it could have cost anybody anything.

### `codeHashes()` swallows a malformed `TEAM_CODES` (§2, no defensive try/catch)

*Recorded 19 Aug 2026, on the doc-truth sweep — the code predates the note.*

`app/squad/session.ts` parses the sign-in map out of an environment variable and
returns `{}` when the JSON will not parse, which is exactly the swallow §2
forbids. Kept, for one reason: the alternative failure is worse in both
directions. Throwing takes down every page including the ones that need no
identity at all, and salvaging half-parsed JSON to let *somebody* in is a
security decision made by a parser.

`{}` fails closed and fails visibly — nobody can sign in, sixteen people say so
within the hour, and every read-only view still works. It is the same shape as
the root layout's swallow above and kept for the same reason.

### Deriving the lineup lock from an unpublished offset (§3, no hardcoding)

*19 Aug 2026, Craig's call, made with the trade-off stated.*

`getLeagueInfo` publishes the period boundary, which is the first fixture's
kickoff. The commissioner locks lineups fifteen minutes earlier, and Fantrax
carries that offset nowhere — it exists only in the league's chat. So
`LINEUP_LOCK_LEAD_MINUTES` in core config is a league rule we have written down
rather than read, which is exactly what §3 forbids.

Kept because the alternative was worse and was what we shipped: `deadline.ts`
reported the boundary honestly and the front page announced it as the lock, then
corrected itself in a footnote underneath — "so this is the period boundary, not
the lock itself". A manager reads the masthead, not the footnote, and was
therefore told a lock time fifteen minutes late. On a Friday 20:00 kickoff that
is the entire margin.

The number is derived in one place, `nextDeadline`, and `Deadline` carries both
instants so a view can show which is which. **If the commissioner moves the lock,
this constant is the only thing that knows** — nothing fails, the app simply
prints the wrong time to sixteen people.

### New dependency: `tsx` (§2, every dependency is a recorded decision)

Dev-only, never shipped. The capture and bridge runners import `@epl/core`, whose
relative imports are extensionless, which Node's native type-stripping will not
resolve. `tsx` is the smallest thing that runs them unchanged.

Scripts transpile to CJS (the root package has no `"type": "module"`), so they
cannot use top-level `await` — each wraps its body in `main()` and calls it
without awaiting, so a rejection crashes the run loudly instead of being softened.

## The Premier League palette we were using was four years out of date (7 Aug 2026)

Every football-register token in `globals.css` was the 2016 set. Read out of the
live sources instead — `premierleague.com/resources/v1.51.2-1/styles/screen.css`
and FPL's production bundle `assets/index-9PDTUlDh.js`.

| role | was (2016) | is (2023 refresh) |
|---|---|---|
| PL Purple | `#38003c` | `#37003c` |
| PL Green | `#00ff85` | `#00ff87` |
| PL Blue (the cyan; their token says "blue") | `#04f5ff` | `#05f0ff` |
| PL Pink | `#e90052` | `#ff2882` |

`#38003c` appears **zero** times in premierleague.com's current 2.4 MB stylesheet.
Every brand-colours aggregator on the web still publishes the old set, which is
where ours came from. The palette also grew: lilac `#953bff`, yellow `#ebff00`,
orange `#ff6900`. None of the three is a token here yet because nothing uses
them — the lilac is FPL's own gradient partner (`linear-gradient(90deg, #05f0ff,
#953bff)`) and is the obvious register for the FPL tab when it lands.

Pink is the one that mattered. `#e90052` → `#ff2882` takes `--color-live` from
4.31:1 to 5.52:1 on `--color-bg`; the old value was failing AA on the one thing
that has to be read at arm's length.

**We deliberately diverge from them on one binding.** Their `--theme-live` is PL
Orange `#ff6900`, and `.badge--live` uses it. We keep pink, because orange sits
in the same warm band as Tim Hortons red `#C8102E` and the two would muddle on a
masthead carrying both. Pink is still theirs — it is `--theme-hyperlink` in their
dark theme.

Other facts worth not re-deriving:

- **Their pitch** is `/assets/pitch-graphic-t77-OTdp.svg`, a perspective
  trapezoid: base `#00A34F`, four mow bands in `#009B4C` (2–3% darker, not more)
  whose heights *grow* toward the viewer — 63.6, 63.6, 85.9, 132 in a 788-tall
  viewBox. That growth is what sells the perspective, which is why our `.pitch`
  cannot be a repeating gradient. Our ramp holds their hue and band contrast but
  sits ~12% darker: `#00A34F` is right on a white app and a wall of green on a
  near-black one.
- **Their pitch tile** is 67×92 on mobile, 112×140 from 700px, and is three
  stacked parts: shirt, name bar, details bar. The details bar has three states —
  fixture text, the orange→pink live gradient, then flat `#37003c` with the
  points. Ours is the same three-part shape with a photograph instead of a shirt.
- **Their neutrals are never neutral**: the mono ramp holds hue ~321–326
  throughout. Ours already did, at 320.
- **Kit sprites**, if we ever want them: `/dist/img/shirts/{standard|special}/
  shirt_{team_code}{_1 for GK}-{66|110|220}.{webp|png}`. Verified 200.
- **Tim Hortons** is `#C8102E`, from their own markup. Their palette since the
  2017 rebrand is red and white only; the cream in our tokens is the 1964–85
  identity's register, chosen deliberately because the album is a period object.

## The portrait ceiling was more than twice as high as recorded (4 Sep 2026)

`portraits.ts` said the Premier League published one size, `110x140`, serving a
220x280 image, and that "the source is the ceiling rather than the encoding" — the
front page's soft lead picture was blamed on it. **`500x500` was there the whole
time and nothing in the tree asked for it.**

Probed across the ladder under the current `premierleague25` prefix:

| path | HTTP | actual pixels | bytes |
|---|---|---|---|
| `40x40` | 200 | — | 12 KB |
| `110x140` | 200 on **105/120** | **220x280** | 83 KB |
| `220x280` | 200 on **12/120** | 220x280 | 105 KB |
| **`500x500`** | **200 on 104/120** | **500x500** | **249 KB** |
| `250x250` `330x330` `150x200` `660x840`, any `.webp` | 403 | — | — |

So the path labelled `110x140` serves a 220x280 image, and `500x500` is 2.27x
its linear resolution. **`220x280` as a literal path is NOT a second name for the
small one** — it answers on one player in ten and 404s on the rest. This section
first said the two were the same image under two names, from a single player who
happened to have both; the denominators above are the correction, and the reason
a count belongs beside every one of these.

**The two we ask for are the same men**: 105 and 104 with an overlap of 104 — no
player has the large without the small, and one in 120 has the small without the
large. `PlayerImage` therefore falls large → small before the rest of its ladder,
and that first rung fires about once a squad.

It is **square** rather than 4:5, so the crop framing differs from the small one.
`next.config.ts` already allow-lists `premierleague25/**`, so nothing there
changed. The player profile draws at 176 CSS px against it, up from 112.

Incidentally: the "roughly a quarter of players have no photograph" in
`PlayerImage`'s docblock was **15 of 120** — one in eight. The set has improved,
and that comment has been corrected in the same commit rather than only here.

## `groundfit` could not fail, and DESIGN §2 rests on its number (4 Sep 2026)

`tools/ui/groundfit.mjs` walked a text node's ancestors accumulating background
alpha and stopped at `document.documentElement` — **which meant it counted
`<body>`, and `globals.css` gives body an opaque `--color-bg`.** Measured: body's
computed background is `lab(5.87 1.94 -15.65)` at alpha **1.00**, `<html>` is
`rgba(0,0,0,0)`. So `cover` reached 1.00 for every text node on every desk route
and the audit could not report anything. Its "Zero bare, 31 Aug 2026" — the
number DESIGN §2 rests the photograph reversal on, and the bound under *"moving
`SCRIM` or `DARKEN` is safe for exactly as long as that stays at zero"* — was
vacuous.

The render is the other way round. `<html>` is transparent, so body's background
propagates to the **canvas**, and `PhotoGround`'s `fixed inset-0 -z-10` paints
above the canvas background. That is why the photograph is visible at all, and it
means body's fill is BEHIND the picture and covers nothing.

Fixed: the walk now stops before `<body>`. What it reported that day, at both
widths — and what it reports now, re-run 5 Sep 2026 after the phone work:

| route | 4 Sep | 5 Sep |
|---|---|---|
| `/players` | 40 (the cap) | **0** |
| `/matchday/desk` | 40 (the cap) | 40 (the cap) |
| `/league/matchups` | 4 | **0** |
| `/matchday` | 2 | **0** |
| `/league/schedule` | 1 | **0** |
| `/fpl` | 1 | **0** |
| `/squad` | — | **2** |

**What closed four of them was `PageHeader`'s `Sub` taking a surface**, which is
the shape that paragraph below names — one `<p>`, four routes. `/players` closed
when the screen took `LeagueShell` and its panel (5 Sep): the directory had been
printing on the photograph because it had nothing to be inside.

**What is left is two.** `/matchday/desk` at the cap is the `≥lg` wall, which is
a whole screen built to be read across a room and has never had a plate under any
of it; `/squad` is a sign-out button and an "Around the league" heading. Neither
is fixed here and both are now the whole of the list, which is a different
statement from the app-wide pattern the next paragraph describes.

**`components/shell/Section` was the offender, and it was everywhere.** Its
heading (`font-display text-2xs font-bold uppercase text-muted`) and its `aside`
sit on no plate, so every headed block in the app prints two strings on the
photograph. `PageHeader`'s `sub` was the same shape — *was*: it took
`border border-line bg-surface` on 5 Sep 2026 and that one `<p>` is what closed
four of the six routes. `FixtureRun`'s gameweek labels are still bare, and
`/players`' sort links went with the board.

**Nothing app-wide is fixed here.** Giving `Section` a plate changes every screen
in the app and is a docs/rules/DESIGN.md decision rather than a feature commit's. What the
player screen did fix is the two things it introduced: the cyan real-position line
— the marquee element of the screen, and the loudest thing that was on the
picture — and the bio line, both of which now sit on `cm-panel`.

DESIGN §2's "Zero bare, 31 Aug 2026" should be restated with the date of a run
that could have failed.

## `Page.captureScreenshot` hangs past ~4 Mpx — and the recorded cause was wrong

`tools/ui/shot.mjs` at `--width 1440` never returned, and PLATFORM_NOTES blamed
"a second session driving the same browser". That was a coincidence of when it was
first seen. It reproduces on a freshly launched browser nothing else is touching,
one capture per launch, `--headless=new --disable-gpu`:

| surface | device pixels | result |
|---|---|---|
| 1440x1800 @1x | 2.59 Mpx | ok |
| 2048x1400 @1x | 2.87 Mpx | ok |
| 1900x1900 @1x | 3.61 Mpx | ok |
| **2000x2000 @1x** | **4.00 Mpx** | **hang** |
| 2100x2100 @1x | 4.41 Mpx | hang |
| 2880x1800 @1x | 5.18 Mpx | hang |
| **1440x900 @2x** | **5.18 Mpx** | **hang** |

It is the **product** that matters, not the width or the height: 2880x900 is fine
and 2000x2000 is not. The wall sits just under 4 Mpx — a 16 MB buffer at four
bytes a pixel. 1440 at 2x is 5.18 Mpx, which is why the DESK shot was the one that
always hung, and why nobody noticed at 390.

**It does not fail, it never returns, and the wedged renderer takes the NEXT
instrument down with it** — which is why a run used to die one tool after the one
that broke it. `cdp.mjs` now holds `CAPTURE_CEILING` and steps the scale down to
fit, saying so on stderr; `compare.mjs` derives its composite zoom from the same
constant instead of hardcoding a doubling that came to 4.49 Mpx.

## Rule exception: the bridge is asserted, not parsed, at the app edge

`apps/companion/app/squad/league.ts` does `mapping as Bridge` on the JSON import.
`resolveJsonModule` widens `matchedBy` to `string` and the compiler cannot see
that `scripts/build-bridge.ts` only ever writes the four literals. The
alternatives were worse: loosening `MappedEntry.matchedBy` to `string` gives up
the type everywhere to serve one import, and hand-parsing 544 rows at request
time buys nothing, since the file is ours and generated rather than scraped.
Asserted once, at the single edge, with the reason written at the site.

## The one football fact the league layer cannot supply

`join/lineup.ts` declares `PITCH_ORDER = ["G", "D", "M", "F"]`.

`getLeagueInfo` gives the position vocabulary and the per-position caps —
`{ G: 1, D: 5, M: 5, F: 3 }` — and CLAUDE.md is right that the vocabulary is
league data we must never assume. But nothing in that payload says a goalkeeper
stands *behind* a defender, and no other Fantrax read carries it either. So the
depth ordering is declared once, in the join, with the caps still read from the
league. A letter the order has never seen renders at the front rather than in
goal: a commissioner adding "W" for wingers should look wrong, not wrong in a way
that reads as correct.


## Verified Fantrax facts (probed live 12 Aug 2026, against real transactions)

Craig executed a trade (9:13AM EDT) and a free-agent claim with a drop (9:14AM)
in the rehearsal league. Captures either side of them, plus a probe, settled
three open questions at once.

### Transactions are a first-class read, and public

`POST /fxpa/req` → **`getTransactionDetailsHistory`** returns typed, timestamped
transaction records **without a cookie**. This corrects the 7 Aug note that had
it behind auth. It takes `view`, and `displayedLists.tabs` is the server-driven
list of legal values — currently `CLAIM_DROP`, `TRADE`, `LINEUP_CHANGE`.

What each row carries: `scorer` (a full player object whose `scorerId` **is our
fantraxId**, with `posShortNames` for eligibility), `txSetId` grouping both
halves of a trade or a claim+drop, `resultCode`/`executed`, and `cells` keyed
`from` / `to` / `team` / `date` / `week`. `TRADE` rows name both sides
explicitly; `CLAIM_DROP` rows add `transactionCode` (`CLAIM`/`DROP`) and
`claimType` (`FA`). The trade rows carry **no** `transactionCode` — for trades
the *view* is the type.

**Bind to `cell.key`, never to the header name.** The `week` column's header
name arrives as the literal string `"{0} on which this transaction takes
effect"` — an unsubstituted i18n placeholder shipped to production. Its
`shortName` is "Gameweek" and its `key` is `week`. Any parser keyed off the
English name is built on text Fantrax itself cannot render correctly.

**This displaces the capture-diff derivation as the primary source.** Diffing
consecutive captures does work — it found both events unaided — but it is
strictly weaker: it cannot name a transaction type, cannot see two moves in one
day, and cannot tell a trade from a commissioner override. The native feed does
all three and timestamps them to the minute. Capture-diff stays as
corroboration, and the three views should themselves be captured daily so we
own an archive of a feed Fantrax could prune.

`getTransactions` (no "Details") exists, is public, and returned an empty
`transactions: []` throughout — not the same thing, and not the one we want.
`getPendingTransactions` answered `noPendingTransactions`.

### One week, two reads — the feed's ordering problem (19 Aug 2026)

The paper read `CLAIM_DROP` and nothing else, so **the rehearsal league's only
trade had never appeared on the front page.** Not a rendering bug: for a trade
the *view* is the type, and a paper that reads one view reports every waiver
claim in the league and none of its business.

Reading both raises the question one view never did. Each view arrives
newest-first *on its own*, so concatenating them gives every claim, then every
trade, which is not a week. `deals()` used to say its ordering came from the feed
and that sorting by `processedAt` "would mean inventing a date format". That
stands for an instant and not for an order:

- **A sort key is not a timestamp.** "Wed Aug 12, 2026, 9:14AM" carries no
  offset — Fantrax puts that in the column heading, as `Date Processed (EDT)` —
  but every row in one league's feed is in one displayed timezone, so comparing
  them needs no offset at all. `orderKey` composes an integer, is used for
  nothing but `sort`, and `Deal.processedAt` stays their string verbatim.
- **It is all-or-nothing.** A row whose date will not parse — a translated month,
  a changed format — returns the feed order untouched rather than sorting around
  the gap. A partial sort would place that row by an accident of the comparator,
  and the order it displaced was at least each view's own truth.

`LINEUP_CHANGE` stays captured daily and stays out of the paper: benching
somebody is not business anyone did with anyone, and on sixteen teams it would
bury the two moves that are.

Verified against the 12 Aug captures rather than fixtures — the claim/drop pair
and the trade, told as two stories, in the minute order Fantrax processed them.

### What the capture diff saw, for the record

Status alone (`playerInfo[].status`) caught only the claim: Gibbs-White `T→WW`,
Schade `FA→T`. **The trade is invisible to a status diff** — both players stay
`T` — and surfaced only by comparing *owners* across teams. Any derivation must
compare ownership, not status. That is now a recorded fixture rather than a
prediction.

### `?period=N` is accepted, echoed, and inert

`getTeamRosters?period=1|2|5` all echo the requested period back and return
**byte-identical rosters** (same payload hash), all reflecting post-trade state.
So it does not serve history today. This does not yet distinguish "projection"
from "ignored": no period has *completed*, so there is no past for it to serve.
Re-ask after period 1 closes on 28 Aug.

Until then the answer that matters is unchanged and now evidenced: **past
lineups exist only in our capture archive.** The doctrine holds.

## The lineup gate is about rivals, not about you (19 Aug 2026 — supersedes the preview flag)

**Superseded.** The section this replaces described `mayPreviewLineups()` and the
`?preview=1` escape hatch: the planner had to be visible during development, the
gate hid every lineup including the reader's own, and so the planner was let
through only on the rehearsal league, only when asked for by query string, and
never on the real one. It failed closed and it was the right shape for the rule
as it then stood.

The rule was wrong. It withheld a manager's own XI from him, and the reasoning —
"one rule is safer than two" — bought nothing: he is looking at that lineup in
Fantrax anyway. What it cost was the only useful thing the app could do with a
lineup, which is let him plan it **before** the deadline. A planner reachable
only once the period has opened is a view of a decision he can no longer change.

`rosterDisplay` now takes `yours`:

- **your own team — always `lineup`**, no calendar consulted and no clock read.
  A roster whose period Fantrax would not name still falls through to squad-only,
  because `show: "lineup"` has to say which period it is showing.
- **every other team — unchanged.** Squad all week, XI once its period opens.

Two things keep that safe. `yours` comes from the session team id, which
`myTeamId` validates against the league's own roster before anything sees it. And
`getLeagueSquads()` still computes its league-wide `display` with `yours: false`,
because that value is read by things that report on all sixteen teams at once —
the pending clean sheets on the matchups board, for one. A reader's own answer
applied there would show fifteen rivals' XIs through the side door. The single
team a known reader is looking at gets `teamDisplay(squads, mine)` at the route
that knows which team that is.

`mayPreviewLineups()` and `?preview=1` are deleted. There is nothing left to
switch off.

## `getPlayerProfile`, probed live (12 Aug 2026) — do not re-derive

Public on fxpa, no cookie. Verbatim responses for a rostered player and a free
agent are in `data/probes/2026-08-12/`.

- **The parameter is `playerId`.** `scorerId` — Fantrax's own name for the
  identical id on the transaction rows — and `fantraxId` both answer
  `INVALID_REQUEST`. One id space, three names for it, one that works.
- **A third fxpa failure shape exists**: the refusal came back as a top-level
  `pageError` *and* as `responses[0].pageError`, which is neither of the two
  shapes `errors.ts` documents. `unwrapFxpa` catches it because it checks the top
  level first. Nothing needs changing; it is recorded so the next reader knows the
  nesting is not a third detector waiting to be written.
- **The numbers are last season's.** `displayedSelections.seasonId` was `925`
  while `season` said 2026-27 is `926`: the profile serves the most recent season
  actually played. Before GW1 that is 2025-26, so every points figure on the page
  belongs to a season that has to be named beside it. The season is resolved by
  matching the id against the seasons the payload itself names, never assumed.
- **Provenance splits four ways inside one `miscData`**: `leagueData` is our
  league's row (status/team, FPts, eligibility), `highlightStats` is Fantrax's
  scoring and rankings, `percentDrafted` + `averageDraftPosition` are
  whole-of-Fantrax, `personalInfo` is the man. They render as four blocks under
  four headings. "100% rostered" means every league on the site and sits two rows
  from our own ownership.
- `percentOwned` and `percentActive` are **not mapped**, deviating from the plan.
  They arrive as three items labelled only "This Week", "Last Week", "Next Week",
  so taking a figure means binding to an English name — the trap `transactions.ts`
  already names — and both numbers arrive again in `highlightStats` with their
  meaning spelled out.
- `ownerTeamId` is null for a free agent and the fantasy team id otherwise,
  agreeing with the rosters.
- `miscData.icons[]` carries dated Fantrax news, truncated with an ellipsis. Not
  read: injury news is a football fact and the football layer already has FPL's,
  untruncated.
- `headshotUrl` is the **club crest** when they have no photo
  (`usesTeamLogoAsHeadshot: true`), so it cannot be rendered as a portrait.
- `sectionContent` (stats, splits, game logs) is **still** refused, and the reason
  hardened on 4 Sep 2026 — see below.
- ADP is real and public here (`averageDraftPosition`), which is the trade scout's
  value map when it lands.

### `sectionContent`, re-probed 4 Sep 2026 — one line read, the tables still refused

Only `latestNews` is read, and it is now on the player screen's Fitness tab: one
dated sentence about his last match, whole rather than truncated. The analysis
behind it is gated (`analysisTitle: "Analysis available to registered users"`) and
we do not pretend to it.

The **tables** stay refused, and the reason is no longer only their weight:

- **A percentile needs the whole division, and this endpoint answers one player at
  a time.** The player screen's attribute grid rates a man against everyone who
  has played, so a statistic only reachable one profile at a time cannot feed it —
  and looping over 697 profiles is the thing this endpoint's politeness policy
  forbids. Shots, shots on target, fouls committed, fouls suffered and offsides
  are all here and all Fantrax-only; the pool-wide route to them is
  `getPlayerStats` with `positionOrGroup`, which needs its own probe.
- **The stat ids are per-SPORT, because the endpoint does not check the sport.**
  Asking our EPL league for a player id belonging to another sport returns a
  complete, confident NFL profile — `Sk`, `FF`, `IntYd`, `Hur` — under our league
  id, with no error. Football's ids are the `6xxx` block (`6210` shots, `6230`
  shots on target, `6040` fouls committed, `6050` fouls suffered, `6130` offsides),
  stable across five EPL players checked. A caller must never assume the table in
  front of it is football.
- **Cells carry HTML.** `'Fri Aug 28 -<br/>Thu Sep 3'` and `'<b>D</b>: 2'` are real
  cell contents in the same payload. `profile.ts` strips tags before anything
  leaves it.

### The parameter is `tab`, and it opens all nine sections (4 Sep 2026)

The payload's own `sections` list names `OVERVIEW`, `STATS`, `SPLITS`,
`GAME_LOG_FANTASY`, `GAME_LOG`, `NEWS_NOTES`, `TRANSACTIONS_FANTASY`,
**`TEAM_SERVICE_TIME`** and `TRANSACTIONS`, and for one day only `OVERVIEW` came
back. **`tab` is the parameter**, and it takes the `code` off that same list.

Eleven names were tried before it and every one was ignored — byte-identical
responses each time: `section`, `sectionCode`, `view`, `selectedSection`,
`displayedSection`, `sectionType`, `contentSection`, `pageSection`, `sectionName`,
`selectedTab`, `activeSection`. The tell was the response SIZE: 16,058 bytes for
every miss and 5,700 for the hit.

What each answers, measured with `playerId` `078wl`:

| `tab` | bytes | what is in it |
|---|---|---|
| `NEWS_NOTES` | 5,700 | **read** — every story about him, full body and full analysis, `newsDate` in epoch ms |
| `TEAM_SERVICE_TIME` | 4,626 | a row per gameweek: `period`, `team`, `status`, `position` |
| `TRANSACTIONS_FANTASY` | 4,620 | `date`, `action`, `details` — richer than the league-wide feed, because it names what was dropped in the same move: `Claimed (FA) by <b>test4</b>` / `Dropped <b>David Raya</b>` |
| `GAME_LOG_FANTASY` | 9,178 | tables plus a `seasons` list and a `selectedSeason` |
| `SPLITS` | 12,156 | tables plus seasons |
| `STATS` | 6,073 | tables |

Only `NEWS_NOTES` is read. **Service time is what a Transfer tab really wants** and
`TRANSACTIONS_FANTASY` would supersede the league-wide feed the player screen
currently filters — both are now a mapping job rather than a probe.

Note the `<b>` in those cell values: this section carries markup inside its own
strings like the rest of the payload, and nothing may render it as markup.

## `getPlayerNews` is a WINDOW, not one story per player (probed live 21 Sep 2026)

Public on fxpa, no cookie — `roles: ["03"]`. The sister read to
`getPlayerProfile` above, and the two are not interchangeable.

- **`poolType` is REQUIRED.** Without it the call refuses with `MISSING_PARAM`,
  text `poolType`, extraInfo "Must be 'POOL' or 'ALL' or 'WATCH_LIST'". `POOL`
  and `ALL` then answered **byte-identical payloads**, 86,292 bytes both times:
  the parameter has to be sent and does not have to be chosen.
- **It is about seventeen hours of the pool, not a story per man.** 74 stories,
  74 distinct players, **0/74 with a second story**; newest `newsDate`
  2026-09-21 07:39:05Z, oldest 2026-09-20 14:39:31Z, against a pool of some 611
  players. So a player with no entry is one nothing was filed about **today**,
  never one with no news — the absence is about the window and not about the man.
- Newest-first on the wire, verified rather than assumed: the date list equals
  its own reverse-sort. `mapPoolNews` keeps the first row per player on that.
- **`maxResults: 500` is ignored** — still 74. There is no page to ask for, and
  the count is simply what there is. Another published control that describes a
  UI rather than promising a parameter, like `goBackDays` above.
- **League-independent.** The real league (`ayyoh3n2mr326v2o`) and `dummy`
  (`w05aib75mtj36y1g`) returned the same 74 stories, same first player, on the
  same second. It is pool data wearing a league id, carried because fxpa takes
  one — not a league read.
- Field presence, counted across all 74: `scorerFantasy` **74/74**, carrying
  `scorerId` (which IS our `fantraxId`), `name`, `shortName`, `teamShortName`,
  `posShortNames`, `statusId`, `headshotUrl`; `playerNews` **74/74**, carrying
  `id`, `headlineNoBrief`, `content`, `analysis` and `newsDate`, each **74/74**.
  `scorerFantasy.icons` is **7/74**.
- **`headlineNoBrief` is `content` truncated with an ellipsis**, not a separate
  headline. Printing both prints one sentence twice.

**Which of the two to call.** `getPlayerProfile?tab=NEWS_NOTES` is one request
per player and is the only route to a HISTORY; this is one request for every
player on a screen and only knows about today.
`packages/core/src/league/fantrax/playerNews.ts` holds both mappers.

## The pool page: status is league state, not a player fact

Our real league marks **all 697 players `WW`** while it has no teams; the
rehearsal league splits them `FA 630 / T 60 / WW 7`. A players page that defaulted
to "free agents" would therefore be **empty in the league we ship on 10 Oct** and
full in the one we develop against — the exact class of bug the two-league
discipline exists to catch, and it was caught by reading both captures rather
than by a test. So: no default filter, and the status chips are built from the
statuses actually present with their counts, labelled where we recognise the code
and shown raw where we do not.

Ownership is computed from the rosters, never read off the status letter. The two
answer different questions — `status` is what may be *done* with a player,
ownership is who *has* him — and in an undrafted league both are true at once:
everyone is waiver-wire and nobody is owned.

`getTeamRosters` answering `NO_TEAMS` is therefore survivable here and is the only
failure that is. Any other roster failure fails the whole page, because the
alternative is 697 rows quietly claiming nobody owns anybody.

Filter state lives in the URL, so the page stays a server component, the pool
never crosses to the phone as data, and a manager can send someone a link to
exactly what he is looking at. Nothing is truncated: every row Fantrax answers
with renders, ~84 KB gzipped, and the header states the count in view against the
total. *"Every row"* is now every row MINUS the departed — see the next section;
the count it was measured at was 697.

## The site rule: a man who has left the division is off every list (11 Sep 2026)

Craig: *"hide all unavailable players (like Woltemade) they aren't in the
league."* It generalises what he asked of the club Squad tab on 3 Sep (*"remove
UNAV players, they are out of the game"*), which by 11 Sep was written out in two
places and wanted in five.

**What the letter means, counted.** FPL's bootstrap on 11 Sep 2026: 656 elements,
`a` 476 · `i` 62 · `d` 13 · `s` 1 · **`u` 104**. All 104 carry a `news` line and
every one of them says where he went — *"Has joined Juventus on loan for the rest
of the season"*, *"Has joined Al Hilal permanently"*, *"has departed the club as a
free agent"*. So `u` is not a long injury under another name: it is a man who is
no longer in the Premier League.

**Fantrax does not know.** Woltemade is `070g7` in `getPlayerIds`, `{"eligiblePos":
"F", "status": "FA"}` in the real league's `playerInfo`, and the bridge settles him
on `fplCode` 470313 at confidence 100 — a free agent our pool page was offering to
ten managers for a man who plays for Juventus. Their `status` is league state (FA,
WW, T) and has no availability in it at all; only the football layer can answer
this, and it answers it across the bridge.

**One predicate, one selector.** `football/playerState.ts` — `onTheBooks(player)`,
which is `availabilityOf(player).state !== "unavailable"`. `football/selectors.ts`
— `squadOf(snapshot, clubId)`, the third caller arriving as CODE_RULES §1 requires
(Squad, Stats, Set Pieces), unsorted because the ORDER is what varies between the
three.

**Where it applies, and where it deliberately does not.** It is a rule about
LISTS — who is at a club, and who can be picked up:

| Applied | Not applied, and why |
|---|---|
| `/prem/club/[code]` Squad, Stats | `/prem/match/[id]/*` — **seven of the 104 played before they left** (Sánchez a full 90, Richarlison 67, Drameh 65, Millar 50, Beto 31, Woltemade 19). A scoresheet that dropped them would say a match was played by ten men |
| `/prem/club/[code]/set-pieces` — **6 of the 135 ranked takers had gone**, Woltemade first on Newcastle's penalties at a 0.57 share. Filtered before the rank is drawn, so the order still counts 1, 2, 3 | `/squad/[teamId]` and every Fantrax roster — 2 of the dummy league's 150 slots hold one. Hiding a slot a manager is still paying for hides the problem, not the man; he is greyed and boxed `Unav` instead |
| `/players` and `/players/analysis` — `stillHere` in `players/pool.ts`, outside the league cache so a Fantrax entry cannot keep offering a man who left | `/players/[fantraxId]` — a page ABOUT one man, reachable only by a link nothing now draws or by a typed URL. It says what happened to him |
| the attribute percentile cohort (`players/[fantraxId]/grid.ts`) — 104 frozen, mostly-nought seasons in the denominator is what makes an ordinary player look good | `clubStats` and `/prem/team-stats` — a SUM, not a list. The goals a departed man scored for that club are still that club's season |

`players/pool.ts` is now the one place a page that is otherwise entirely Fantrax's
makes a football read, and it is a hard dependency rather than a column that may
fail. The alternative is a pool that offers men who are not in the division, which
is wrong in a way a missing photograph is not.

## What `violations()` deliberately cannot say

Fantrax publishes `maxActive` per position and **no minimum**. So "only two
defenders" breaks no rule anyone set: an under-filled XI is legal, and a type
called `Violation` must not carry it. The planner says it in its own words
instead — *n* empty places, allowed, and nothing scores from them.

Everything it does report is reachable without a single illegal move, because the
lineup we are handed is Fantrax's. Craig narrowed eligibility across the league on
12 Aug; the same edit under a set XI leaves a player standing somewhere he is no
longer eligible for, and `legalMoves` — which only ever offers legal moves — would
never mention it. Eligibility we do not hold is never reported as eligibility a
player lacks: that violation has no move that clears it, so the wrong answer
strands a manager rather than merely misinforming him.

## `getMatchups` is not public (probed live 13 Aug 2026) — do not re-derive

Both leagues, with and without a `period` parameter, answer
`WARNING_NOT_LOGGED_IN` — four byte-identical refusals, filed in
`data/probes/2026-08-13/`. The public/private line on fxpa runs per method, and
this one sits on the far side with `getScorerDetails`, not with `getStandings`
and `getPlayerProfile`.

Consequence, designed in rather than worked around: **/matchup shows the pairing
from `getLeagueInfo.matchups` and countable events, never points.** Fantrax's
live H2H totals stay authoritative and stay on Fantrax until a cookie flow
exists. When the visibility gate opens a period, each side of a pairing shows
the active eleven's summed events (G/A/CS/YC/RC) from FPL's public feed,
labelled as events; before it opens the page shows pairings only, because a
two-team screen is the easiest place in the app to leak a lineup. Whether
`getMatchups` carries totals, a server-driven period list, or only the schedule
remains unknowable until a cookie is in hand — re-probe then.

**Re-probed with a cookie the same evening, and the answer is: only the
schedule.** No score, no result, no state. See the 13 Aug sweep below — the
totals we wanted are on `getLiveScoringStats`, which needs no cookie at all.

## The fxpa sweep with a member cookie (13 Aug 2026) — the big one

Craig put his Fantrax session cookie in `.env.local` (gitignored, read from the
environment, never logged). That let us probe every method the SPA uses, each one
twice — anonymously and authenticated — and the answers rewrite what this app has
to build. Verbatim bodies for 41 calls are in `data/probes/2026-08-13/`. The
headline: **almost everything we wanted is public, and the one thing that was
login-walled turns out to be worthless.**

### `getMatchups` is a schedule and nothing else — stop wanting it

It is cookie-walled, as recorded on 13 Aug, and now we know what is behind the
wall: 34 KB containing `periods[].matchups[].{homeTeam,awayTeam}` and no score of
any kind. A leaf census over the whole tree found exactly three numeric leaves —
the period number, `regularSeasonEndPeriod: 38`, and a server clock — and the
substrings `fpts`/`score`/`point`/`win`/`result` appear nowhere. Its 38 × 2
pairings reproduce the **public** `getLeagueInfo.matchups` exactly, orientation
included (the order of the two matchups within a period differs in 19 of 38
periods, which is presentation, not data). `period` is accepted and ignored:
requesting period 1 returns a byte-identical body but for the clock.

So the open question "does `getMatchups` carry totals — re-probe when a cookie
exists" is **answered: it does not, and it never will, because the schema has
nowhere to put a score.** It is not a reason to build a cookie flow.

### `getTeamRosterInfo` is public, parameterised, and carries Fantrax's own points

The roster page. Public, and it accepts `teamId`, `period`, `view`,
`seasonOrProjection` and `scoringCategoryType`, all echoed back in
`displayedSelections`. So we can read **every squad, for every one of 38 periods,
without a session.** It carries:

- the full roster with `posId` (the slot), `statusId` (1 active / 2 reserve) and
  the player's real fixture — empty slots appear as rows with a `posId` and **no
  `scorer` key**, so never assume a row has a player;
- **per-player fantasy points under our own league's scoring** — two tables,
  keeper and outfield, whose headers key off `fpts`, `fptsPerGame`, and then the
  stat columns themselves (`GP Min G A AF YC RC PKM OG GAO CS`, plus `Sv GA PKS`
  for keepers);
- `view: "FPTS"` re-renders those same columns as *points contributed per
  category*, and they sum exactly to the total — verified on 30 of 30 rows across
  two teams. That is a points breakdown we do not have to compute;
- `periodOppnentTeamIds` (their typo) — **the opponent for the requested period**,
  matching the cookie-walled `getMatchups` exactly. The pairing is public here.

Anonymous and authenticated responses were fetched for the same team and diffed
cell by cell: **identical**. The cookie adds `commissioner`, `isMyTeam` and the
caller's `roles`, and nothing about the football.

### `getLiveScoringStats` is public and typed — the live scoreboard

The live-scoring page, and the first Fantrax payload we have seen that is *data*
rather than rendering instructions: no cells, no pixel widths, no formatted
numbers. Per fantasy team, keyed by team id, for all teams at once:

- `statsPerTeam.allTeamsStats[teamId].ACTIVE.totalFpts` — a **typed int**, the
  team's fantasy points for the period. Zero today because the season has not
  kicked off, so *that it fills in live is an expectation, not an observation* —
  re-probe on 21 Aug before anything depends on it;
- `projectedTotalsMap` / `calculatedProjectedTotalsMap` — **typed floats**,
  Fantrax's own per-player projection for the period (identical to each other
  today). Players are **omitted rather than zeroed** when there is no projection;
- `gameStatusMap` — the one formatted string: `"@FUL~1787598000000|06m5p|1"` is
  away, opponent, kickoff epoch ms, Fantrax game id, status;
- `remainingEventPercent` — typed, 1 when the fixture has not started, which is
  how "three of your eleven still to play" gets answered;
- `playerGameInfo` — five unlabelled ints, `[0,0,11,0,990]` = eleven players to
  play, 990 minutes. **Absent on BENCH, not null.**

`period` is honoured. `matchupId` is **not** — passing the one from their own URL
returns a byte-identical body, so their matchup view filters client-side and the
payload always carries the whole league. ~~The **`BENCH` block is cookie-only**~~ — wrong: it
arrives anonymously with `playerViewType: "2"` (24 Sep, above). Anonymous callers
without it get `ACTIVE`, which is what scores anyway. Per-player *points*
(`statsMap`, `statsMap2`) are `{}` in every section, so what they will hold is
unknown.

### `getPlayerStats` is public — and its default view ~~is a projection~~ WAS

The players page: 708 players, 20 per page, 36 pages. Rows carry `scorerId` (our
`fantraxId`), the player's news `icons`, and **which of our teams owns him**
(`cells[1].teamId`) — ownership in our league, public.

Two traps, both load-bearing:

- ~~**The default is `PROJECTION_0_926_SEASON`.**~~ **It flipped, and the read
  was built to survive it.** Re-probed 5 Sep 2026 across all three leagues: the
  default is now `SEASON_926_YEAR_TO_DATE`, "2026-27 - YTD", real played
  numbers. The 13 Aug note left this open — *"whether it flips to real numbers
  once games exist is unknown and resolves itself on 21 Aug"* — and it did.
  Nothing needed rebuilding, which is the point worth keeping: `season()` in
  `fantrax/stats.ts` reads `timeframeTypeCode` off the answer and sets
  `projected` from it, so the heading followed the payload without anyone
  touching it. **The rule that survives is the rule, not the value it had:** the
  season must be read from `displayedSeasonOrProjection`, never assumed — the
  same currentOrRecentSeason trap `getPlayerProfile` set, in a new place.
  **Corrected 13 Aug (evening):** this note originally said the real views "must
  be asked for by code". They cannot be asked for here at all — see below.
- **The default column set is seven wide** — Rk, Status, Opp, FPts, FP/G, Ros,
  +/- — and carries no football stats at all. The stat columns live on
  `getTeamRosterInfo`, or behind `scoringCategoryType` ("5" Tracked, "1"
  Standard — and Standard is *not* a superset: it drops AF, PKM, OG and GAO).

Every cell is a pre-formatted string, with the usual damage: a literal `<br/>`
inside `"BOU<br/>Sun 9:00AM"`, a `<small>` tag in a waiver cell, and FP/G with
zero, one or two decimal places in the same column.

### The stat reads, probed to exhaustion (13 Aug evening) — the Players rehaul's whole scope

Fourteen anonymous probes, filed in `data/probes/2026-08-13/`. Between them they
deleted a week of planned work and settled how the Players tab is built.

**`getPlayerStats` will not serve a season total. At all.** Every spelling was
tried — `seasonOrProjection` with a YTD code, plus `timeframeTypeCode`,
`statisticsTimeframeType`, `timeframeType`, `statsType`, `statisticsViewTypeId`,
`timeStartType`, explicit `startDate`/`endDate`, a bare `SEASON_925`, an object
instead of a string, and `view: "FPTS"`. All fourteen answered 200 with a
projection. The tell is in the echo: ask for `SEASON_925_YEAR_TO_DATE` and it
answers `SEASON_925_PROJECTED_SEASON` whose name is the untranslated placeholder
`"2025-26 - ???type.statisticsTimeframeType.projectedSeason.shortName: en_US???"`
— a server-side fallback constructing a code it has no label for. **So asking is
not knowing, and the only honest column heading is the one read back off the
answer.** Whether it flips to real numbers once games exist is unknown and
resolves itself on 21 Aug; nothing needs rebuilding either way, because the page
already prints whatever season came back.

**`maxResultsPerPage` is honoured far past their own UI's twenty.** 1000 returns
all 708 rows in one request (533 KB) with `totalNumPages: 1`. The planned 36-call
pagination and the 37-call FPL season sweep are both deleted. `POOL_PAGE_SIZE`
sits comfortably above the pool and the read reports `totalNumResults` back, so a
pool that ever outgrows it says so rather than showing a prefix.

**`getTeamRosterInfo` is the real find, and it is public.** It *does* honour
`seasonOrProjection` — `SEASON_926_YEAR_TO_DATE` comes back correctly labelled
"2026-27 - YTD" — and `teamId` and `period` are honoured too. With `view: "FPTS"`
each player's total is broken into the league's own scoring categories, and they
**sum to it exactly**: verified on all sixteen rostered players, e.g. Martinez
109 = Min 63 + CS 28 − GA 11 + Sv 23 − YC 2 + PKS 5 + A 3. Games played sits on
the same row and is a count, not points, so it is excluded from the sum exactly
as their own table excludes it.

Shape notes that the mapper depends on:

- **Two tables, one per scoring group** (`scGroupScorerHeader`: "Goalkeeper",
  "Outfielder"), with **different columns** — keepers get CS/GA/Sv/PKS, outfield
  gets GAO. Flattening them would file a keeper's saves under an outfielder's
  goals-against. The same split `ScoringRules` already carries.
- **Columns are identified by `scipId`**, not by display label. The fixed columns
  (`opponent`, `fpts`, `fptsPerGame`) carry a `key` and the categories carry
  both; matching on "CS" would break the day Fantrax translates a header.
- **`header.cells[].name` publishes Fantrax's own definition** after a ` -- `.
  This is where their rules live, and the player card shows it on hover.
- **Empty roster slots are real rows** with real blank cells and no `scorer`.
- Cells are formatted strings: `"2,835"` for minutes, a bare `"-"` for a category
  a player never registered — which is absence, not nought.
- An undrafted league refuses with `pageError.code: "WARNING"`, "You cannot use
  this screen until there is at least one team in this league." The real league's
  state until 10 Oct, and an ordinary one.

**The season code is looked up, never written down.** Only `getPlayerStats`
publishes the list (`displayedLists.displayedSeasonOrProjections`, 35 entries),
so one cheap cached call learns it and the team reads use it. It is chosen by
`startDate`, not by list position and not by parsing the season number out of the
code — `seasonYear: 2026` maps to `926`, but inferring "subtract 1100" from two
data points is exactly the kind of invented rule §3 forbids.

### Fantrax's clean-sheet rule is published, and it is 60 minutes

Found in a column tooltip rather than by watching a match, which partly answers
the 21 Aug question before 21 Aug:

> **Clean Sheets On Field** — Awarded to a player who played at least 60 minutes
> and whose team gave up 0 goals during the time the player was on the field,
> even if a goal was scored after the player left the field.

So `CLEAN_SHEET_MINUTES = 60` in `join/cleanSheets.ts` matches their threshold,
and our preview is priced on the right rule. **One difference remains**, and it
runs in the safe direction: theirs is *on field*, ours is FPL's team clean sheet.
A defender substituted at 70' whose team concedes at 85' earns a Fantrax clean
sheet and no FPL one — so our preview will **undercount** him, never overcount.
What 21 Aug still has to settle is only *when* they credit it, not what they
credit.

### The two answers Craig gave (13 Aug), which close both open questions

**Their totals move during a match — with one exception.** Fantrax does not
credit a **clean sheet until the final whistle**, while FPL credits one the
moment a player passes the hour with his goal intact. So a defender can keep a
clean sheet for eighty minutes and Fantrax will still show nothing for it, which
is the single place their live number is behind what the match has actually
produced.

That exception is the **only** scoring this app does, and it is a preview rather
than a score: `join/cleanSheets.ts` prices the clean sheets currently being kept,
using the league's own CS values read from `getLeagueInfo` (D 4, M 1, keeper 4,
forwards 0 — identical in both leagues today, and still read rather than
assumed). It counts **only fixtures in play**: the moment one finishes, Fantrax
credits it and it lands in their total, so counting a finished match would show
the same points twice. It is shown beside their number, never folded into it.

This is why `scoringSystem` is finally modelled after months as `unknown` — the
work item said "model it when a view first explains a number", and this is that
view. Only the flat `pointsN` values are parsed; the banded expressions
(`"range1|59|1|NULL$60|90|1|NULL"` for minutes, saves, goals conceded) are left
alone because nothing reads them.

**Lineups lock on a deadline, not per game** — 15 minutes before the first
fixture of the period. So the existing gate's shape is right: one lock for the
whole period, not a per-player one, and the per-player visibility work that a
gametime lock would have forced is not needed. The 15-minute offset is a
commissioner setting that `getLeagueInfo` does not publish; `rosterPeriods`
starts at the period boundary, which is kickoff, so the lock sits *before* the
data we hold and cannot be derived from it.

### What this means for the scoring engine

The plan approved on 13 Aug built one, on the stated premise that Fantrax would
not serve us league points without a cookie. **That premise is false.** Fantrax
serves its own per-player points, a category breakdown that sums exactly, live
team totals and its own projections — all publicly, all per period.

So we go back to the doctrine that was already written here: *Fantrax computes
the points and its numbers are authoritative; we read them.* Reading beats
computing on every axis that matters — the real league scores five categories FPL
does not publish (`GKP`, `KP`, `CLRA`, `DFP`, `MP`), so our own engine could only
ever have produced a systematically wrong number for defenders, midfielders and
keepers, and would have had to say so on every screen.

What is genuinely still unknown, and decides whether any fallback is needed at
all: **whether these numbers move during a match or only settle afterwards.**
Nothing can answer that before 21 Aug. Until then we read, we label the season
we are reading, and we build no engine.

## Sign-in, and where env files actually live (13 Aug 2026)

Sixteen friends, no accounts. Each manager gets one code; the app remembers which
team is his. Not a dropdown, because that identity is what will authorize
*editing* a lineup once the write surface exists.

- `npm run team-codes` issues one code per team and prints them once. **Only the
  HMACs go into the deployment**, as `TEAM_CODES`, so a leaked `TEAM_CODES` hands
  nobody a code and a lost code is reissued rather than recovered. A leaked
  `SESSION_SECRET` does hand over a sign-in: it signs a cookie for any team.
- `SESSION_SECRET` keys those HMACs and, through a key derived from it
  (`HMAC(secret, "cookie")`, since 23 Sep 2026), signs the session cookie.
  Rotating it invalidates every code and every session at once, which is the
  correct blast radius and worth knowing before rotating it casually.
- The session cookie is `v1.<teamId>.<signature>`, httpOnly. Bumping
  `COOKIE_VERSION` in `sessionCookie.ts` signs everybody out. Verified server-side,
  then checked against the league we currently serve — so a rehearsal session
  stops working the moment `FANTRAX_LEAGUE_ID` changes on 10 Oct, with no
  migration and no stale highlight. Forged signatures, unsigned values and signed
  ids for teams that do not exist were all tested against the running app.
- A wrong code fails slowly on purpose. There is no rate limiter in front of a
  serverless route and sixteen teams is a small haystack, so the defences are an
  eight-character code and a deliberate pause.
- **Reading stays open.** The code buys *being* a team — partisan ordering, and
  later lineup writes — never access. Nobody is locked out because a code went
  missing on ship day.

### The env file is not where you think

`next dev` runs with its project root at `apps/companion`, so it loads
**`apps/companion/.env.local`** and completely ignores the `.env.local` at the
repo root. The root one is still real and still used — the capture and probe
scripts read it with `node --env-file` — so both exist and they are not the same
file. This cost a debugging cycle: the codes verified correctly in Node and the
sign-in kept refusing, because the server had never seen `SESSION_SECRET`. Next
prints `- Environments: .env.local` on startup when it has loaded one; **absence
of that line is the tell.**

Ship-day consequence: `TEAM_CODES` and `SESSION_SECRET` join `FANTRAX_LEAGUE_ID`
as dashboard values that are invisible to git, so all three are numbered steps in
the runbook.

## The `adminMode` probe, and why the rehearsal league cannot answer it (20 Aug 2026)

ROADMAP §2 is the question the whole write surface rests on: does the
commissioner's session let him write **another team's** lineup? The plan was to
answer it against the rehearsal league, "its four auto-drafted teams belong to
nobody". **They do not belong to nobody. They belong to the commissioner**, and
that makes the probe as designed incapable of answering the question.

### What the read-only probe established

Probed 20 Aug with the commissioner cookie, nothing written:

- **The cookie authenticates and carries commissioner rights.**
  `getFantasyTeams` answers, and `getCommissionerHubInfo` returns
  `commissioner: true` with a full item list.
- **`adminMode` is accepted and echoed.** `getTeamRosterInfo` with
  `adminMode: "true"` comes back with `displayedSelections.adminMode: true` for
  any team asked about. Encouraging, and on its own it proves nothing — see
  below.
- **The commissioner hub is real and server-driven.** Its link keys include
  **`COMMISH_TEAM_ADMIN`** and `COMMISH_TEAM_PERMISSIONS`, plus
  `COMMISH_ILLEGAL_ROSTER_OVERRIDE`, `MIN_MAX_OVERRIDE`, `STAT_OVERRIDES`,
  `STANDINGS_ADJUSTMENT`. Its `actionKey`s are `undoDraft`,
  `resetLeagueAndRosters`, `executeAutoSubs`, `processWaivers`,
  `waiveAllPlayers`, `recalculateFantasyPoints`, `deleteLeague`. There is also a
  `replaceOwner.go` URL.

  `COMMISH_TEAM_ADMIN` is the strongest evidence yet that Fantrax has a
  first-class "commissioner acts on a team" surface — which is exactly the thing
  option 1 needs. **A link key is not a probe**, though, and it is not recorded
  here as an answer.

  Worth noticing while reading that list: `deleteLeague` and
  `resetLeagueAndRosters` are available to this cookie. Anything that ever sends
  a commissioner action is one typo from a very bad afternoon.

### The confound, which is the actual finding

`getTeamRosterInfo` returns **`myTeamIds`**, and for this session it is all four:

```
myTeamIds: ["8enbgqo5msgb375j","sezrgvl2mshcpazf","pbxm9fgimshcpazf","j9zadacnmshcpazf"]
```

`getFantasyTeams` agrees — every one of the four reports `commissioner=true`.

So a write to any rehearsal team would succeed **because the caller owns it**,
and would tell us nothing whatsoever about writing a team he does not own. That
is a false positive, and it is the most expensive kind available here: it would
green-light the cookie flow, the member sign-in, and the whole write surface on
a premise that had never been tested.

The probe was therefore stopped before the mutating half. Not out of caution
about the rehearsal league — its teams genuinely are disposable — but because
the experiment as designed has no control.

### What would answer it

**A second Fantrax account holding one rehearsal team.** Then the commissioner
probes `confirmOrExecuteTeamRosterChanges` with `adminMode` against a team that
is provably not his, and the answer means something. The commissioner hub has
the machinery: `replaceOwner.go` and `COMMISH_TEAM_PERMISSIONS`.

That is a commissioner action and a second email address, so it is Craig's to
do. Until then §2 is **blocked, not open** — and the distinction matters,
because a blocked probe left looking open is how it gets "answered" in a hurry
on 9 Oct.

The real league cannot substitute: it has no teams until 10 Oct, and by the time
it has fifteen belonging to real people, writing to one to see what happens is
not a probe, it is an incident.

**Answered 28 Sep 2026: it writes.** See the next section.

## `adminMode` answered: the commissioner writes any team's lineup — probed 28 Sep 2026

Craig moved one rehearsal team, **Notemail** (`v6bxgqm5mtj31znh`), to a second
Fantrax account: the control the 20 Aug probe lacked. `myTeamIds` now holds 9 of
the league's 10 and Notemail is not among them. The request bodies below were
read from Fantrax's own client (`createTeamRosterApiCall`, `onSetAutoOrderSub`
and the commissioner hub's `execute`), not guessed.

### The lineup write, and its dry run

`confirmOrExecuteTeamRosterChanges` takes `{rosterLimitPeriod, fantasyTeamId,
daily: false, adminMode, confirm, applyToFuturePeriods, fieldMap}`. `fieldMap`
is **every rostered man**, `scorerId → {posId, stId}`: the slot's position id
(`704` G · `703` D · `702` M · `701` F) and status (`1` active, `2` reserve). A
move is a changed entry, and a change of position is the same man with a
different `posId`.

`confirm: true` is a dry run: it names what would change and whether the result
is legal, and saves nothing. Without `confirm` it saves. Every row below was
followed by a re-read of Notemail.

| Case | `adminMode` | Answer | Saved |
|---|---|---|---|
| D for D, XI ↔ bench | true | `CONFIRM`, two changes listed | no, dry run |
| the same | **false** | *"You cannot perform that transaction because you do not own the team **Notemail**, however you can turn on **Commissioner Mode**"* | no |
| Belloumi F → M | true | `WARNING`: *"The maximum number of **5** **M** position(s) on your roster will be exceeded."* | no, dry run |
| a D benched for an M (D 2) | true | `WARNING`: *"The minimum number of **3** active **D** position(s) will not be met."* | no, dry run |
| D for D, executed | true | `CONFIRM`, `textArray.model.changeAllowed: true` | **yes**; read back, reverted, read back identical |

So the commissioner's session **writes a team it does not own**, and `adminMode`
is what lets it.

### Fantrax will save an illegal lineup

An illegal dry run is a `WARNING` carrying `illegalRosterMsgs[]` under *"Your
roster will be illegal … Click **OK** to execute the changes anyway."* So a save
that sends it anyway gets it. Refusing is ours to do: a save refuses any
`fieldMap` whose dry run carries an illegal message.

**The Belloumi case broke a rule the planner did not know**: the most a SQUAD may
hold at a position, bench included and counted by slot (rehearsal D5 · M5 · F3 ·
G2). `getLeagueInfo` does not publish it; `roster-limits.json` has held it as
`maxTotal` since 21 Sep with nothing reading it.

### The bench order is a second write

`getTeamRosterInfo.miscData.autoSubOrderMap` is `scorerId → rank`, with
`autoSubsOrderingType: "USER"` and `autoSubOrderMax: 6`. Their client writes it
with `setAutoSubsOrder({teamId, period, adminMode, autoSubOrderMap})`, answered
`{success}`. Notemail's map is `{}`: no order set. Not yet written by a probe.

### The three commissioner actions the scripts need

`executeCommissionerHubAction({actionKey, …form})`, answered `{ok, message,
redirectUrl}`. None was called.

- `waiveAllPlayers`: no form, `destructive: true`. *"All free agents will be sent
  to the waiver wire as of now, and players already on waivers will be
  re-waived."*
- `executeAutoSubs`: form `{period, undo}`. *"Run automatic substitutions for a
  specific period. Useful when rules have changed or something needs to be
  re-run."*
- `processWaivers`: form `{}`; its `processDate` is offered to Fantrax staff only.

The same method carries `deleteLeague` and `resetLeagueAndRosters`, so a caller
picks its action from a fixed list and never passes one through.

### Another team's pending claims cannot be read

`getPendingTransactions({txType: "CLAIM", teamId})` answers for **one of the
caller's own teams whatever `teamId` says**: Notemail's id, `"ALL"`, with and
without `adminMode`, in rehearsal and in the real league. Craig changed a league
setting on 28 Sep; the real league's `allowGroupChanges` went `true` and its
"Premium League Required" message went, but `showAllTeamsChoice` stayed `false`
and the answer stayed The Raccoons. **Blocked** until something turns
`showAllTeamsChoice` on.

The real league, `mqsjd23smsgbiqzr`, has seven teams on 28 Sep, six of them other
people's. Nothing above was sent to it but reads.

### Re-probed 1 Oct 2026 off the page itself, and Mail links out instead

Craig asked for pending moves in Mail, with `…/{leagueId}/transactions/pending`. That page sends one fxpa batch,
`getPendingTransactions({leagueId})`. Its two tabs add `txType: "CLAIM" | "TRADE"`, its team picker adds `teamId`,
and the picker's "All Teams" sends **`teamId: "ALL_TEAMS"`**: the 28 Sep probe tried `"ALL"`. fxea has no such
method. Reads only, with the commissioner's cookie where marked:

| | dummy | rehearsal | real |
|---|---|---|---|
| no cookie, any body | `NOT_MEMBER_OF_LEAGUE` | `NOT_MEMBER_OF_LEAGUE` | `NOT_MEMBER_OF_LEAGUE` |
| cookie, `ALL_TEAMS` | **every team**: 3 claims, all test2's | his own team | his own team |
| cookie, another team's id, or `ALL_TEAMS` with `adminMode` | (he owns all ten) | his own team | his own team |
| `miscData.showAllTeamsChoice` | `true` | `false` | `false` |
| his teams (`myTeamIds`) of the league's | 10 of 10 | 9 of 10 | 1 of 9 |

So the whole league's pending moves are readable only where one account owns every team, which is the dummy league.
For 8 of the 9 real managers, nothing the server holds can read their own claims either. **Mail links to the served
league's page** (`FANTRAX_PENDING_PATH`) rather than showing one manager in nine his moves and the rest nothing.

The populated shapes, which the 21 Sep note could not see:

- **Claims**: one team's in `tables[]`, every team's in `tablesPerTeam[{key: teamId, value: tables}]`. A table is
  `claimType` (`WAIVER_WIRE`), `processDate` ("Fri Oct 2, 10:00 AM BST") with `processDateRaw`, and `txSets[]`:
  `claimScorer` and `dropOrMoveScorer` (full scorers), `dropOrMoveTxType` `DROP`, `priority`, `group`,
  `dateSubmitted`, `toPositionName`, `toStatusName`. Empty is `noResults: true` and no `tables`.
- **Trades**: `tradeInfoList[]`, real 1 (eight draft picks, The Raccoons and one other team): `status` "Pending
  Acceptance", `creatorTeamId`, `usefulInfo[{name, value}]` (Proposed, Proposed by, To be executed, Awaiting
  acceptance from) and `moves[]{from.team, to.team, type: "TRADE", draftPick{year, round, pickNumber}}`.
- `getLeagueHomeInfo.pendingTransactions.pendingTransactionSets[]` carries the same sets more thinly
  (`statusDisplay`, `typeCode`, `transactions[]{type.code, scorerId, sourceTeamId, destinationTeamId}`), and is
  cookie-only too.

### The trade block, and trade proposals, read as the commissioner (7 Oct 2026)

Craig asked for the trade block in everyone's Mail and a banner for an offer. Reads only, with his cookie, off the
SPA's own bundle.

- **`getTradeBlock` (singular) is the editor, not the block.** It answers the caller's own picker: `scorerListForOffered`
  is his 14 men, `scorerListForWanted` the other 140 rostered, with no owner and no flag. The dummy probe of 21 Sep
  read it as "who is on offer"; it is who COULD be. Its save is `saveTradeBlock {func: "saveAll", …}`, which sends
  Fantrax's own alert to the league.
- **`getTradeBlocks` (plural) is the league's block**, the call `/transactions/trade-block` makes
  (`chunk-IJUVPJCK.js`). Cookie only (`WARNING_NOT_LOGGED_IN` without). `tradeBlocks[]` per team: `teamId`,
  `lastUpdated {date: epoch ms}`, `comment {body}`, and up to six lists, `scorersOffered`/`scorersWanted`
  (`{title, scorers: {posId: [scorer]}}`), `positionsOffered`/`positionsWanted` (`{title, positions: [posId]}`) and
  `statsOffered`/`statsWanted` (scoring categories, not read). Empty in all three leagues until Craig put Haaland on
  The Raccoons' block in the real league at 17:42 BST, which is the fixture.
- **Position names are `getRefObject {type: "Position"}`**, public: 14 ids, 701 Forward, 702 Midfielder, 703
  Defender, 704 Goalkeeper. `getLeagueInfo`'s scoring configs name only the three outfield ids.
- **Trade proposals ARE readable**, which the 1 Oct section above did not find:
  `getTransactionDetailsHistory {view: "TRADE", executedOnly: false}` with the cookie answers 36 rows in the real
  league where the anonymous read answers the 8 executed ones (Craig's link:
  `…/transactions/history;view=TRADE;adminMode=true;executedOnly=false`; `adminMode` changes nothing). Each row adds
  `resultCode` and `result.content`: `TRADE_CANCELLED` 22, `TRADE_REJECTED` 6, `EXECUTED` 8. Every set involves The
  Raccoons, Craig's team, so whether a proposal between two other teams shows is unproven; Craig says the
  commissioner's page shows it. A pending proposal's code is not yet seen.

## A Fantrax points figure per man per MATCH is a capture, not a read (4 Sep 2026)

Asked because a match screen wanted one. Counted against FPL fixture 11's **32**
participants, in the dummy league, period 2 — and period 2 is gameweek 2 exactly,
measured with `periodGameweeks` against live kickoffs for all three leagues
rather than assumed from the numbers matching.

| Read | Answers for | What it answers with |
|---|---|---|
| `fetchLiveScoring` → `mapLivePlayerPoints` (wired, used by `scoreboard.ts`) | **6 of 32** | a **PERIOD total**, ACTIVE slots only |
| `getPlayerProfile` → `recentGames` | **32 of 32** | a true per-match figure, free agents included |
| FPL `/event/{gw}/live/` `explain[]` | **32 of 32** | FPL's own per-fixture points, exact |

Three things this settles.

**The wired read is not a match figure and cannot be made into one.** 12 of the
32 were rostered at all and only 6 were ACTIVE; a RESERVE who played 90 minutes
has no key in `statsMap` at all — an absence, not a nought. And a period total
equals a match total only while a period holds one gameweek, which is true today
for all three leagues and is not a property anybody promised.

**The complete Fantrax answer costs 32 requests.** `recentGames` is one player
per request and Fantrax's own limiter fired within roughly thirty back-to-back
calls (`"You're viewing player profiles too quickly"`), clearing once paced. So
it belongs in a paced capture writing a data file, the way `npm run capture`
already works — never in a page render. **Not built.**

**`mapPoolStats`, `mapTeamStats` and `mapPlayerStats` have no per-match
dimension at all** — season-to-date or season-projection, whole pool or one team,
with no `period` or fixture argument on either endpoint. Do not re-derive.

Past periods DO return settled data: `dummy` periods 1 and 2 both answer
`allEventsFinished: true` with 110 and 106 ACTIVE entries. The **real** league
answers 0 for both, with one synthetic `"-3"` (`LG_AVG`) key and an empty
`statsMap` — Fantrax's placeholder for a league with no teams, not a refusal, and
the same underlying fact as `getTeamRosters`' `NO_TEAMS`.

## FPL's fixture list carries a whole scoresheet nobody was reading (4 Sep 2026)

`GET /api/fixtures/` returns a **`stats` array on every fixture** and `raw.ts`
did not model it, so `seasonFixtures()` — a read the app already makes on eleven
call sites — was fetching and discarding three quarters of a match screen on
every page view. Counted across all 380 fixtures:

| | |
|---|---|
| identifiers on a finished fixture | **11** — `goals_scored`, `assists`, `own_goals`, `penalties_saved`, `penalties_missed`, `yellow_cards`, `red_cards`, `saves`, `bonus`, `bps`, `defensive_contribution` |
| on an unstarted one | `stats` is `[]` — an **empty array**, not eleven empty identifiers |
| shape | each identifier is `{h: [{value, element}], a: [...]}`, so the SIDE is stated and not derived |
| `element` | FPL's **per-season id**, never the code |

**The `bps` sub-block is exactly the appearance list.** Fixture 11 of gameweek 2:
32 distinct elements under `bps`, 32 players with `minutes > 0` in
`/event/2/live/`, no misses and no false positives. So who played is derivable
from a 26 KB read, and `minutes` is the only thing the fixture list does not have.

**`bps` is SIGNED.** 47 of the season's 616 entries were below nought, floor −14,
and **not one was exactly nought**. A filter written `bps > 0` silently drops the
five worst players in a match; a column that paints −8 amber is calling a loss a
measurement. `--color-bad` is the slot.

### Why it is a per-ROUND read and not a season one

Three measurements, and each rules out the obvious alternative.

**The season read grows past the bootstrap.** `/api/fixtures/` is 183 KB today
with 20 of 380 populated. A finished fixture is 2,938 bytes against an unstarted
one's 342, so all 380 finished is **~1.1 MB by May** — and `seasonFixtures()` is
read on the paper's front page (`app/tables.ts`) and on `/matchday`.

**A second cached read of the same URL costs a second request.** Next treats
every fetch inside `unstable_cache` as `force-no-store` (`patch-fetch.js`), so
the Data Cache does not dedupe it; React's request memoization is per render pass
while the two entries go stale independently. And `unstable_cache` stores
`JSON.stringify` and re-parses on every hit, so folding sheets into
`seasonFixtures` would put a megabyte parse on both of those pages.

**`?event=N` is 26 KB and a played round never changes again** — the same
lifetime argument `gameweekSnapshot` already makes for staying out of
`footballNow`. `gameweekSheets(gw)` in `app/football.ts`.

The score, `status` and `settled` still come from `seasonFixtures` and nowhere
else: two independently cached reads of one URL can disagree.

### What FPL does not publish anywhere, checked

**No minute for a goal** — not the fixture list, not `/event/{gw}/live/`'s
`explain`, not `element-summary`. No line-up, no formation, no possession, no
shots, no corners, no referee, no attendance. All of it is in the sister repo and
lags full time by about a day; `scripts/export/epl_draft_intel.py` now writes a
fourth file for it (`matches/{season}.json`), which is not read by the app yet.

**Four more files are specified and not yet written**, on Craig's call of 5 Sep
2026 to connect the projections and the pitch maps before 10 Oct:
`eye-test`, `events`, `positions` and `projections`. The contract — row shapes,
the code key, normalised event coordinates, the 96-cell heat grid, size caps, and
what is deliberately NOT exported — is `docs/providers/intel-export.md`, written
for the sister-repo session to build against. Two things it settles that would
otherwise be re-litigated: **pass maps are out** (the FotMob builder is dead for
26-27 and 380 raw match directories go unread), and **`role_cluster_label` is
refused** as a displayed role.

**SofaScore files an own goal as a plain `goal` event with no flag.** Verified
across all 20 logged 26-27 matches: 17 name only men FPL also calls scorers, and
the three that do not name Lindelöf, Donnarumma and Greaves — exactly the three
in FPL's `own_goals` lists. A screen trusting that feed alone would print an own
goal as a goal for the wrong side. FPL's block is the discriminator.

## A streamed 404 answers 200, by design — probed 3 Sep 2026, do not re-derive

Six routes answer `200` to a URL that does not exist, and two answer `404`. It
looked per-route and arbitrary. It is neither, and the rule is exact:

**Every route with a `loading.tsx` answers 200; every route without one answers
404.** Eight of eight, checked against a production build:

| 200 | 404 |
|---|---|
| `/prem/club/[code]` · `/gw/[gameweek]` · `/players/[fantraxId]` · `/squad/[teamId]` · `/league/matchups/[teamId]` · `/paper/[slug]` | `/prem/match/[id]` · an unmatched URL (`/prem/player/[code]` was the eighth, removed 26 Sep 2026) |

**`/prem/match/[id]` grew two tabs on 4 Sep 2026 and deliberately did not grow a
`loading.tsx`**, which is the first time this rule has been applied rather than
observed. It has one slow read — Fantrax, for the owner names — and that goes
behind `<Suspense>` with a local skeleton instead, the way the player screen
streams its blocks. So the route keeps a true 404 and pays nothing for it.

Next's own docs say so in as many words (`next/dist/docs/01-app/03-api-reference/
03-file-conventions/loading.md`, "Status Codes"): a `loading.tsx` is a Suspense
boundary, the response body starts streaming when its fallback renders, and the
headers — status line included — have gone by then. `notFound()` thrown after
that point cannot change the status.

**The crawler half is already handled and the plan's premise for "fix it" was
wrong.** Next injects `<meta name="robots" content="noindex">` into the streamed
HTML precisely for this case — verified present on all five of our soft 404s. So
these are not pages "crawlers and link checkers believe"; they are pages crawlers
are explicitly told to ignore. What is left seeing a 200 is `curl -I` and
analytics, which is a real but small cost.

**The documented fix is one we should not take.** Next says to check existence in
`proxy` before the body streams, and in the same breath says to keep proxy checks
fast and avoid fetching content there. Our checks are `footballNow()`,
`seasonFixtures()` and `getLeagueSquads()` — the whole point of the check is the
fetch. Moving them into a proxy would put our two provider reads in front of
every request in the app to fix a status line on six.

So the status codes stay as they are. **What was actually wrong was what the
reader saw**, and that is fixed: see below.

### The desk had no `not-found.tsx` until 3 Sep 2026

`(paper)/not-found.tsx` is scoped to its route group, so every refusal outside it
fell through to Next's built-in page — `404` in Vercel's system font beside a
hairline rule, drawn over our stadium photograph, inside our rail, between the
section plates. DESIGN §1 gives this app two registers; that was a third, and the
one a reader meets on the day something is wrong. `app/not-found.tsx` is the desk's
own, on `error.tsx`'s shape.

Both refusal pages now sit on a `.cm-panel`. Neither did, and both were printing a
headline and a paragraph straight onto the photograph — which is the one rule
`PhotoGround` exists to keep and `tools/ui/groundfit.mjs` measures, and neither
page is in that tool's route list because neither can be reached by URL.

### `next dev` and `next build` share `.next/` and will lie to you

The first production check of the new page reported Next's default 404 while
`.next/server/app/_not-found.html` on disk plainly contained ours. The dev server
was running against the same directory. `rm -rf apps/companion/.next` with dev
stopped, rebuild, and the page appears. Worth an hour to anyone who does not know
it: **stop `next dev` before trusting a `next start`.**

## The touch cloud ships raw, and the export contract is amended (10 Sep 2026)

**Recorded because it is a deliberate exception to a written contract**
(CODE_RULES: exceptions go in this file in the same commit).
`docs/providers/intel-export.md` §3 specified a **12 columns x 8 rows = 96-cell**
touch grid and said in as many words that *"the raw point cloud never ships"*.
`data/intel/touches/26-27.json` is the raw cloud. Two measurements overturned the
section, and both are about ONE season rather than about the archive.

**A finer grid is noisier, not smoother.** Craig's complaint was *"heatmaps are
rough squares"*, and 12 x 8 drawn literally is exactly that — but the fix is not
resolution. The busiest player in the league has **414 touches all season**, so a
32 x 20 grid gives him under one touch per cell and a finer grid is a noisier
one. Smoothness has to come from a KERNEL, and a kernel wants points. The app
bins at 24 x 16 and blurs at 2.0.

**The cloud is SMALLER than the grid it replaces.** 45,244 points as flat
alternating integers is a **291 KB** file, against 0.78 MB for a dense 24 x 16
grid and 1.31 MB for 32 x 20. The contract is right that every byte in
`data/intel` is baked into the bundle; it was wrong that aggregating saves any.
It also makes a per-fixture filter free, which a season-aggregated grid cannot do
at any resolution.

**The rule still holds for the ARCHIVE.** The 3 Sep backfill added 5,418 raw
heatmap files across all seasons, and none of them belong here. It is a rule
about the archive rather than about one season, and the amendment says so.

Three further corrections ride with it, all counted the same day:

- **`match_provider_map("sofascore", "fpl_fixture")` returns nothing for any
  season**, so the fixture join the contract names does not work. The route that
  does is `data/match_logs/{player,team}_match_log/` — the team log's
  `player_heatmap_paths` lists each match's per-player files, the player log
  carries `fpl_fixture_id` and a `provider_player_ids` pairing SofaScore's id
  with FPL's element, bootstrap turns that element into the code. `export_matches`
  already reads the same file, so the two cannot drift.
- **Both sides' team rows list every player in the match.** A path arrives twice
  and appending twice doubles a man's touches — 90,488 against the 45,244 that
  exist. Caught by counting the output against an independent count of the input,
  not by reading the code.
- **The `kind` vocabulary in §2 was aspirational.** Only `shot` is buildable:
  nothing we hold has located defensive actions, `defcon` is per-match counts
  plus one average position, and SofaScore's raw match directory has no
  per-action event stream at all.

## A density ramp is the app's first sequential scale, and it wants a ruling (10 Sep 2026)

`compare/PlayerMap.tsx` shades a heat map through a four-stop yellow-to-red ramp.
**docs/rules/DESIGN.md does not have a slot for this and the question is open.**

§3's rule is that every colour is a slot with one meaning, and `--color-hot` /
`--color-cold` are deliberately a **threshold rather than a scale** — *"a cell is
lit or it is not; there is no second strength"* — confined to a board of many
measures. A density ramp is a scale by definition, so it cannot wear them.

What was tried first and failed: **the club's own colour at varying alpha**, on
the reasoning that the bar above already codes each man that way, and that
opacity is not a colour slot so no new token was needed. It was drawn and it did
not work. Manchester City's sky blue on green turf is very nearly nothing, so the
map was legible for Chelsea and blank for City — a picture whose readability
depends on who is in it. And the colour was doing no work anyway: the maps are
SEPARATE pitches with the man's name over each, so identity is carried by the
caption, and club colour was spending the one visual channel a density map has on
a fact already stated.

Held to the narrowest scope until it is judged: it shades a **colour plate**,
which is DESIGN §5's own category and where the pitch and the crest already live,
and it never touches ink, a table cell or a control. The ramp is four literal
values in the component rather than tokens, precisely so that promoting it is a
deliberate act.

## Twenty ground photographs, hunted rather than generated (11 Sep 2026)

**The choice was Craig's and it was the expensive one.** Offered generated crowds
in club colours, generated stadium scenes, or real photographs hunted off
Wikimedia Commons, he took the third. It costs twenty manual picks and an
attribution surface the app did not have; it buys pictures that are actually the
grounds.

**The hunt is not in the tree and does not need to be.** It ran once out of the
scratchpad: query Commons for each club's category and a few search terms, filter
to free licences, landscape, 1400px or wider, build a contact sheet per club, pick
by eye. What is committed is the RESULT — the files under
`apps/companion/public/ground/clubs/` and the table in
`packages/core/src/football/grounds.ts`. Re-running it is a fresh hunt, not a
build step.

**Three categories are traps and cost a whole first pass.** `Category:Anfield` is
a DISTRICT of Liverpool (twelve terraced houses, no stadium), `Category:Elland
Road` is a ROAD (four photographs of the Old Peacock pub), and `Category:City
Ground` without its town is a disambiguation that lands on Nottingham's Guildhall
and a Pride parade. The stadiums are `Anfield Stadium`, `Elland Road Stadium` and
`City Ground, Nottingham`. A fourth, `City of Manchester Stadium`, is real but
dominated by the 2002 Commonwealth Games — the Etihad came from a free-text
search instead.

**Commons rate-limits hard and answers a missing `action` with HTML.** 429s
arrive within seconds of a burst and carry a `Retry-After` of 10-35s; honour it,
sleep 2s between calls, and persist after every club so a run resumes. Separately:
omitting `action=query` returns the API help PAGE with status 200, which parses as
"Unexpected token '<'" and looks like a network fault. And `upload.wikimedia.org`
throttles full-size originals far harder than the thumbnail service — ask
`/thumb/<path>/1920px-<name>` for the width you actually want. Note the API's
`thumburl` comes back at a rounded bucket (500px when you asked for 480), so a
rewrite must match `\d+px-` rather than the width requested.

**Licences, counted:** 11 CC BY-SA (2.0/3.0/4.0), 7 CC BY (2.0/3.0), 2 CC0. All
require or tolerate attribution; every one names an author and links its terms,
and `grounds.test.ts` fails the build if one does not. Attribution is at
`/credits`, linked from the rail's foot and the phone drawer — a credits page
nothing links to would satisfy neither licence.

**No rugby, and that was a correction.** The first pass filed Everton's Hill
Dickinson Stadium and Leeds' Elland Road as rugby league fixtures, because
Commons' best crowd shots of both grounds are exactly that. Craig, same day:
*"everton leeds dont share rugby stadiums. elland roand and hill dicky"* — the
point being that these are football grounds that occasionally host rugby, so a
photograph of rugby on them says the opposite. Both are now football: Elland
Road's East Stand under its "Marching On Together" banner, and Hill Dickinson
Stadium from the Mersey with its own name on the facade. Everton is the thin one
— the ground opened in 2025 and Commons holds almost no football of it, so the
choice was that exterior or a construction site.

**Three clubs have no people in the picture, and each for its own reason.**
Sunderland: the only populated shot of the Stadium of Light is a stand full of
Newcastle supporters, and Craig kept the empty one over that. Everton and Leeds:
see above — the populated shots are the rugby ones.

**The ground is 7.3 MB of repo, not of page.** Twenty files at 1920px on the long
edge, quality 75, native aspect kept — `object-cover` across a portrait phone
crops a 16:9 master to ribbons, where a 4:3 original survives it. `next/image`
re-encodes for delivery, so the master's weight is a git cost only.

## Replacing a file under `public/` leaves `next dev` serving the old one (11 Sep 2026)

**A screenshot will lie about it, and lie consistently.** Swapping
`public/ground/clubs/LEE.jpg` for a different photograph at the same path, then
shooting the page, gave a capture **pixel-identical** to the one before the swap —
mean absolute difference 0.00/255 — across a fresh browser profile with a cold
cache. The file on disk was right, and `curl`ing
`/_next/image?url=%2Fground%2Fclubs%2FLEE.jpg&w=828&q=75` returned the NEW
picture, so every check short of the page itself said the swap had worked.

What holds the old one is `apps/companion/.next/dev/cache/images`. Deleting that
directory and re-shooting moved the page by 4.12/255. It is a cache and it
self-heals, so `rm -rf` on it is the fix; it was 12 MB when this happened.

**The reason it is worth writing down is the failure mode, not the remedy.** The
URL does not change when the bytes do, so nothing invalidates and nothing errors —
and `/shoot` is the instrument this repo trusts to settle what a screen looks
like. An asset swapped in place is the one case where it can be confidently wrong
twice in a row. Clear the cache before believing a capture of a replaced image.

## `MatchStats`' shape has a second wearer, and it stays duplicated (11 Sep 2026)

`league/CategoryCompare` is `prem/match/[id]/MatchStats` again: the same
`[3.25rem_1fr_3.25rem]` grid, the same `cm-index` figure plates, the same
`max-w-2xl` cap and the same argument for all three (`cm9900/22.jpg`). It was
copied rather than extracted, which is CODE_RULES §1 — **two occurrences are a
coincidence**.

Recorded here so the THIRD one does not copy it a third time. What actually
differs is what a row IS: one is Opta's counts for a single football match, the
other is our league's scoring categories summed over fifteen men a side, off a
different provider with a different absence rule. What is shared is the geometry
and the two-figures-round-a-label grammar.

## `.cm-index` ink cannot be overridden by a call site, and one already tries (11 Sep 2026)

`desk.css` declares `.cm-index { color: var(--cm-index-ink, var(--color-ink)) }`
**unlayered**, while Tailwind's utilities are layered — so a `text-*` on a
`.cm-index` plate does nothing, silently. That is DESIGN §2's "a plate owns its
ink" enforced by the cascade rather than by discipline, which is the right way
round.

Found by writing one: `CategoryCompare` shipped for an hour with
`value < 0 ? "text-bad" : "text-cream"` and measured **8.83:1 cream on all twelve
figures**, deductions included. Removed, and a deduction is carried by its minus
sign.

**`prem/match/[id]/MatchStats` has the same dead ternary** — `percent ?
"text-info" : "text-cream"` on its own `.cm-index` figures, with a docblock
claiming cyan for a derived reading on DESIGN §3's authority. Left alone rather
than fixed in an unrelated commit. Note the size utilities are the exception and
do work: `@layer components` carries `.cm-index`'s `font-size` for exactly that
reason, and `news/page.tsx` is the site that proves it.

## The lineup gate now covers a per-category board, not just an eleven (11 Sep 2026)

`/league/matchups/[teamId]`'s Stats and Players tabs are built from
`squadLivePoints`' breakdown, and a category figure **names a man in the
eleven** — the exact fact the gate withholds before a deadline. Both are built
behind `teamDisplay(squads, mine).show === "lineup"`, on the same branch as the
grass, and a withheld side draws the `Withheld` panel on every tab rather than an
empty board. Said here because "the gate is about the pitch" is the easy reading
and it is wrong: it is about anything whose existence states who is active.

`SquadLists` — the unplayed-round branch — is the same rule from the other side:
it draws `squadUnarranged`, which sorts alphabetically within position so even
the payload order cannot leak who starts.

## `pitchfit` measured half the object (11 Sep 2026)

It read `.pitch`'s own bottom, so it reported the head-to-head board **100px
clear** on a 390 phone where all four reserves were below the fold. The bench is
a sibling of the pitch inside `.pitch-with-bench` and is the last element of the
height-budgeted block, so it and not the grass is what has to clear.

Two corrections in the same commit:

- Where a bench is drawn, `ends` is ITS bottom; the grass's own is printed
  beside it.
- `querySelector(".pitch")` took the FIRST pitch in the document, and the
  head-to-head renders four and hides two per width (`lg:hidden` /
  `hidden lg:grid`). At 1024 and 1440 it measured a `display: none` node and
  reported a pitch 0px tall clearing the fold by the whole screen. It takes the
  first pitch with a height now.

The walk also opens `/league/matchups/[teamId]`, discovered off the matchups
board — DESIGN §9 makes it the reference page for the grass and this instrument
had never opened it.

**The budget itself did not move.** `--pitch-page: 26.5rem` was right; what was
wrong was a 44px provenance banner above the scoreline, and removing it is what
made the bench fit. Re-measured: 164px clear at 390, 150 at 768, 121 at 1024 and
1440.

## `.cm-tab` vs `.cm-tab-quiet` is a fact about the SCREEN, not the control (11 Sep 2026)

`ViewToggle` became a blue tab strip on 11 Sep and immediately drew two
full-height strips on `/squad/[teamId]` — the five-plate team strip above and
Pitch/List below it, both 56px on a desk, neither ranked. That is precisely the
thing `.cm-tab-quiet` was added for on 10 Sep.

So the modifier is a prop (`quiet`) rather than a property of the component: the
head-to-head carries no other strip and its four plates ARE its strip, while the
squad and club boards already have one. A control cannot know this about itself;
only the screen can.

**And the app's one recorded tap exception went with it.** The Pitch/List toggle
was `min-h-9` at every width; `.cm-tab` is 44 under a thumb and 56 above `lg`, so
the exception stopped existing. `docs/rules/PRODUCT.md`'s list is two now, and
`tools/ui/tapfit.mjs` lost its `[role=group]` exemption — left in, it would have
gone on excusing a structure that no longer needs it and would not have caught
the next shrink.

## Where a newsroom persona lives — voice, check, agent or skill (17 Sep 2026)

Written before Phase 6 commissions anything, because the discipline problem is
§1: twenty columnists is exactly the bloat the rules forbid.

| | Does | Lives in | Costs |
|---|---|---|---|
| **Voice** | *writes* | `scripts/edition/voice/` | a model call per firing |
| **Check** | *refuses or warns* | `packages/core/src/gazette/` | nothing — pure and tested |
| **Agent** | *judges* | `.claude/agents/` | nothing on the cron; a session dispatches it |
| **Skill** | *a ritual a human starts* | `.claude/skills/` | nothing until run |

**The corollary is the load-bearing half: a new persona is a VOICE only if it
FILES.** A "sub-editor" that reads the paper back is an agent. A "fact-checker"
is a check. Neither earns a `StoryKind`, a byline or a slot in the running order,
and giving one a voice puts a model call on every firing for something a pure
function or a read-only agent does for nothing.

The survey behind this: 161 catalogued subagents with zero journalism agents, and
the largest journalism skill collection (63 skills) has no sports, no page
layout, no house-style enforcement and no publication prose. Nothing off the
shelf fits, so everything is commissioned — which is exactly when a rule about
what may be commissioned is worth having.

Worked example, same day: the banned-list fix. It refuses and retries, so it is a
CHECK (`banned()` in core, pure, seven tests) plus the copy it sends back
(`sendBack` in `voice/house.ts`). It is not a "sub-editor persona", it files
nothing, and it has no byline.

## Replaying a played round — `REPLAY_AT` (21 Sep 2026)

**The Live tab exists only while a round is running**, so for most of the week
it is the one screen nobody can open, let alone work on. Set `REPLAY_AT` in
`apps/companion/.env.local` to an ISO instant inside a round that has been
played and the app IS that minute — fixtures rewound, the wire filled to that
second, the LIVE dot burning.

```
REPLAY_AT=2026-09-19T18:00:00Z   # 7pm Saturday, GW5 nearly done
```

Restart `next dev` after changing it: Turbopack will not re-read a `.env.local`
that a long-lived server already loaded.

**Where the parts are.** `packages/core/src/football/replay.ts` is pure and
holds the two functions — `roundAt` names the gameweek an instant falls in,
`rewindRound` puts that round back to it. `apps/companion/app/clock.ts` is the
one door every clock read at the app edge goes through; `footballNow()` in
`football.ts` is what decides to rewind.

**It cannot leak, and there is no flag to remember to turn off.** Nothing sets
`REPLAY_AT` in Vercel or in Actions, so a deployed build behaves exactly as it
did before this existed. A string that is not an instant THROWS rather than
falling back to today — a replay that silently serves the live app is the one
failure that makes every screenshot taken of it wrong. The app also wears a
`REPLAY · <when> · NOT LIVE` strip on every tab whenever it is on.

**Three things it does NOT reproduce, so do not read them as bugs.**

- **Fantrax's side is not rewound.** `getLiveScoringStats` answers the period's
  totals as they stand today, so the head-to-head shows full-time numbers under
  a scoreline that is mid-afternoon. Only the FOOTBALL layer has a per-minute
  record to rewind from; the league layer has none, and inventing one would be
  a confident wrong number.
- **A fixture whose scorer the bridge cannot place shows dashes while it is
  live.** Counted on gameweek 5: 1 goal in 27, which is one fixture of ten. The
  score is null rather than one goal light (DESIGN §7), and it comes right the
  moment that fixture passes full time, because a finished fixture keeps the
  provider's own score.
- **Bonus and `dataChecked` are today's.** The ladder below full time is read
  off the snapshot as it stands, not as it stood.

**A match holds the clock for 115 minutes** in the rewind — two halves, a
fifteen-minute interval the match clock does not count, and enough stoppage that
nothing is still live at the whistle. Named constants in `replay.ts`; the
Premier League publishes no interval length and FPL publishes no clock at all.

## The attribute grid rates by role on last season, and #127's stats league is not its source (30 Sep 2026)

Craig: *"fernandes having no work rate, haaland not top for finishing. maybe we need to judge
against all outfielders who actually play"*. Counted first (Fernandes Work Rate 4, Haaland
Finishing 16), and the cohort alone moved neither: the measures were the fault.

- **Cohort by role:** keepers against keepers, outfielders against every outfielder who
  plays; a third of the season's most minutes counts as playing. Rankings and the fixture
  run's places stay within the position group.
- **Sample:** 25/26 when he played that third of it, else 26/27. Running is 26/27's only.
- **Source:** the sister's `lines/{season}.json`, off its player log, which holds both
  seasons. The Fantrax stats league (#127, merged as #188) holds only this one, so it is not the
  grid's source; its daily capture still runs and nothing on screen reads it, which is Craig's
  call to keep or retire.
- **What reads wrong gets changed, not kept:** Consistency, Teamwork, Handling and Technique
  each put a star at or near the bottom on its first measure; three were re-sourced and Technique dropped.
  `docs/ui/player.md` names each row's source.

## The dummy league is the stats league, and its counts are a capture (26 Sep 2026)

`w05aib75mtj36y1g`, recorded as `dummy` and named "ALLPOINTS" in Fantrax, enables every
category at no points, so `getPlayerStats` by position group answers **77 scoring columns for
601 outfielders and 19 for 86 keepers** (26 Sep 2026). `recorded.json` names it with
`"stats": "dummy"`; `npm run stats` reads it once a day into `data/intel/stats/26-27.json`.

- **A column is its `scipId`'s stat id**, `5010#6120#-1` → `6120`. The short names repeat
  (`CS` twice, `CF` twice) and the id does not; the id is the same in both groups.
- **Stored in football terms, keyed on FPL code.** The keys, labels and kinds live in
  `packages/core/src/football/intel/statKeys.ts`, so the football layer types what it reads;
  which Fantrax id fills which key is `scripts/stats/columns.ts`, the only place the two meet.
  (The 25 Sep plan put the whole vocabulary in the script; typed keys in core replaced that.)
- **Only men with minutes are stored**: a miss is no reading, and prints `—`.
- **One source per figure per screen.** Fantrax's tackles are never printed beside FPL's.
- **Fantrax's ball recoveries are FPL's** (Gross 10, Rice 17, the same in both, 26 Sep), so a
  recovery-based attribute does not move when it changes source.
- **"Shots Blocked" (`SB`) is his own shots that were blocked**, not blocks he made; no column
  counts blocks made except inside Fantrax's `DFP`.
- **19 men who have played are not in the bridge** on the first run (late signings the last
  `npm run bridge` marked no-FPL-match: Q. Timber, Affengruber, Chilwell, Maitland-Niles…).
  Their counts are not stored until the bridge knows them; `intel-check` names the number.
- The script is `scripts/stats.ts`; the ingestion refactor moves it to `scripts/ingest/`.

## Team Stats' Squad view adds up the stats league's counts by squad (1 Oct 2026)

Craig: *"update stats with stats league and real league"*. The served league's `SEASON_STATS`
publishes only what it scores (the real league: 13 categories and a `Pen` priced nought), so
the board's third plate, **Squad**, reads `data/intel/stats` instead: 18 counts, four a group
at most, summed over every man each team holds now (`join/squadStats.ts`).

- **A different question from FPts and Total, and the plate's title says so.** Those are
  Fantrax's figures for what each LINEUP scored since the league began; Squad is what the men a
  team holds NOW have done all SEASON, wherever they played it and whoever held them. A side
  that drafted Haaland gets his August.
- **Ranked as Total ranks**: raw counts, low-is-good on cards, own goals, errors and goals
  conceded.
- **A man the bridge cannot key adds nothing**, and a team none of whose men has a reading prints
  `—`; a man who played and did none of it adds his nought.
- It is the first screen to read the file, so the 30 Sep line above ("nothing on screen reads
  it") no longer holds.

## Questions

- **Does `router.refresh()` ever land on the front page?** Measured 7 Oct 2026, production and a local build alike: a
  refresh of `/` gets its 200 at ~0.1s, then the stream is aborted at ~0.3s and the transition never settles, while
  `/league` and `/players` settle in 0.05–0.11s. `AutoRefresh` is that same call every 30s live, so the front page's
  live facts may not be updating in place. Pull to refresh reloads instead, so it does not depend on the answer.
- **Should a match page degrade rather than 500 when an upstream fetch fails?** The first cold fetch of an old
  match in London 500'd once on 7 Oct (the lhr1 section above).
- **Does `?period=N` serve history once a period has completed?** Answered for
  `getTeamRosterInfo` on 27 Aug and the answer is **no**: periods 1, 2 and 3
  return byte-identical POINTS, and only the opponent column moves. Answered the
  other way for `getLiveScoringStats`, which **does** honour it — that is now the
  app's per-period source. **Half-answered again on 28 Aug for `getTeamRosters`**,
  from the other direction: asked for NO period it labels its answer with a
  period the calendar has not reached — 2, ten and a half hours inside roster
  period 1 — so the arrangement on hand is not always the one that was played.
  See the 28 Aug section. **Fully answered later the same day, and the answer is
  history**: a claim made that morning left `?period=1` serving the dropped man
  while every other read served his replacement. What remains is not whether a
  period is stored but *when it freezes* — at its lock, or at rollover three days
  later — which is the question that decides whether `squads.ts` may send the
  parameter. One roster change made after period 2 locks tonight settles it.
- Does league scoring start at period 1 or period 6? `getLeagueInfo` numbers all
  38 periods from 21 Aug, but we draft at GW6. The rehearsal league's matchup
  schedule runs from period 1, so this is really a question about the real
  league's settings — recheck once its teams have joined.
- **Does the clean-sheet preview match what Fantrax settles at full time?**
  Half-answered: their threshold *is* 60 minutes and they publish it in a column
  tooltip (see above), so the rule is right. What is left is *when* they credit
  it, and the one real divergence — theirs is "on field", ours is FPL's team
  clean sheet, so a defender subbed off before his team concedes is one we
  undercount. Still first checkable on 21 Aug: watch one defender through a
  final whistle and see whether our +4 becomes their +4.
- ~~**Is Fantrax's middle rung reachable?**~~ Closed 1 Oct 2026 without an answer: the league settles on Craig's
  auto-sub run three hours after the last kick-off, never on FPL's rungs, so the probe stopped.
- **Does `playerGameInfo[1]` count players in a match in progress?** Inferred
  from the other four positions, never seen non-zero. First witnessable during
  any live match.
- What should `apps/lab` look like for the 27/28 platform prototype?
- **The cups, open since 27 Sep** (see *The cups are declared as ours*): where the starting eleven's
  goals, assists, clean sheets and minutes per team per gameweek are read from; how a group tie on points
  and points for is placed (draw order assumed); and whether Fantrax can express the playoff's one-leg play-in before two-leg semis (on 5 Oct it
  answered four teams, the semis alone).

**Answered 22 Aug, on the first real matchday** (all in the section above):
`remainingEventPercent` reaches literal zero. Fantrax's `totalFpts` does fill in
live. `getPlayerStats` **does** serve real numbers once a game has been played —
its default flipped to `SEASON_926_YEAR_TO_DATE`, so the pool's points column
stays where it is and the sixteen `getTeamRosterInfo` reads are not needed. But
that column is scored at the player's **listed** position, not the slot his owner
has him in, which is a different and smaller problem than the one this question
was worried about.

**Answered:** period↔gameweek alignment — kickoff, not deadline. Whether
`getMatchups` carries totals — it does not, and it is login-walled, so it is of
no use to us. What Fantrax data to replicate vs proxy — **replicate: their
points are public and authoritative, so we read them and compute nothing**, bar
the clean-sheet preview. Whether their numbers move live — **they do**, except
clean sheets. Whether lineups lock per game — **no**, one deadline 15 minutes
before the period's first fixture. And
why Vercel blocked the first production deployment: an unmatched commit author
email, not billing — see the hosting section.

## Work items

- [x] ~~**Six routes print text on the bare ground**~~ — **two, as of 5 Sep
      2026.** All pre-existing, all invisible until `groundfit.mjs` was repaired
      on 4 Sep (it counted body's opaque background and could not fail). Four
      closed when `PageHeader`'s `sub` took a surface and `/players` took
      `LeagueShell`; the run table above carries both counts. What is left is
      `/matchday/desk` at the cap — the `≥lg` wall, which has never had a plate
      under any of it — and `/squad` at 2. DESIGN §2's "Zero bare, 31 Aug 2026"
      is struck and restated against the 5 Sep run, which is the sentence
      bounding `SCRIM` and `DARKEN`.

- [ ] **Look at the desk on a real phone, once the site is mapped out** (Craig,
      3 Sep 2026). The headless Chrome the instruments drive reserves no layout
      height for a horizontal scrollbar whatever the CSS says, so three things
      from 3 Sep are measured but not SEEN on hardware: `cm-scroll`'s bottom bar
      on the two stats boards (`::-webkit-scrollbar` gained a `height` and a
      `:horizontal` arrow pair that day), the 16px of dead gutter reclaimed
      beside them, and whether the bevelled bar reads as furniture at 390 or as
      clutter. Everything else that day was read back off a screenshot;
      **this is the one claim in it that a screenshot cannot settle.**

- [x] Settle the two conflicting fuzzy rows (Andrews, Koumas) and sign off the
      other eleven — all 13 `conflicting` rows now carry `auditedAt`. *Landed
      19 Aug 2026; see the identity bridge section above for the reasoning.*
- [x] Add `Ehor Yarmolyuk` to the alias file. *Landed 19 Aug 2026 — the ceiling
      put him in review, which is how he got written.*
- [x] Decide how the ~156 never-in-FPL players get recorded. `auditedAt` means a
      person looked, so a score threshold must never write it — a distinct,
      machine-set reason keeps "confirmed" separable from "assumed". *Landed
      19 Aug 2026: `unmappedBy`, and a ceiling on what the script may answer for.
      See the residue section above.*
- [ ] Read the 3 remaining review rows (`Fred Heath` and `Enzo Kana Biyik`, MUN;
      `Lucas Pitt`, LIV). All three look like academy players the metric found a
      stranger for, but only a person may write `unmappedBy: "manual"`.
- [x] Automate the capture (cron or CI) — manual runs will not survive October.
      Run `capture:status` as a **separate workflow on a different schedule**, so
      the job that might die is not the job responsible for noticing. *Landed
      6 Aug, but only became live on 12 Aug: workflows fire from the default
      branch and the branch had not merged, so the cron had never once run.
      Verified by dispatching it manually rather than waiting for 05:10.*
- [x] Capture the three `getTransactionDetailsHistory` views daily, and build the
      feed from them rather than from capture diffs (see 12 Aug notes). Bind to
      `cell.key`; the header names include a broken i18n placeholder. *Landed
      19 Aug 2026 — the capture and the mapper were already there; the paper was
      still reading one view of three, so no trade had ever reached it. See the
      ordering note above.*
- [x] Model `scoringSystem` when a view first explains a number — read from
      `getLeagueInfo`, never from a checked-in copy (§3). *Landed 13 Aug, and
      then largely superseded the same day: the view that explains a number is
      the player card, and it explains it with Fantrax's own category breakdown
      rather than with our rules. `ScoringRules` survives because the
      clean-sheet preview prices itself from it.*
- [ ] **21 Aug, or the first day of real data:** re-read `getPlayerStats` and see
      whether its year-to-date refusal was a refusal or an empty season. The
      Players column heading answers this on its own — if it still says "Fantrax
      projection" once a round has been played, it was a refusal.
- [ ] **Rename the real league in Fantrax** — `getLeagueInfo.leagueName` is
      "Tim Hortons Pro League 24/25" and the schedule page prints it verbatim.
      Commissioner setting, not a code change. Before 10 Oct.
- [ ] **Anchor the lineup gate on the LOCK, not the roster-period boundary** —
      two commits, and the dated one. Move `locksAt`/`firstKickoff` from
      `gazette/deadline.ts` into `league/calendar.ts`, then gate `rosterDisplay`
      on `locksAt(firstKickoff(period, kickoffs))`. 33 of 38 roster periods open
      on the Friday morning for a Saturday lock; period 4 (11 Sep) is the first
      that bites and period 6 (9 Oct) is the day before sixteen people arrive.
      See the 27 Aug section above.
- [ ] Design the cookie flow for the fxpa write surface.
- [ ] Re-run `npm run bridge` after rehearsal waiver churn; gate on zero
      rostered-but-unmapped.

**Done since:** rosters, standings, teams and matchups modelled against real
payloads; captures filed per league; period alignment settled and scripted; the
`CLAUDE.md` pool-count and `sportRadarId` corrections landed.

## Lineups save to Fantrax through the commissioner's session — decided 30 Sep 2026

Craig asked for a Save button on the planner and chose a real write over a save on the phone. It rests on the
28 Sep probe: the commissioner's cookie with `adminMode` writes a team he does not own.

- **The server names the team and the week.** The team is the signed code's (`signedTeamId`, never the demo
  team); the period is `planningRound()`'s. A page planned for another period is refused, and so is anything
  within `SAVE_MARGIN_MINUTES` (10) of our computed lock, because `adminMode` overrides a locked team and
  Fantrax will not stop it (Craig: *"or you'll be overriding a team during a gameweek"*).
- **Fantrax's own deadline is not read.** `leagueNotices` gives it as prose with no year, for whichever period
  Fantrax has open, so after a lock it names the week just gone and would refuse every save until the period
  rolls. Our lock (first kickoff less `LINEUP_LOCK_LEAD_MINUTES`) matched its 7:15 AM EDT on 10 Oct.
- **Every write is a dry run first**; only a `CONFIRM` with no illegal message is executed. The bench order is
  a second write, `setAutoSubsOrder`, sent only when it changed.
- **A session may carry three methods and no others** (`fxpa.ts`), because the same cookie reaches
  `deleteLeague`.
- **Switched on per team**: `FANTRAX_COOKIE` plus `LINEUP_SAVE`, `on` for every team or comma-separated Fantrax
  team ids for only those (`saveAllowed`, also checked in the server action). A stale cookie fails the save with a
  hand-off to Fantrax and a `lineup-save` error line in the logs, which is the staleness signal.

