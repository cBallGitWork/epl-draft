# Four weeks to "change the league id"

## Context

The rehearsal league `zbn1z3ukmsgb36sz` was auto-drafted this morning: 4 teams,
15 rounds, 60 picks. For the first time `getTeamRosters` and `getStandings`
return populated payloads. Until now they were typed `unknown` in `raw.ts` under
a comment saying that inventing fields would be "documenting a wish". The wish is
now data, and the thing it was blocking — every league view in `PRODUCT.md` — is
unblocked.

The target is not "model the shapes". It is that **on 10 Oct the only change is
the league id**. Everything is built against the rehearsal league, and the real
league (`ayyoh3n2mr326v2o`, still empty) is the continuous test of the swap:
pointing at it must produce honest empty states, not a stack trace. That test
exists *today*, so it runs from week one instead of being discovered on ship day.

Supersedes phases 0–2 of `ok-but-whats-the-cozy-steele.md`, compressed to four
weeks.

## Principles this plan is built on

**FPL has hard rules; custom rules are Fantrax's product.** This is the sharpest
statement yet of why the two layers are separate, and it should shape the code
rather than sit in a doc. The football layer models a game whose rules are fixed
for everyone, so they can be constants. The league layer models a game whose
rules are a selling point: the shape of the competition is *data we read*, not
code we write. The two layers therefore differ in epistemics, not just in
content.

**So: anything in `getLeagueInfo` is league state, read from it — never assumed,
never hardcoded, never inferred from the football layer** (§3). All of these are
custom and none may be constants: roster limits and position caps · the position
vocabulary itself, which is multi-valued (`"F,M"`) and commissioner-editable per
player · the scoring system · the period calendar · **the lineup deadline** ·
team count · the matchup schedule · draft type · season start and end.
`RosterLimits` is the precedent to copy.

**Whenever an FPL concept crosses into league territory it arrives wearing
football clothes.** `element_type` already did this and position was moved out of
the football layer as a result. `deadline_time` is the same mistake waiting to
happen — FPL's deadline is FPL's house rule, and ours is a commissioner setting.

Two things make this enforceable rather than aspirational: the two leagues
**already disagree** on roster limits (15/11/5 vs 14/11/3), so rendering both is a
live test — which is why leaving the rehearsal settings mismatched was right; and
week 4 runs the app against the real league in CI, where every assumption meets a
league it wasn't written for.

## What we're building

**The app is a Fantrax app.** My team, players, waivers, standings, head-to-head
— all league layer. The FPL fantasy game is one secondary tab for members who
also run an FPL side at weekends. The football layer isn't demoted by this; it is
the data spine beneath the Fantrax views, since a roster is only interesting with
live match stats attached. What *is* demoted is the current app: today's fixture
scoreboard is infrastructure that happens to be the only thing shipped.

| Tab | Layer | Source |
|---|---|---|
| My team — roster, live contributions, active vs reserve | league | `getTeamRosters` + join |
| Head-to-head — this period's matchup | league | `getLeagueInfo.matchups` |
| Players / waiver wire — pool, ownership, who is free | league | `playerInfo.status` + pool |
| Standings | league | `getStandings` |
| FPL — your side, its points, mini-leagues | FPL entry | `/api/entry/{id}/…` |

**Waivers is read-only this season.** Viewing the wire is a public read and
ships; *claiming* is an fxpa write behind a session cookie and stays deferred.
Worth stating plainly, because "waivers" names both.

**The player card is the recurring unit.** It appears in my team, in players, and
in the FPL tab, and in all three a tap opens a points breakdown. Three
occurrences means §1 considers the abstraction earned — but build it twice and
extract on the third, as the rule intends, rather than starting there. Its two
sides differ in a way to design for: the Fantrax card shows Fantrax's points, the
FPL card shows FPL's, and the same footballer shows different numbers on adjacent
tabs. Label whose scoring it is (principle 3). What the tap opens differs by
side too — `explain` on the FPL side, the Fantrax profile below on the league
side — so the card is one component with two detail sources, not one pipeline.

### The Fantrax player profile — take the market data, refuse the tables

