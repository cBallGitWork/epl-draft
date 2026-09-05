# Platform notes

This file is our living season log and platform journal.
Update it whenever we make architecture decisions, discover API quirks, or
capture season-specific tradeoffs.

> **The dated session narrative lives in [`SEASON_LOG.md`](SEASON_LOG.md).**
> Split out 3 Sep 2026 at 4,784 lines, of which about 3,400 were a diary. This
> file is the standing half — what is true now, what was probed and must not be
> re-derived, what was decided, and which rules have recorded exceptions — and it
> is meant to be read. The log is meant to be searched.
>
> The rule for which half a section belongs in: **a standing fact, a probe
> result, a decision or a rule stays here; an account of a day's work moves.**
> `docs-drift-auditor` exempts a season log from drift-checking because its
> dated entries are supposed to describe the past — after the split that
> exemption belongs to `SEASON_LOG.md`, and everything left here is auditable,
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
  doc said so. Corrected in CLAUDE.md, PRODUCT.md, DESIGN.md, README.md and
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
them — and `eleven` and `dodgers` refuse outright when it is false, because
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
  19 Aug 2026 — see `SEASON_LOG.md`, "The extension plan is dead, and it was
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
wrong, which is `CODE_RULES.md`'s "raw.ts no longer mirrors reality" refactor
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
- **No write surface yet.** The fxpa methods (`confirmOrExecuteTeamRosterChanges`
  for lineups, `confirmOrExecutePlayerPickerChanges` for waivers) need a member's
  browser session cookie. Deferred to September. Note that before the draft there
  are no rosters to change, so there is nothing to test against either.
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

**So absence here means ZERO, which is the opposite of `DESIGN.md` §7's "Absence is `—`,
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

## Recorded rule exceptions

### `desk.css` and `tokens.css` (recorded 3 Sep 2026)

Both are past CODE_RULES §4's 300-line hard ceiling, and `line_ceiling.sh`
covers `.css` — so it has been asking for this entry on every commit that
touched either, and nobody wrote it. Recorded now rather than split now, and the
reason is that neither is doing two jobs:

- **`desk.css`** is one job — the Championship Manager desk. `.cm-panel`,
  `.cm-bevel`, `.cm-row`, `.cm-rows`, `.cm-index`, `.cm-tab`, `.cm-foot`,
  `.cm-out`, `.cm-scroll`. Splitting it by count rather than by responsibility means
  choosing an arbitrary line, and §4's own rule is one responsibility per file
  with the filename saying it. A second file would have to be called something
  like `desk-more.css`, which is `misc.ts` wearing a stylesheet's clothes.
- **`tokens.css`** already paid this once: its header records that
  `paper.css` was split out of it *because* the pair crossed 300. What is left
  is the single `@theme` layer — 111 custom properties, one palette. Cutting it
  again splits a palette in half, and DESIGN.md's whole argument is that the
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


Each entry is a deliberate departure from `CODE_RULES.md`, recorded in the commit
that made it.

### `revalidate` literal in every route segment (§3, no hardcoding)

Next requires a route segment's `export const revalidate` to be a statically
analysable literal, so it cannot be imported from `packages/core/src/config.ts`.
Every route segment therefore repeats `PAGE_REVALIDATE` as a literal, and every
route added later will too — a standing exception, not a per-file one. The
`PAGE_REVALIDATE` docblock in core config is the canonical statement; a comment
at each site points back to it. They all change together.

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
`app/global-error.tsx` catches that, and there is no such file. So the exception
stands, and the condition for lifting it is now stated correctly: **a
`global-error.tsx`**, not an `error.tsx`.

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

Fixed: the walk now stops before `<body>`. What it then reports, at both widths:

| route | text on the bare ground |
|---|---|
| `/players` | 40 (the cap) |
| `/matchday/desk` | 40 (the cap) |
| `/league/matchups` | 4 |
| `/matchday` | 2 |
| `/league/schedule` | 1 |
| `/fpl` | 1 |