Tapping a player in Fantrax opens a profile panel, and it is served by
`POST /fxpa/req?leagueId=…` with `{"msgs":[{"method":"getPlayerProfile","data":
{"playerId":"02m5b"}}]}`. Verified today: **it works unauthenticated** (`roles:
["03"]`), returning ~17 KB. `getScorerDetails` by contrast answers
`WARNING_NOT_LOGGED_IN`, so the public/private line runs between methods, not
across the whole fxpa surface. Note the parameter is `playerId`; `scorerId`
returns `INVALID_REQUEST`.

**The payload is rendering instructions, not data.** Nine server-driven sections
(`OVERVIEW`, `STATS`, `SPLITS`, `GAME_LOG_FANTASY`, `GAME_LOG`, `NEWS_NOTES`,
`TRANSACTIONS_FANTASY`, `TEAM_SERVICE_TIME` — the "team service" tab you spotted
— and `TRANSACTIONS`), each holding tables with captions, per-column pixel
widths, sort directions, and rows of **pre-formatted strings**: `"T 1-1"` for a
score, `"May 24"` for a date, `"0.2"` for a rate, `""` for missing, and at least
one cell carrying literal `<br/>`.

So the decision is not how to model those tables — it is **not to**. Two reasons,
and they point the same way:

- `PRODUCT.md`'s anti-reference is, verbatim, "Fantrax's own interface. Dense
  enterprise tables and dated chrome." Rendering their tables ships the exact
  thing this app exists to be better than.
- Every number in them is a formatted string. Parsing `"T 1-1"` or `"0.2"` back
  into values means reversing someone else's presentation — §5's confident wrong
  number, with extra steps. FPL already gives the same football facts as typed
  numbers, cleanly, and we already consume it.

**What we take instead** is the part FPL cannot give us, which is all scalar and
all in `miscData`: `percentOwned` / `percentActive` / `percentDrafted` (ownership
across all of Fantrax), `averageDraftPosition`, `ownerTeamId` and `fantasyTeams`
(who holds them **in our league**), `leagueData`, `highlightStats` (which carries
Fantrax's own fantasy points — authoritative, and we don't compute it), the
`icons` news tooltips, and `personalInfo`, which is already clean name/value
pairs (birthplace, birthdate, age, height, weight).

That is the whole split: **Fantrax for fantasy-market intelligence, FPL for
football numbers.** It also means the player card's tap-through is our design
rather than a re-skin, and it is the first real deposit into the per-player
intelligence store `PRODUCT.md` wants.

Two caveats to carry: the profile defaults to `currentOrRecentSeason` (it served
2025-26 stats today, because 2026-27 hasn't started), so any season must be read
from `displayedSelections`, never assumed. And `percentOwned` is a
whole-of-Fantrax figure, not our league's — labelling it as ours would be wrong.

Deferred, not rejected: the section list is server-driven and §3 says such lists
are rendered from the response, so if the tables ever do get surfaced they must
be driven by `sections`, never a local copy. We simply aren't surfacing them.

### The fxpa error envelope is a different shape

fxea returns `{"error":{onScreen,code,message}}`. **fxpa returns
`{"pageError":{onScreen,code,text}}`** — different key *and* different field name.
`errorEnvelope()` checks `body.error` and requires `error.code` to be a string, so
it would sail straight past every fxpa failure, which is precisely the HTTP-200
trap `PLATFORM_NOTES` already documents, recurring in a new place. Any fxpa client
handles both envelopes, and `WARNING_NOT_LOGGED_IN` arrives through this one.

Also structural: fxpa is a **batch** endpoint — `msgs[]` in, `responses[]` out —
so one POST can carry several methods. Worth knowing before writing a client that
does one call per player.

**The bridge pays for itself twice**, which raises its value above what the notes
assume. It is not only Fantrax→football: a member's FPL picks are element ids
that resolve to `code` and then, through the bridge, to a Fantrax player — so the
tabs can talk to each other ("your Fantrax rival owns your FPL captain"), which
is the partisan register `PRODUCT.md` asks for. That needs the **inverted**
`Map<fplCode, fantraxId>`, safe only because `matchPlayers` enforces one-to-one
via `claimedCodes`. Assert that on build; a duplicate is a bridge bug, not a
display bug.

---

## Verified live today (6 Aug 2026)

Probed against both leagues. Facts, not assumptions.

- **`getTeamRosters` takes a `period` parameter** and echoes it back — previously
  unknown. Shape is `{period, rosters: {teamId: {teamName, salaryCap,
  rosterItems: [{id, position, status}]}}}`, status `ACTIVE`/`RESERVE`.
- **All 60 drafted players resolve to an FPL code** through
  `data/mappings/fantrax.json` — 50 exact, 10 fuzzy, zero misses. The launch gate
  most likely to embarrass us passes on real rosters.
- **`playerInfo.status` is an ownership flag** — exactly the 60 rostered players
  are `T`, the other 638 `FA`; the real league showed `WW`. Stays a raw string.
- **Field presence varies between leagues, not just between states.** The
  completed draft payload has no `draftType`; the empty one does. The real
  league's `getLeagueInfo` carries `draftType` and `leagueHistoryId`; the
  rehearsal league's carries neither. This is why every raw field stays optional.
- **Roster limits differ by league** — 15/11/5 vs 14/11/3, same position caps.
- **Standings shape is known, every value is zero.** `points` is a `"0-0-0"`
  string.
- Draft picks arrive unsorted; snake confirmed against `draftOrder`; every `time`
  in an auto-draft is identical. In a one-team dummy league picks arrive with **no
  `playerId` at all** and the roster is `[]` rather than a `NO_TEAMS` error —
  two more degradation states, and more evidence for all-optional raw fields.
- **`getPlayerProfile` is public** (see below) — a per-player Fantrax read with no
  cookie, which the notes did not know we had.

### The period↔gameweek alignment, settled

`PLATFORM_NOTES.md` has this as an open question. It is now answered, and the
obvious test gives the wrong answer:

- By **FPL deadline**, periods 1–5 look broken — period 3 contains no deadline,
  period 4 contains two.
- By **fixture kickoff**, all 38 periods align exactly with the identically
  numbered gameweek. All 380 fixtures, zero mismatches.

Fantrax's period boundary sits inside the 90-minute gap between deadline and
first kickoff, which is why the deadline test misleads. **Kickoff is the
alignment key.** Both leagues carry byte-identical `scoringPeriods` today, but
that is default settings rather than a rule. Postponements are the known future
divergence: FPL keeps a rearranged fixture in its original `event`, Fantrax
scores it in the period actually played.

---

## Week 1 (6–13 Aug) — capture it, model it

Nothing here is speculative; every field was observed today.

### Multi-league capture

`config.ts` holds one league id and snapshots have one namespace, so capturing
the rehearsal league would overwrite the real one.

```ts
// packages/core/src/config.ts — `key` doubles as a directory segment, so
// renaming one is a data move. Say so in the doc comment.
export interface FantraxLeague { key: string; leagueId: string; draftDate: string }

export const FANTRAX_LEAGUES: readonly FantraxLeague[] = [
  { key: "real",      leagueId: "ayyoh3n2mr326v2o", draftDate: "2026-10-10" },
  { key: "rehearsal", leagueId: "zbn1z3ukmsgb36sz", draftDate: "2026-08-06" },
];

/** The league the app serves. This is the 10 Oct swap. */
export const FANTRAX_LEAGUE_ID =
  process.env.FANTRAX_LEAGUE_ID ?? FANTRAX_LEAGUES[1].leagueId;
```

`DRAFT_DATE` stops being a global — two leagues draft on different days, and
`capture-status.ts` (its only reader) needs the cadence per league. Two rows ×
three fields is a data table in the one place §3 mandates. §5's ban on
environment reads names mappers and engines, not the config module.

`scripts/paths.ts` — `captureDir()` is replaced, not kept alongside (§2), by
`leagueCaptureDir(leagueKey, date)` and `poolCaptureDir(date)`:

```
data/snapshots/fantrax/leagues/<key>/<YYYY-MM-DD>/{getLeagueInfo,getTeamRosters,getStandings,getDraftResults}.json
data/snapshots/fantrax/pool/<YYYY-MM-DD>/getPlayerIds.json
```

**The pool is not league state.** `getPlayerIds` takes no leagueId and returns
identical bytes for both, so filing it under a league would force
`build-bridge.ts`'s `newestPoolSnapshot()` to choose arbitrarily between two
copies — and that arbitrary choice is the tell. It also keeps ~104 KB/day of
duplication out of git.

Migrate the existing `2026-08-05/` with `git mv` into `leagues/real/`, move its
`getPlayerIds.json` to `pool/`, split its `manifest.json` accordingly, and update
`data/README.md` in the same commit.

`capture-fantrax.ts` iterates `FANTRAX_LEAGUES` with one shared `capturedAt`,
capturing the pool once; its manifest carries `leagueId: null`, which is honest.
`capture-status.ts` calls the **unchanged** `captureStaleness(dates, today,
league.draftDate)` per league — that `staleness.ts` needs no edit is the sign the
abstraction was drawn correctly. Expect it to go red **on** the day of any missed
run, since the rehearsal draft date is today; that is the watchdog working.

*Corrected 27 Aug 2026: this said "the day after", and the code agreed with it —
`overdue` was `ageDays > cadence`, so a daily cadence needed an age of two and the
first missed capture passed green. The nine-hour offset `capture-status.yml` is
scheduled on existed precisely to report the same day, so the two documents
disagreed and the wrong one was implemented. See `staleness.ts`.*

Capture the current period's rosters only. Whether `?period=N` returns a past
roster or a projection is untestable until a transaction exists — an open
question, not something to design around.

### The shapes

`raw.ts` — every field optional. `RawTeamRosters` stops being `Record<string,
unknown>` and becomes `{period?, rosters?}`; note that shape wasn't merely
unmodelled, it was guessed *wrong*, which is §4's "raw.ts no longer mirrors
reality" trigger. `RawStandings` becomes `RawStandingsRow[]`. `teamInfo` and
`matchups` stop being `unknown`.

`types.ts` — domain types; absence as `null`, status vocabularies raw:

```ts
LeagueTeam     { teamId; name }
RosterSlot     { fantraxId; position: string | null; status: string }
TeamRoster     { teamId; teamName; slots: RosterSlot[] }
PeriodRosters  { period: number | null; teams: TeamRoster[] }
StandingsRow   { teamId; teamName; rank; record: string; pointsFor: number }
LeagueMatchup  { period: number; homeTeamId: string; awayTeamId: string }
```

`LeagueInfo` gains `teams` and `matchups`, the latter **flattened** to one row
per pairing per period so selecting a period is a `filter`. Matchups carry ids,
not embedded teams — Fantrax sends names on both payloads and one copy would go
stale. `period: number | null` rather than `?? 0` (§5).

`record` stays the raw `"0-0-0"` string. Splitting it would infer a format from
an all-zero sample; parse it when GW1 produces a real one.

**Not modelled** (§2 unused this phase, §5 types describe reality): draft results
— you've ruled them out, so the payload keeps being captured but nothing types or
maps it; `salaryCap` — on the wire, meaningless in a league with no cap;
`gamesBack`/`winPercentage`; `poolSettings`/`draftSettings`. Say so in the raw
file's comments so nobody "finishes the job". `scoringSystem` stays `unknown`
**this phase only** and for a different reason — it is the most custom thing in
the league, and the moment a view explains a number it reads the rules from
there. Never from a checked-in copy: §3 allows a fixture as a labelled fallback,
never as the source.

One live bug: `mapLeagueInfo` does `draftType: raw.draftType ?? ""`, and the
rehearsal league has no such key, so it now yields `""` — §5 violated by real
data rather than in theory. `draftType` becomes `string | null`. Held tight:
`name`, `startDate`, `endDate`, `seasonYear` keep their defaults, because both
leagues carry them.

`map.ts` is 117 lines and the new mappers take it past §4's 200-line ceiling, so
it splits by payload at that point — `map.ts` keeps pool and league info,
`rosters.ts` and `standings.ts` take the rest — re-exported through
`league/index.ts` so the public surface is unchanged.

### Periods, measured by kickoff

`packages/core/src/league/calendar.ts`, beside `staleness.ts` — league root, not
under `fantrax/`, importing no football code. It is *told* about kickoffs as
plain data, exactly as `identity/candidates.ts` declares its own `FplCandidate`
rather than importing `FootballPlayer`.

```ts
export interface GameweekKickoff { gameweek: number; kickoff: string }
/** Zero and two are both possible answers, hence a list. */
export interface PeriodGameweeks { period: number; gameweeks: number[] }

export function periodGameweeks(
  periods: LeaguePeriod[], kickoffs: GameweekKickoff[],
): PeriodGameweeks[];
```

Compare **instants** via `Date.parse` — period bounds carry `-0400` and FPL
carries `Z`, so lexical comparison is silently wrong. Bounds inclusive both ends
(consecutive periods leave a one-second gap). Use `scoringPeriods`, not
`rosterPeriods`.

Tests against `league/__fixtures__/periodAlignment.json`: every period contains
exactly its own gameweek across all 38; **the same data measured by deadline does
not, and that is the trap** — name the test that way, because the next person
will reach for `deadline_time` first. Degrades on `periodGameweeks([], [])`.

To keep it from being a function whose only caller is its own test (§2), it ships
with `scripts/period-alignment.ts` (`npm run periods`), which re-checks against
live FPL — which reschedules — and prints the table.

`LeaguePeriod`'s doc comment is true but underspecified; it gains the "by
kickoff" qualifier and a pointer to the test.

### Fixtures and docs

Trim recorded payloads the way `leagueInfo.json` was. `teamRosters.json` keeps 2
of 4 teams and ~4 of 15 slots, mixing ACTIVE/RESERVE and two positions, with one
slot's `id` removed so the skip path is exercised on real-shaped data. Existing
`standings.json` and `draftResults.json` are not replaced — `errors.test.ts`
imports both as healthy-body cases.

`PLATFORM_NOTES.md`: the kickoff finding, the `period` parameter,
`playerInfo.status`, per-league field-presence variance, per-league roster limits,
the bridge proven on all 60 rostered players, and the now-answered period
question — plus the new open one about past-period rosters, whose answer decides
whether roster history is backfillable and therefore how strong the "capture
cannot wait" doctrine really is.

`CLAUDE.md` gets two real amendments, not just corrections. First, the FPL-fixed
/ league-custom principle above: the file says *that* the layers split, not *why*.
Second, "they meet only through player identity" is no longer the whole truth —
the calendar is a second seam. The rule becomes: the league layer may be *told*
about the football calendar as plain data, but may never import the football
adapter, and football may never import the league. `packages/core/src/index.ts`
repeats the same claim and needs the same edit. The two long-outstanding
corrections (`getPlayerIds` returns 758 entries of which ~698 are players;
`sportRadarId` is not on that endpoint) can finally land too.

`FPL_API.md` — your sister-repo reference, in the tree and linked from
`CLAUDE.md`. Too long to inline, too valuable to leave in a chat log.

### Commits

Refactors never mix with behaviour (§7); each green on test, build and typecheck.

1. `refactor: file Fantrax captures per league` — config, paths, scripts, the
   `git mv`, `data/README.md`. Tests untouched and green either side.
2. `chore: capture both leagues on the day the rehearsal league drafted` — data
   only. **The irreplaceable one.** A freshly auto-drafted league with 60
   identically-timestamped picks and every player still `T` exists exactly once.
   Commit 1 must land first; acceptable, since no waiver or lineup move is
   possible before 21 Aug.
3. `feat: model the rosters and standings the league returned`
4. `feat: read the teams and matchups getLeagueInfo now carries`
5. `fix: model an absent draftType as absent` — failing test first
6. `feat: align Fantrax periods to FPL gameweeks by kickoff`
7. `docs: record the payload shapes, the alignment, and what is custom`

### Automation

`.github/workflows/` — daily capture committing `data/`, plus a **separate
workflow on a different schedule** running `capture:status`, so the job that
might die isn't the job responsible for noticing. The sibling project's capture
died silently at GW35; silence is the failure mode being designed against.

## Week 2 (13–21 Aug) — the join, and a URL

GW1 kicks off 21 Aug, so this lands before it.

- **Bridge loading at the edge, never in core** — forced, not stylistic:
  `packages/core/tsconfig.json` includes only `src/**/*.ts`, so core *cannot*
  import `data/mappings/fantrax.json`. The pure join takes `bridge: Bridge` as an
  argument; the app imports the JSON through a new `@data/*` path; scripts keep
  using `fs`.
- **`playerByCode(snapshot)`** in `football/selectors.ts`. The bridge persists
  `code`; the only existing selector is keyed by the per-season `id`, which §3
  forbids persisting.
- **The join, pure, in `packages/core/src/join/roster.ts`** — football snapshot +
  `PeriodRosters` + `Bridge` → rostered players with live stats, `unmapped`
  modelled rather than dropped. Through `league/index.ts`, never into `fantrax/`
  — that is what the 27/28 swap depends on. Heavily tested; if this lives in a
  component you will debug it on a phone on a Saturday.
- **"My team" without accounts** — a cookie-set team choice on first visit, read
  server-side. Public reads, nothing to protect; a login for sixteen friends is a
  §1 violation with extra steps.
- **Deploy.** No hosting exists in the repo. A Next 16 production surprise costs
  an afternoon in August and the launch on 10 Oct.
- Split `MatchList.tsx` (186 lines, 200 ceiling) before partisan highlighting
  lands on it — its own commit.

## Week 3 (21–28 Aug) — GW1 is live, the league tabs land

The first real football the league layer has seen, and the week the app stops
being a fixture list. Built in `PRODUCT.md`'s job order.

- `/team/[teamId]` — roster with live contributions, active and reserve
  distinguished. The live number is the interface.
- Head-to-head for the current period, both totals moving. Fantrax's numbers stay
  authoritative; ours is a proxy and says so.
- `/players` — the pool with ownership from `playerInfo.status`, filterable to
  free agents, football data joined through the bridge. The waiver-scouting and
  "should I start this player" surface, and the one that most needs the position
  vocabulary read from the league rather than assumed.
- **Tapping a player** fetches `getPlayerProfile` for that one player — on tap,
  never for the list, since it is one POST each and 698 of them is exactly the
  burst nobody wants to send. A new `league/fantrax/profile.ts` client method plus
  a mapper that extracts the `miscData` scalars and discards the tables. This is
  where ADP, percent-rostered and Fantrax's own fantasy points reach the UI.
- `/standings` — the Tim Hortons register (principle 3).
- Navigation becomes real: bottom bar, phone-first. `layout.tsx` has none today.
- Capture staleness surfaces in the UI — the real watchdog, since sixteen people
  look at it every Saturday.

Not this week: the FPL tab. `picks` returns nothing until GW1 has been played, so
it cannot be built against live data yet.

## Week 4 (28 Aug–3 Sep) — the FPL tab, and prove the swap

The week that makes 10 Oct boring.

- **The polite client, first.** `football/fpl/client.ts` is plain `fetch` with no
  throttle, retry or User-Agent — survivable for one bootstrap per render, not
  for per-member entry calls, and FPL WAFs bursts. It gains a browser-like UA,
  jittered spacing, and backoff honouring `Retry-After` on 429/5xx while failing
  fast on 404. Sleeping and randomness are I/O and live in `client.ts`, nowhere
  near a mapper (§5).
- **The FPL tab, kept small.** Mostly just the points: your fifteen with live
  scores, your total, your mini-leagues. Tapping a player card opens the
  breakdown, which is the `explain` block — a render of data already fetched, not
  another call. No history sparklines, no `element-summary` fan-out, no fixture
  difficulty. `packages/core/src/fpl-entry/` (its own adapter, since
  `football/fpl/` is about the competition, not a manager's side) plus one route.
  Manager id entered once, stored beside the team choice. Four calls, three
  cacheable for the gameweek: `bootstrap-static`, `entry/{id}`,
  `entry/{id}/event/{gw}/picks`, `event/{gw}/live` — then `total_points *
  pick.multiplier` per row. Cross-tab overlap only if it falls out cheaply.
- **Run the app against the real league id.** It is empty, so every view meets
  `NO_TEAMS`, `[]` and `{}` — the states 10 Oct won't have but every failure mode
  needs. A CI job, so the swap is verified continuously rather than once.
- **A shape-diff script** — the real league's live payload keys against the
  recorded rehearsal fixtures, printing what is new or missing. This is what runs
  at 11:00 on 10 Oct.
- **Degradation is a launch requirement**, not polish: an honest "not available
  yet" for `NO_TEAMS`, unparsed shapes, unmapped rostered players and stale
  captures, with a link out to Fantrax (principle 4).
- **The bootstrap cost**, deferred in the notes "until the app is in front of
  people" — sixteen people refreshing at 15:00 is that moment.
- **Re-run `npm run bridge`** after rehearsal waiver churn; gate on zero
  rostered-but-unmapped.
- The ship-day runbook: set the env var → capture → shape-diff → bridge →
  unmapped gate → redeploy, plus the decision made in advance about which views
  get switched off and linked out if something fails to parse.

### FPL API details that change code

From your reference, the items that aren't merely reference:

- **`data_checked`, not `finished`, means final.** Bonus is provisional
  mid-gameweek — `live/` reports `bonus: 0` and only `bps` until matches settle,
  and autosubs apply only when every fixture is done. `PlayerMatchStats` already
  carries both, so the fix is honesty in the view (principle 4).
- **`explain` is per-fixture**, so a double gameweek yields two entries and a
  blank yields none. Never index `[0]`. Join `identifier` to `element_stats` for
  labels.
- **Sum of picks ≠ entry score** — autosubs and transfer hits. Verify against a
  gameweek whose score is already known, and check whether `entry_history.points`
  is gross or net of the hit rather than assuming.
- **No CORS** — every call server-side. Our server components already satisfy
  this; it bites the moment anything is tempted client-side.
- Money is in tenths (`now_cost: 55` = £5.5m); classic standings paginate 50/page
  on `has_next`.

## Not in these four weeks

The **fxpa write surface** — specifically *making* a claim or setting a lineup,
as opposed to viewing either, both of which ship. **FPL's authenticated
endpoints** (`/me/`, `/my-team/`, transfer POSTs) go with it, on your reference's
own advice: a credential flow the Premier League changes without warning, for a
viewer that doesn't need it. The symmetry is worth noticing — both providers gate
writes behind a login we decline to hold, and we are a read-only republisher on
both sides. The cost is that the FPL tab shows the last confirmed squad before a
deadline, never a pending one.

Also: a scoring engine, custom competitions, the gazette, `packages/ui`,
`apps/lab`, FPL-side capture, and anything built on draft results.

## Also outstanding

The identity audit — Andrews/Koumas, the eleven `conflicting` rows, Yarmolyuk's
alias, and a machine-set reason for the ~156 never-in-FPL players so `auditedAt`
keeps meaning "a person looked". One timeboxed session, week 1 or 2.

It is *less* optional than the notes suggest. Deferring it was justified by the
bridge already covering every rosterable player — true when a roster was the only
consumer. A players tab puts all 698 on screen and the FPL tab reads the bridge
backwards. Neither breaks without the audit; both make its noise visible.

## Verification

`npm test`, `npm run build`, `npm run typecheck` green before every commit (§7).

- **Week 1** — mappers tested against recorded `__fixtures__/`, never the network
  (§6); `periodGameweeks` asserted against all 380 fixtures; `npm run capture`
  writes both league namespaces and one pool; a forced CI failure reaches you.
- **Week 2** — join logic unit-tested pure; a production URL serves the live view.
- **Week 3** — judged on a real Saturday, on a phone, with a rehearsal team
  selected: the roster shows live contributions, the H2H total visibly moves, and
  the players tab answers "who is free and any good" in one thumb scroll. Not
  judged in a test.
- **Week 4** — green against the real league id in CI; each degradation path fed
  the recorded error-envelope fixtures; the FPL tab renders a real manager id
  after GW1; the runbook executed once end to end.

The check that matters most: **every league view renders correctly for both
leagues**, which differ in roster limits. That is the whole swap, tested
continuously rather than discovered on 10 Oct.