**The player routes fail it too**, and that is the honest reading: what the
repaired instrument reports is an app-wide pattern, not six unlucky screens.

**`components/shell/Section` is the offender, and it is everywhere.** Its heading
(`font-display text-2xs font-bold uppercase text-muted`) and its `aside` sit on no
plate, so every headed block in the app prints two strings on the photograph.
`PageHeader`'s `sub` (`numeric px-2 pt-1 text-2xs text-faint`) is the same shape,
and so are `FixtureRun`'s gameweek labels and `/players`' sort links.

**Nothing app-wide is fixed here.** Giving `Section` a plate changes every screen
in the app and is a DESIGN.md decision rather than a feature commit's. What the
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
exactly what he is looking at. Nothing is truncated: all 697 rows render, ~84 KB
gzipped, and the header states the count in view against the total.

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
payload always carries the whole league. The **`BENCH` block is cookie-only**;
anonymous callers get `ACTIVE`, which is what scores anyway. Per-player *points*
(`statsMap`, `statsMap2`) are `{}` in every section, so what they will hold is
unknown.

### `getPlayerStats` is public — and its default view is a projection

The players page: 708 players, 20 per page, 36 pages. Rows carry `scorerId` (our
`fantraxId`), the player's news `icons`, and **which of our teams owns him**
(`cells[1].teamId`) — ownership in our league, public.

Two traps, both load-bearing:

- **The default is `PROJECTION_0_926_SEASON`.** Haaland's "179" is Fantrax's
  projection for a season that has not started, not anything anyone has scored.
  The season must be read from `displayedSeasonOrProjection`, never assumed —
  the same currentOrRecentSeason trap `getPlayerProfile` set, in a new place.
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
  HMACs go into the deployment**, as `TEAM_CODES`, so a leaked environment hands
  nobody a sign-in and a lost code is reissued rather than recovered.
- `SESSION_SECRET` does double duty: it keys those HMACs and signs the session
  cookie. Rotating it invalidates every code and every session at once, which is
  the correct blast radius and worth knowing before rotating it casually.
- The session cookie is `teamId.HMAC(teamId)`, httpOnly. Verified server-side,
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
| `/prem/club/[code]` · `/gw/[gameweek]` · `/players/[fantraxId]` · `/squad/[teamId]` · `/league/matchups/[teamId]` · `/paper/[slug]` | `/prem/player/[code]` · `/prem/match/[id]` · an unmatched URL |

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

## Questions

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
- **Is Fantrax's middle rung reachable?** *Gameweek 1's window was missed — by
  27 Aug all four GW1 dates read `bonus_added: true` with the round
  `data_checked`, so the flip order is gone. Next chance is Mon 31 Aug from
  ~21:00Z.* If FPL confirms bonus per gameweek
  rather than per match day, every fixture's `finished` flips at about the same
  moment as `data_checked` and the `provisional` rung — all settled, not signed
  off — is a near-zero-width window, leaving one of three rungs effectively dead.
  Settle it by sampling `/api/event-status/`, `/api/fixtures/?event=1` and
  bootstrap `data_checked` together from Mon 24 Aug ~21:00Z and recording the
  flip order.
- **Does `playerGameInfo[1]` count players in a match in progress?** Inferred
  from the other four positions, never seen non-zero. First witnessable during
  any live match.
- What should `apps/lab` look like for the 27/28 platform prototype?

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

- [ ] **Six routes print text on the bare ground** — `/players` and
      `/matchday/desk` at the 40-row cap, `/league/matchups` 4, `/matchday` 2,
      `/league/schedule` 1, `/fpl` 1. All pre-existing, all invisible until
      `groundfit.mjs` was repaired on 4 Sep 2026 (it counted body's opaque
      background and could not fail). The commonest offender is `PageHeader`'s
      `sub`, which sits on no plate, and `/players`' sort links. **DESIGN §2's
      "Zero bare, 31 Aug 2026" should be restated with the date of a run that
      could have failed** — the sentence bounding `SCRIM` and `DARKEN` depends
      on it.

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

