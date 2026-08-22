# Platform notes

This file is our living season log and platform journal.
Update it whenever we make architecture decisions, discover API quirks, or
capture season-specific tradeoffs.

## Purpose

- Track what the platform is doing now versus what Fantrax is doing.
- Record design decisions that matter for next season.
- Capture unresolved questions, blockers, and follow-up work.
- Keep a shared source of truth for engineering notes.

## Current season summary

- Start date: 5 Aug 2026.
- Season target: support the 16-user Fantrax league from GW6 onwards.
- A dummy league carries GW1–GW5. It is drafted early and deliberately small, so
  the roster, lineup and join surfaces get five gameweeks of real football to be
  refined against before the real league drafts. GW1 is not a ship date.
- Fantrax remains authoritative for live scoring and league state.
- We are building the platform layer separately so the UI and football data can
  survive provider changes.

## Current priorities

- Keep `packages/core` clean: adapters, maps, scoring, identity.
- Keep `apps/companion` focused on the live app experience.
- Keep `apps/lab` as the future 27/28 prototype.
- Avoid building a server-side Fantrax login unless the extension/cookie flow is
  solved.

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

## Recorded rule exceptions

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

`footballIsOn()` in `apps/companion/app/layout.tsx` wraps `getFootballSnapshot()`
in a `try/catch` that returns `true`. §2 forbids exactly this — swallow and
default — and the rest of the tree honours it: the FPL client says so in a
comment as it rethrows, and `refusals.ts` catches only `FantraxError`.

It stands here for two reasons that do not apply anywhere else. A root layout
that throws takes **every route** down with it, including the pages that would
otherwise have rendered fine and reported the failure themselves; there is no
`error.tsx` in the app, so the alternative is a blank screen for a tab bar.
And the default is chosen, not convenient: **it fails open**, showing the
Matchday tab rather than hiding it. A tab that should not be there leads to a
page that says plainly it could not read anything; a section that silently
vanishes mid-match is the failure nobody can diagnose from a phone.

If an `error.tsx` ever lands, this should be revisited — that is the shape that
would let the layout throw honestly.

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

`FANTRAX_LEAGUE_ID` reads the environment, defaulting to the rehearsal league.
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

## A second client component, on purpose

`AutoRefresh` was the app's only `"use client"` file and its comment said so
deliberately. `LineupPlanner` is the second, and it earns it: the whole feature
is an XI you rearrange and look at before committing, so the edited shape has to
live in browser state.

It reuses `lineup()` and `Pitch` unchanged by rebuilding a `RosteredTeam` from
the edited slots, rather than growing a second renderer that can drift from the
real one. The planner never writes: it ends in an outbound link, and
`FANTRAX_APP_BASE` deliberately stops at the league path — the only URL shape
confirmed from a real browser session. A deeper guess at their roster route would
break silently the day they reorganise.

Only the fifteen squad members' eligibility crosses to the browser, not the
pool's 697.

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
- `sectionContent` (stats, splits, game logs) is refused rather than forgotten:
  most of the payload's weight, columns keyed by numeric stat ids, no consumer.
- ADP is real and public here (`averageDraftPosition`), which is the trade scout's
  value map when it lands.

## A third client component: the tab bar

`TabNav` is `"use client"` for one reason — `usePathname`. A tab bar that
cannot say which section you are in is a row of links, and the answer only exists
in the browser. Nothing else in it is interactive.

Each tab owns a set of routes rather than the single one it links to, so reading
a squad (`/squad/[teamId]`) or a past gameweek (`/gw/[n]`) keeps its section lit.
It carries its own `env(safe-area-inset-bottom)` padding: the body's padding does
nothing for a fixed element, which is positioned against the viewport.

**One component in two shapes** (13 Aug): a fixed bottom bar on a phone, a sticky
masthead row at the top from `md` up. It was `BottomNav` and is now `TabNav`,
because the name had stopped being true at half the widths we serve. Two
components would mean two copies of the route-ownership table, and the copy not
on the phone is the one that would rot. It renders *before* `<main>` so the
desktop bar can be sticky in normal flow; on a phone `fixed` takes it out of flow
and document order costs nothing. The active indicator flips edges with the bar —
`border-t` under a thumb, `border-b` under a masthead.

Two in-content links became redundant the moment it landed and one of them went:
the undrafted state's "The football, meanwhile" is now the Matchday tab. "Every
squad" on a team page stays — it is an up-link within a section, not navigation
between them.

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

## CI, and the hosting decision (13 Aug 2026)

`verify.yml` runs the four green checks — test, typecheck, lint, build, cheapest
failure first — on `push` and `pull_request`, which unlike `schedule` fire from
any branch. The build step prerenders against live FPL and Fantrax, so a
provider shape change reddens CI before it reaches a phone; the cost is that a
provider blip can too.

**Known trap, accepted:** the daily capture pushes with `GITHUB_TOKEN`, which by
design triggers no other workflows. Capture commits land on `main` with no
Verify run beside them. They touch only `data/snapshots/`, so this is
acceptable — but it is the same class of trap as the cron that had never fired:
automation that looks attached and is not.

**Hosting is live — Vercel, deployed 13 Aug 2026.** Production is
**`https://epl-draft-companion.vercel.app`**, building from `main`. Verified
from outside the same day: squads render players, which proves the bridge JSON
crossed the root-directory boundary — the failure the plan expected first — and
the optimizer serves PL portraits at ~25 KB from ~330 KB sources. One lag to
know rather than rediscover: production is `main`, so a feature branch's routes
404 there until it merges (`/matchup` did, on day one). The settings, recorded
for whoever revisits them:
Root Directory `apps/companion` with *include files outside the root directory*
left on, because `@epl/core` ships raw TypeScript via `transpilePackages` (so
install must run at the repo root) and `app/squad/league.ts` imports the bridge
JSON from `data/mappings/` outside the app directory — if the first build
breaks, expect it to break there. `FANTRAX_LEAGUE_ID` is set explicitly in the
dashboard (rehearsal `zbn1z3ukmsgb36sz` until 10 Oct), which makes the swap one
dashboard field — and being a dashboard value it is invisible to git, so it goes
in the ship-day runbook as a numbered step. `FANTRAX_COOKIE` is read by nothing
in the tree and must never reach Vercel. Expect a redeploy per day off the
capture commit; Ignored Build Step is the lever if that becomes noise.

### A push that deploys nothing — the commit author is a deploy credential

The merge of `feat/fantrax-league-layer` into `main` at 10:53 produced a
Production deployment that Vercel reported as **`failure — Deployment was
blocked`**, so the URL kept serving the 10:49 build and `/matchup` stayed a 404
on a commit that contains it. Nothing was wrong with the code: `verify.yml` was
green on the same commit, and the identical build passes locally.

**The cause was the commit's author email.** Vercel blocks a deployment whose
commit author cannot be matched to a GitHub account, and every commit here was
authored `craigdavidball14@gmail.com`, which is not on the `EH775` account. That
makes `user.email` a deploy credential in this repo, which is not how anyone
reads a git config. The tell is free and precise: GitHub's API returns
`author: null` for a commit it cannot attribute, so

```bash
gh api repos/EH775/epl-draft/commits/main -q '.author.login // "UNMATCHED"'
```

answers "will this deploy?" before the push does. Fixed by setting the author to
the account's own noreply address, **repo-locally** rather than globally —
`git config --local user.email 51231517+EH775@users.noreply.github.com` — so the
one repository whose pushes are deployments carries the identity that deploys
them, and Craig's other work is untouched. A fresh commit is required either
way: Vercel judges the commit it is given and does not retry an older one.

Blocked is not failed — the build never ran, which is why there was no build log
to read, only the deployment page.

Worth writing down beyond its own fix, because it is the **third** instance of
one pattern this month: the capture cron that had never fired, the capture
commits that trigger no workflow, and now a git push that deploys nothing. Every
one of them looks automated from the inside and is not. Green CI says the code
is good; it does not say the code shipped. **Before 10 Oct, the ship-day runbook
must check the deployed URL itself, not the commit that was pushed to it.**

## The squad view, for the fourteen squads that are not yours (19 Aug 2026)

`/squad/[teamId]` had two states: the pitch once a period opens, and `SquadList`
— fifteen names in a column — before it. The second is the state a rival's squad
is in every time you open it before a deadline, and a column of names is not a
squad screen.

It is now a board with two arrangements and a card over the top:

- **`squadUnarranged()` in `join/lineup.ts`**, beside `squadInLines()`. All
  fifteen in positional lines, **no bench and no active/reserve mark**, sorted by
  name within each line. The sort is load-bearing, not tidy: `squadInLines()`
  lifts the actives to the front of every line, which is the XI restated as an
  ordering. Fantrax happens to interleave actives and reserves in the payload, so
  rendering their order happens not to leak the lineup today — their
  serialisation detail, not a promise. Sorting by name makes the non-leak a
  property of the file.
- **Grouped by `slot.position`, never by eligibility.** Fantrax supports
  multi-position players ("F,M" is common), so eligibility would put the same
  footballer in two lines or make the view pick one for him. The manager already
  picked, and his choice is on the roster.
- **`oppositionByClub()` / `oppositionLabel()`** in a new `football/opposition.ts`.
  Who a club plays this round is a football fact — the fixture list is fixed for
  everyone — so it is answered in the football layer and never inferred from the
  league. A list per club rather than one fixture, because a blank gameweek gives
  a club none and a double gives it two, and `oppositionLabel()` returns null for
  the blank so each caller decides what fits its space.
- **The sticker's strip prints the fixture** while there is nothing to report,
  and minutes once he is on. The crest in the corner already says which club he
  is, so the club code that used to sit there was three characters spent twice.
- **`StickerFace` is a client component, and had to be.** The Premier League's
  portraits are cut-outs on a transparent ground, so a fallback drawn *behind*
  one shows through the player rather than behind him — a crest across his face.
  It has to appear only once the image has actually failed, and only the browser
  knows that. It fails often enough to be worth the boundary: January signings
  and academy call-ups go weeks without a headshot.
- **The player card is a dialog, not a route.** The question a tap asks is "who
  is this and is he fit" while reading somebody else's fifteen, and navigating
  away to answer it loses the squad being read. Native `<dialog>`, so Escape, the
  focus trap and the inert background are the browser's job. The subject of the
  card is the same sticker at album size — tapping a sticker to be shown a
  plainer portrait would look like a different player.
- **The route now knows whose squad it is serving.** `mine` gates the lineup
  planner (rearranging a rival's team is not yours to do, preview league or not)
  and changes what the gate is said *about*: on a rival's team it explains why you
  cannot see their XI, on your own why you cannot see the one you set yourself.

Second pass the same day, from design review:

- **The pitch is angled.** `PitchTurf` draws the trapezoid, the mow bands growing
  toward the reader and the markings splayed with them — penalty area, six-yard
  box, D, spot, and the centre circle at the near edge where it can never run
  through a row. The angle is in the ground and never in a CSS `perspective`: a
  transform would tilt the stickers with it, and a sticker is a flat printed
  object photographed square.
- **`PitchFrame` is shared with the matchday XI**, hoardings and all, and the
  hoardings carry the league crest — which is where a sponsor goes the day the
  league has one. They are the width of the far touchline rather than of the
  page: boards stand behind that goal line, and running them full width puts
  advertising on ground the perspective says is off the pitch. The `.album` red banding around both pitches is gone; the
  surround and the boards are the frame now, and the CSS went with it.
- **The pitch is full-bleed** and fits a 390x844 phone without scrolling. That
  cost the gate's explanation paragraph for the ordinary `not-started` case and
  the standalone provenance line. Neither claim was dropped, only moved: the
  three abnormal gate reasons still print, and the projection warning became the
  list's column heading ("Proj" rather than "FPts"), which costs no height.
- **FPL's fixture difficulty crossed into the football layer.** `Fixture` now
  carries `homeDifficulty`/`awayDifficulty` from `team_h_difficulty` /
  `team_a_difficulty` (probed live, 19 Aug), and `Opposition` carries the rating
  for the club being asked about. It is FPL's opinion and printed as such —
  unrated is drawn neutral rather than given a middle score we invented.
- **Tailwind v4 drops a theme variable whose name never appears literally in
  scanned source.** `var(--color-fdr-${n})` emitted nothing and shipped five
  colourless chips. `FixtureChip` writes the five names out in a `Record`, with
  the reason on the constant.
- **`getTeamRosterInfo` gives a whole squad's points in one public call**, so the
  list view has a real stat column. `yearToDate` and `readTeamStats` moved out of
  the player page into `app/teamStats.ts` — two `unstable_cache` calls with the
  same key are two definitions of one cache.

Two recorded rule exceptions from this work, both §3 and both deliberate:

- **The squad list spells position letters out.** "Never translate Fantrax's
  vocabulary" is the rule, and `getLeagueInfo` was probed again on 19 Aug to see
  whether it publishes long names: it does not — `rosterInfo.positionConstraints`
  and every `playerInfo[].eligiblePos` are bare letters. A readable heading can
  therefore only come from us. `POSITION_NAME` in `SquadRows` covers the four
  letters this league uses and **falls back to the raw letter**, so a
  commissioner who files wingers under W still gets "W".
- **Two touch targets below `min-h-11`.** The squad board's view toggle and the
  list row are `min-h-9`, at Craig's direction, to fit the pitch on a phone
  without scrolling and to get fifteen rows onto one screen. Everything else in
  the app keeps the 44px target.

Refactor pass over all of it the same day, against §1 and §2:

- **`squadDetail()` in `join/`, and the join moved to the server.** The pitch,
  the list and the card each ran `isResolved(x) ? map.get(x.player.clubId) : …`
  against the club map and the fixture map — the third copy is what makes it a
  rule. Worse than the duplication was where it ran: on the browser, which meant
  the RSC payload carried all 20 clubs and every fixture in the round so fifteen
  players could look two of them up. One pure, tested join now happens in the
  route and the views receive `SquadPlayerDetail`.
- **`PlayerSticker` takes the club it draws, not the directory to find it in.**
  Same reason: two callers were doing the lookup and one was doing it twice.
- **Three bugs the refactor surfaced.** A player missing from Fantrax's points
  table rendered no cell at all rather than a dash, so one row in fifteen lost
  its last column; every sticker button on the pitch carried the same
  `aria-label` ("D — open player card") so a screen reader could not tell five
  defenders apart; and a slot with no position at all printed an empty heading.
- **The pitch geometry is derived, not drawn.** `PitchTurf` was fourteen
  hand-measured path strings, and moving one line meant re-deriving the other
  four by hand. It now holds two picture decisions (`FAR_INSET`, `SPLAY_END`), a
  marking scale, and the real dimensions of a pitch in metres; every path is
  computed. The `clipPath` went with it — it needed a document-unique id and the
  component can appear twice — so the mow bands are trapezoids by construction.
- **`--pitch-boards` is one value.** The hoardings' height was written three
  times: the boards, the turf that starts under them, and the padding that keeps
  the far row clear. They had already disagreed once.
- **The board cannot render empty.** It is built exactly when the gate is closed
  and the route branches on its existence rather than re-testing the display, so
  there is no arrangement that renders a board with nothing on it — and
  `getTeamRosterInfo` is no longer requested on the two paths that never show it.

**Caught in review, before it shipped: the board was handing out the lineup.**
`SquadBoard` is a client component, so `SquadDetailLine[]` is serialised into the
page — and `SquadPlayerDetail` carried the whole `RosteredPlayer`, `slot.status`
included. A rival's squad in `squad` mode shipped **eleven ACTIVE and four
RESERVE** in its own source while the screen withheld the lineup, which is
exactly what `visibility.ts` exists to prevent and what it means by "the app is
the only place that could leak it".

The ordering was already handled — `squadUnarranged` sorts by name for this
reason — but ordering is what the *screen* shows and the payload is a separate
question. `squadDetail` now blanks `status` on the way out, with a test that
asserts neither word appears in the serialised lines. The old `SquadList` was a
server component and never had the problem: the regression came in with the
client boundary, which is where this class of bug always comes from.

## The portraits had been two years stale and nothing said so (19 Aug 2026)

Craig looked at a squad and said the shirts were wrong. They were: Isak in
Newcastle black two clubs later, João Pedro in Brighton stripes at Chelsea.

`resources.premierleague.com/premierleague/photos/players/250x250/p{code}.png`
answers **200** and serves the set as it stood on **14 Aug 2024**. That is the
whole reason it went unnoticed — there is no 404 to catch, no error to log, and
the only symptom is a footballer in last season's kit, which looks like a
photograph rather than a bug.

The current path was found by reading FPL's own production bundle rather than by
guessing at prefixes:

    …/premierleague25/photos/players/110x140/{code}.png

Three things changed at once — the prefix, the size, and the loss of the `p`
before the code — which is why every plausible guess had 403'd. `premierleague25`
is theirs and is **not a season number**: this is 26/27, `premierleague26`
answers 502, and the assets under 25 are dated Aug–Sep 2025. It is recorded in
`config.ts` with the probe date and must never be computed from the season.

Two things this exposed:

- **`next.config.ts` allow-lists image paths, not just hosts.** A pattern naming
  only `/premierleague/**` fails every portrait at our own optimizer — a 400 from
  us, which looks like a CDN problem and is not.
- **The two sets are not nested.** Of 60 players sampled: 43 have a current
  photograph, 35 an old one, 31 both, 13 neither. The old path was briefly kept
  as a second choice for the four who are only in it, Bruno Guimarães among them,
  and that was wrong: it put exactly those four back in the shirts they wore two
  clubs ago, which is the failure the move was fixing. Craig's rule, and it is
  the right one — **a player whose photograph is missing and a player whose
  photograph is out of date get the same answer: his club's crest.** A wrong
  photograph is worse than none, because only one of the two looks like an
  answer. `StickerFace` falls current → crest → initials.

  The limit of it: "out of date" is only detectable as "absent from the current
  set". A photograph taken inside the current set and overtaken by a January
  transfer looks identical to a good one, and nothing marks it.

The crest badge came off the sticker's corner in the same pass. It was there to
name the club a stale photograph contradicted, and that job is done. The crest
that stands in for a missing photograph grew to fill the card it is replacing.

Two pitch corrections the same day, both from Craig looking at it:

- **The touchlines could not stop splaying.** They ran outward in perspective and
  then went square at 38% of the depth, where the grass did. An eye still
  following the line reads that stop as the pitch turning back in. One straight
  taper over the whole depth now, and the earlier "reach full width sooner" was
  buying width the cards never needed — they are sized against the frame, not the
  turf.
- **The pitch has no surround.** Outside the taper is the page, as on FPL's.
  A second green out there reads as a second surface and turns the pitch into a
  bordered panel. `--color-pitch-surround` went with it.

Still open: the view reads the snapshot's own gameweek. Browsing a *future* round
needs a gameweek in the URL, a snapshot fetched for it, and `getTeamRosters` asked
for the matching period — the fixtures come free, the roster does not.

## `docs/ui/` — the handover to whoever does the visual pass (19 Aug 2026)

One file per route, plus `conventions.md` for the token registers and the shared
components. It describes what is on each page, every state it can reach, and
where it is weak — and it names the four things a redesign may not break: the
lineup gate, provenance at the point of use, absence modelled rather than
defaulted, and the phone-first touch targets.

It is documentation of the app as built, not a plan. When a page changes, its
file changes in the same commit or it starts lying.

## The owner's lineup screen, and the refactor after it (19 Aug 2026)

Your own team gets a planner: the XI on the grass, the bench on a dark strip
below it, a swap target and an options badge on every player. Two ways in,
because they answer different questions — tapping the card **picks** a man and
the pitch dims everyone he cannot legally change places with, while the ⇄ opens
the full list, which is the only place a move with no second player (off to the
bench, across to another position) can be offered. Every rule enforced is the
commissioner's, straight out of `moves.ts`; none of it is new logic.

Two interaction bugs found by using it. The options sheet rendered in the flow
below the bench, which on a phone is a screen and a half beneath the man you just
tapped, so tapping him looked like it had done nothing — it is a dialog now. And
a full XI made the sheet offer eight ways into midfield and then say midfield was
closed, because `eligibleSlots` reports `squad-full` for a position that
`legalMoves` is simultaneously offering swaps into.

The refactor pass afterwards:

- **`PitchRows`.** Three screens draw players in lines — a rival's XI, a rival's
  whole squad, your own lineup — and had drifted into three answers to the same
  two questions: how wide is a card, and what happens when a line will not fit.
  One of them still wrapped, with sizes from an earlier design. The cell is what
  varies, so the cell is what each caller now supplies.
- **Shrink, never wrap.** The old rule was the opposite and it was wrong: a back
  five wrapped one defender onto a row of his own, which reads as a formation
  nobody picked. With seven in a line the outer two also hung off the tapering
  grass onto the page, so row padding became a share of the width.
- **`--page-gutter` / `.bleed`.** The page's side margin was written out in three
  files, twice as its own negative.
- **The unresolved card was a different shape** from a resolved one — one box at
  its own proportions — so it left a hole in any row where the bridge had not
  settled somebody. It is built from the same three bands now.

## The extension plan is dead, and it was dead on arrival (19 Aug 2026)

"Members provide their own Fantrax session cookie via a browser extension" has
been the recorded answer to the write problem since 5 Aug. Craig killed it in one
line: **regular users won't do this, and most users are on mobile.**

Both halves are right, and the second is fatal on its own. Chrome on Android has
no extensions. Safari on iOS has them, but they are a per-user App Store install
and a permissions dance, for sixteen friends who want to move a midfielder to the
bench. Nothing about that survives contact with a group chat.

What is left, in order of how much it asks of a member:

1. **The commissioner's session plus `adminMode`.** `confirmOrExecuteTeamRosterChanges`
   takes `fantasyTeamId` and `adminMode` (CLAUDE.md, probed 3 Aug), so a
   commissioner session may be able to set *any* team's lineup. That would mean
   one cookie, held by one person who is already in the habit of refreshing it,
   and members authenticated by the team codes we already issue. A member needs
   to know nothing. **Unprobed** — whether `adminMode` actually writes another
   team's roster is the question the whole path rests on, and it is answerable
   safely against the rehearsal league, whose four teams belong to nobody.
2. **A native shell with a webview login.** Open Fantrax's own login in a
   webview, let the member clear reCAPTCHA and 2FA there, keep the cookie the
   webview collects. This is how everyone else solves it. It also means we are
   shipping an app to sixteen phones, which is a different project.
3. **Deep-link and let Fantrax take it.** What we do now, but pointed at their
   app rather than their website. Costs nothing, asks nothing, and the value we
   add stays where it already is: the planning, with the commissioner's rules
   enforced and the fixtures and difficulty on screen. Submitting was never the
   hard part of a lineup.

Cookie expiry bites option 1 in a way worth naming: one stale cookie takes the
write surface down for all sixteen at once, so it needs a visible staleness
state and a path back to "open Fantrax yourself", not a spinner.

## The live head-to-head, and what a score is allowed to say (19 Aug 2026)

`docs/ui/matchday.md` named the biggest hole in the app: the live view could say
a manager was on 47 points and could show him Arsenal against Coventry, and
never once said which of his own players had done it. The score was a number
with no players behind it.

`/league/matchups/[teamId]` is the answer, and the layout is taken from the
sister repo's Duel screen (`~/worldcup-fantasy`, `app/components/MatchupBoard.tsx`):
two tabs carrying the two totals, a momentum bar under them, and the open tab's
eleven on the grass below. Two tabs rather than two pitches — thirty players on a
phone is fifteen unreadable ones, and the tab a manager is *not* looking at still
answers the question he is asking at 4pm.

**No new Fantrax read.** The board is composed entirely of calls the app already
makes and already caches: `getTeamRosters` for the elevens, `getLiveScoringStats`
for the totals, FPL's live endpoint for what each player has done.

### Per-player points, and where they actually come from

`getLiveScoringStats` does not carry them — `statsMap` and `statsMap2` are `{}`
in every capture, so what they hold once football is on is still unknown.
**`getTeamRosterInfo` does**, it is public, and **it honours `period`**: probed
live 19 Aug against periods 1 and 3, `displayedPeriod` echoes the request and
`periodOppnentTeamIds` changes to match. So the board prices the week on screen
rather than whatever week Fantrax happens to be pointing at, and `fetchTeamStats`
grew an optional `period` for it.

One read per side, cached. A refusal costs the numbers and nothing else: that
side's players fall back to their **minutes**, told apart by the apostrophe. One
table either arrives or it does not, so a side never mixes points and minutes.

The scoreline is Fantrax's, under Fantrax's scoring. What each player *did* —
goals, assists, clean sheet, minutes — is **FPL's**, joined through the bridge.
Two providers on one card, and neither is recomputed.

### The gate is per side, not per page

`teamDisplay(squads, yours)` is asked twice, once per side. Your own eleven is
yours all week; a rival's waits for his period to open. During live football both
are open by definition — but this is also the screen a manager reads on a Tuesday
to see who he plays, and then exactly one of the two is. A gated side shows one
sentence and a link to that team's squad page, which is where the reasons are
already spelled out; it does not grow a second copy of them.

### `headToHead`, and the third occurrence

`periodPairings` reports Fantrax's home and away because that is what the
schedule says. Every screen that shows a head-to-head to a *particular* manager
immediately undoes it — there is no ground, so neither side is at home, and a
manager reads his own team first. Three screens had written
`pairing.home.teamId === mine ? … : …` for themselves, which is §1's third
occurrence. `headToHead(matchups, teams, period, teamId)` answers
`{ team, opponent }` and all three now read it.

### Accent still means "you"

The leader is deliberately not accent-tinted, which is what the sister repo does.
Accent means "your team" on five other screens (`mine.ts` says so in as many
words) and marks your name on the scoreline here, so a second meaning for it
would break a reading aid rather than add one. Whoever is ahead reads at full
strength; the side behind is dimmed.

### Three things the design lost on contact with Craig, and one it gained

The first pass had two stacked tab-cards, a momentum bar under them, a count of
players still to play on each, and a provenance line. All four went:

- **The scoreline is one row.** `123 · 59.1 · v · 63.2 · test3`, read the way a
  score is said out loud. Two stacked cards made a reader compare two numbers in
  different places on the screen, which is the one thing a scoreline exists not
  to make you do.
- **The momentum bar is gone**, and `momentumShare` with it — §2 does not let an
  unused export sit in the tree, so the module and its tests were deleted rather
  than kept warm for a bar nobody wanted.
- **"n to play" is gone.** Everyone who has not kicked off is drawn back on the
  pitch instead, which names them rather than counting them, and his strip
  carries his fixture. The greying already existed (`PlayerImage` had it at
  `opacity-80`); it moved up to the whole card at `opacity-55` so it reads as a
  state rather than a rendering artefact.
- **The provenance line is gone**, which is a real cost against principle 4 and
  is recorded as one. The line still runs on `/league/matchups`, where sixteen
  cards of nothing but numbers precede it.

What it gained is a **bench** and a **Pitch/List toggle**. `Pitch` used to stand
all fifteen on the grass with reserves marked by a word; it now draws the eleven
and a bench strip, which took `squadInLines()` out of core with it — its only
consumer had stopped being one.

### What the dummy Saturday caught

The preview harness (`scratchpad/preview/`, a `fetch` shim under `NODE_OPTIONS`,
no repo code) invented a gameweek an hour into its 3pm kick-offs. Two bugs that
only exist with live data surfaced within a minute of looking at it:

- **A player's minutes printed as "9".** Three chips and a number do not fit a
  56px card, and the flexbox chose the number to cut. Chips are ranked now
  (`Chips.tsx` — RC, goal, assist, clean sheet, saves, booking), capped at two,
  and the number is `shrink-0`: a clipped chip is untidy, a clipped number is
  wrong.
- **A booking rendered as a blank box.** The `note` tone was `bg-white/15
  text-white`, written when the strip was dark. The strip is cream now and the
  same chip also renders on a dark list row, so the tone is solid — anything that
  borrows its ground is legible on exactly one of the two.

`tally()` moved out of the component into `join/contribution.ts` on the way,
where §5 puts arithmetic over football data, and picked up the tests it never
had — including the one that matters: `every()` on an empty list is true, which
would have credited fifteen players with a clean sheet apiece before a ball was
kicked.

### Where the taps go now

Tapping a team on `/league/matchups` opens the board on that team rather than
that team's squad: both sides of a card lead to the same head-to-head, and it
arrives showing whichever name the thumb landed on. `YourMatchup` on the live tab
does the same. Each squad is one further tap, from there.

## The pitch views, after a fresh-eyes pass (19 Aug 2026)

Craig asked for a UX review of the three screens that draw a pitch — the live
head-to-head, the gated squad board, and your own lineup planner — and a round of
fixes. What the review found, and what each fix cost.

### The score was the smallest thing on a live pitch

A player's points sat at eight or nine pixels beside two chips, on the same cream
plate as his name. On the one screen a manager opens *because* of the number, the
number was the hardest thing on it to find.

The fix is a band rather than a size: once he has played, the bottom band flips
to `bg-bg` with cream numerals at `clamp(9px,16cqw,13px)`, and the chips read
better against it than they ever did against cream. Until he plays, that same
band is his FDR fixture at full strength. The two never share the space.

Both states are one fixed height (`h-3.5`), and that is load-bearing: a row where
a played card and a waiting card stand at different heights stops reading as a
row. `FixtureChip` had to learn to centre its text by grid rather than by line
height, because the colour is now asked to fill a box it does not define.

**The height is a budget, not a preference.** The board is documented as fitting
390×844 without scrolling, and it did — at exactly 844. A 16px band took it to
863. The band is 14px and `PitchFrame`'s row gap went from `gap-5` to `gap-4`,
which puts it back at 844 with the bigger number. Anything added to a pitch card
comes out of that same 844.

### Dimming the whole card said the wrong thing

A player still to play was drawn back with `opacity-55` on the card, which took
the FDR colour and the name with it — the two things a waiting player still
needs. Only the photograph dims now (`opacity-80 grayscale-[35%]`, on the `<img>`
inside `PlayerImage`), and the plate and the fixture stay at full contrast. It
also freed `opacity-30` on the planner to mean one thing: blocked.

`FixtureChip`'s blank case was quietly broken by the same history. It drew light
grey ink on whatever it was sitting on, which was fine on three dark surfaces and
invisible once the band under a player turned cream. It brings its own `raised`
ground now, exactly as a rated fixture brings its FDR colour.

### The live board had no answer to a tap

Eleven faces, a score, and nothing behind either. `TeamSheet` replaced the server
`Pitch`: same eleven and bench, every card a button, and `LivePlayerCard` over
the top. The squad page's rival branch draws the same component, so "why is he on
12" has one answer wherever it is asked.

The breakdown costs **no new read**. `getTeamRosterInfo` with `view: "FPTS"` was
already being called once per side for the points column, and the same response
carries each total broken into the league's own scoring categories — they sum to
it exactly (verified 30/30 rows, 13 Aug). `league/breakdown.ts` pairs each
group's columns with each line's values, drops null and 0, and sorts largest
first. Games played falls out by being 0 in that view, which is also why their
own table leaves it out of the sum.

That file is the rule of three arriving on time: the player profile's season
table (`players/[fantraxId]/season.ts`) and its label-splitting
(`Breakdown.tsx`) were doing the same pairing and the same `" -- "` split, and
the live card would have been the third. `BreakdownLine` carries the label and
the definition apart, so no view does string surgery on provider data.

**Two player cards, deliberately.** `PlayerCard` answers "who is this and is he
fit"; `LivePlayerCard` answers "what is he scoring and why". Same dialog
skeleton, different questions, opened on different days. Folding them into one
card with a flag would make the midweek card carry an empty table and the
Saturday card carry a fitness note nobody is asking about at 4pm.

### The `+1` came off the scoreline

Pending clean sheets rode beside each total as a green `+n`. A scoreline is the
one place a reader expects a single figure, and a second one beside it — ours,
provisional, and in the colour that means "your team" on this very screen — asked
him to do arithmetic Fantrax will do for him within the hour. `pendingByTeam`
stays: the matchups list and `/matchday` still show it, on cards with room to
label it.

### Fifteen badges to offer a move most taps are not after

Every planner card carried an accent badge opening the full move list, over the
only thing on the screen worth looking at. Meanwhile the second tap on a picked
player did nothing but put him back down — which closing the dialog already does.
One target per card now: tap to pick, tap again for `MoveDialog`.

### The taper, and the number that was written down twice

`FAR_INSET` was 11 — a goal line at 78% of the near width, steeper than FPL's own
app. Two things were wrong with it and only one was taste. The row padding that
keeps a line inside the touchlines is a single figure for the whole column, so at
that angle either the near rows gave up a fifth of their width or the back row
stood off the pitch and onto the page. It stood off the pitch.

It is 5 now (90% at the goal line), and the padding *is* the inset, so the two
cannot disagree: `PitchTurf` exports `FAR_INSET`, `PitchFrame` sets it as
`--pitch-inset`, and the hoardings read the same variable instead of repeating
`11%` under a comment asking the next person to keep them in step.
`BOX_STRETCH` and `BOX_FLATTEN` moved toward 1 (1.25 / 0.85) because both were
paying for foreshortening the gentler taper no longer has.

The centre circle was on the review list for colliding with the midfield plates.
It was left: at the softened angle the halfway line and the circle pass through
the photographs and above the plates, which is what they do in FPL's own graphic
and on a Saturday. `HALFWAY_DEPTH` is where to move it if that reading changes.

### Verified

Four green, and screenshotted at a true 390×844 through CDP — `--window-size` is
not a viewport on macOS, which has a minimum window width, so a plain
`--screenshot` silently crops a wider layout and every check reads as an
overflow. Live board, breakdown card, yet-to-play card, list view, rival squad,
planner picked, planner tap-again. The breakdown's arithmetic was confirmed on
screen by seeding the recorded fixture through `squadPoints`, because the
rehearsal league's own table is all noughts: 68 + 32 + 18 + 9 − 9 − 10 = 108,
against a total of 108.

## The schedule became a gameweek, and a competition became data (20 Aug 2026)

The schedule was thirty-eight collapsed periods with the current one open
somewhere down the scroll, every row labelled `P4 · Gameweek 4`. Craig's note was
"I'm seeing period 1 and gw1, just use gw1", and it is the right call twice over:
the two numbers are the same all season (`npm run periods` confirms 38 of 38),
and printing one number under two names asks a reader to work out whether they
are the same thing.

**The page now speaks gameweeks and never periods.** Fantrax still scores in
periods and is still queried in them; the translation happens once, in
`app/league/schedule/schedule.ts`, through `periodGameweeks` — the same one-way
seam, unchanged. Nothing in the league layer learned a new word.

It opens on the round a reader came for: FPL's own current-or-next answer, taken
straight off `footballNow().gameweek` and narrowed to a gameweek the league
actually covers — a season joined at gameweek 6 has no gameweek 1. That round's
scores come with it, and because `getLiveScoringStats` honours `period`, a
gameweek that has been played comes back with the totals it finished on. **The
archive was free.** Nothing has been played in either league yet, so the
full-time treatment — a winner marked, "Full time" instead of a live dot — is
written and unwitnessed until the 21 Aug weekend.

### Custom competitions, un-parked as a placeholder

The roadmap parked custom competitions on 19 Aug. This un-parks the *shape* and
not the feature: `league/competitions.ts` declares a cup (semi-finals in gameweek
4, final in 5) and a playoff (final in 38, top two), and the page can hold ties
from more than one competition in the same gameweek — which is the thing the old
schedule had no way to express, because Fantrax's own pairings were the only
fixtures on it.

Fantrax describes exactly one competition and has no vocabulary for a second, so
the knockouts are ours and are declared as data, resolved purely, and labelled
**Placeholder draw** on screen. Two decisions inside that are worth keeping:

- **A tie side is a table place or a phrase, never an invented team.** A number
  is seeded against the standings as they stand — `1` is whoever is top when the
  round comes round — and a string is printed verbatim. That is what lets the
  cup final say "Winner, semi-final 1" instead of seeding a team into a final it
  has not reached, and what lets the real league (no teams until 10 Oct) draw a
  playoff final between "1st" and "2nd" rather than between two names we made up.
- **The score beside a cup tie is the gameweek's score.** A cup over fantasy
  points is scored by the week's points; Fantrax's total for that period is the
  same number whichever competition is being played on it. The page says so once
  at the foot rather than sixteen times in the rows.

When the commissioner settles a real cup, `PLACEHOLDER_ROUNDS` is what changes.

### Team badges are public, and the URL Fantrax publishes is broken

`getStandings` **on fxpa** — a different read from the fxea method of the same
name, which answers the table — carries `fantasyTeamInfo`, keyed by team id, with
the badge each manager picked. It needs **no cookie**: probed anonymously against
both leagues on 20 Aug, the rehearsal league answers four badges and the real one
answers `{}`. That is why a badge can appear beside a name before anyone has
signed in, and it is the reason we did not have to reach for `getMatchups`, which
carries `logoUrl128` and needs a cookie.

**Their field lies twice.** The key is `logoUrl512`; the value it holds ends
`_256.webp`; and 256 is the one size their host does not serve. Probed against
all four of the rehearsal league's badges: `_128` and `_512` answer 200, `_256`
answers 404 on every one of them. Their own site must build these paths rather
than use the field it publishes. `mapTeamBadges` rewrites the size to 128 — the
badge is drawn at 26px, so 128 covers a retina phone twice over at 4.7 KB against
24 KB — and passes through any path not shaped like theirs, because a size
guessed onto a path we have never seen is an invented asset.

`fantraximg.com` is now allow-listed in `next.config.ts`, path-scoped to
`/assets/images/icons/fantasyteams/**` like every other remote pattern there.

### A dev-server trap that cost half an hour

The running `next dev` served a **week-old `getLeagueInfo`** — periods generated
19 Aug at 06:18 EDT rather than the real 21 Aug 15:00 boundaries — while a
direct `curl` to the same URL, and the on-disk `.next/cache/fetch-cache` entry,
both had the current one. The symptom was three gameweeks quietly missing from
the dropdown and the period↔gameweek mapping shifted by three, which reads
exactly like a bug in the calendar seam and is not one. **A long-lived dev server
can hold a stale fetch response past its `revalidate`.** If a provider payload
looks wrong, `curl` it before reading any of our own code: restarting the dev
server fixed it outright.


### The scoreline is one row, and a season costs one request (20 Aug 2026)

Second pass on Craig's notes. Four of them were the design saying what it had
already said and I had missed: **a scoreline is one row** (his call, 19 Aug, and
recorded in the roadmap — I had stacked the two sides), the date should be the
**deadline** and not the first kickoff, the "To play" chip under the dropdown
said nothing a future date did not, and the provenance footer went.

**The footer's removal is a deliberate exception to principle 2** and is recorded
in `docs/ui/league-schedule.md` rather than quietly dropped. This is now the only
page whose numbers do not name their owner. The refusal line stays — that is an
error state, not provenance, and a page claiming to show points while showing
none of them is the failure that line exists to prevent.

**`getStandings?view=SCHEDULE` is the whole season's results in one anonymous
request.** Probed 20 Aug: 38 tables, one per period, each captioned by Fantrax as
"Gameweek N" and carrying one row per pairing with both team ids and both totals.
The argument is not a guess — `displayedLists.tabs` on the plain standings read
names the tab `SCHEDULE` and labels it "Results", which is CODE_RULES §3's
server-driven list doing exactly what it is for.

That is what makes a fixture list affordable: thirty-eight `getLiveScoringStats`
calls to draw one screen is not a trade worth making, and one call is. It does
**not** replace the live read on the per-gameweek view — that one carries a total
that moves during a match and a count of who is still to play. Different
questions, different screens.

`mapSeasonResults` reads rows position-independently: a cell that names a team is
followed by that team's total. The column order is theirs to change, and the two
`fpts` columns share a key, so keys alone cannot disambiguate them. The caption is
parsed as a **period** number, not a gameweek — Fantrax's word for the period is
"Gameweek" and the two are one-to-one this season, but they are not the same
claim and the mapping belongs to `periodGameweeks`.

### The lineup deadline, settled from the commissioner's own settings page

Craig corrected an earlier version of this section, and the correction was right.
The lock is **fifteen minutes before the round's first kickoff**. Read off
`createLeague.go?goto=5` with the commissioner cookie, which is the only place
Fantrax states it — no API we read carries a lock or deadline key at all:

- `lineupLockType` = `TIME_BEFORE_FIRST_GAME` — "Set amount of time before 1st
  game of period"
- `lineupLockTimeBeforeGame` = `00:15`
- `lineupPeriodType` = `GAME_WEEK`, custom periods `ALIGNED`

The other option Fantrax offers is `TIME_BEFORE_FIRST_GAME_OF_SCORER` — a
per-player rolling lock. This league does not use it, so there is one deadline a
week and it is a real thing to print.

`LINEUP_LOCK_LEAD_MINUTES = 15` in `config.ts` was already right. What was wrong
was the instant it was subtracted from.

### The period boundary is not the first kickoff, and `deadline.ts` said it was

The worst thing found this session, and it predates this work. `deadline.ts`
asserted "the period boundary it does publish is kickoff", and the paper's
masthead is built on it. Probed across the live calendar on 20 Aug:

| period | roster period opens | that gameweek's first kickoff |
|---|---|---|
| 1 | Fri 21 Aug 20:00 | Fri 21 Aug 20:00 |
| 3 | Fri 4 Sep 20:00 | Fri 4 Sep 20:00 |
| 4 | **Fri 11 Sep 11:00** | Sat 12 Sep 15:00 |
| 6 | **Fri 9 Oct 11:00** | Sat 10 Oct 12:30 |
| 20 | **Tue 5 Jan 11:00** | Wed 6 Jan 20:00 |

A gameweek with a Friday night match opens exactly at that kickoff. One without
opens at 11:00 BST on the Friday regardless — a day early. The assumption is true
for the four periods anyone has looked at and false for most of the season.

**The masthead had been announcing the wrong deadline for most of the season**,
by a day, every week whose gameweek has no Friday night match. `nextDeadline`
now takes the season's kickoffs and measures back from the first one inside the
period. It also answers a different question than it used to: the earliest lock
still in the future, rather than the next period to *open*. Those differ for a
whole day every time a period opens on the Friday for a Saturday round — at
Friday lunchtime the next period to open is next week's, while the deadline a
manager actually has to beat is tomorrow afternoon's.

`gazette/deadline.ts` now declares `GameweekKickoff` through `league/calendar`
rather than importing a `Fixture`, so the football calendar reaches it the same
one-way way it reaches the period mapping. `app/football.ts` grew
`seasonFixtures` / `seasonKickoffs` beside `footballNow`, which also removed the
schedule's own duplicate fetch of the same 380 fixtures.

**For 10 Oct: the real league's first lineup locks Sat 10 Oct at 12:15 BST**,
fifteen minutes before Saturday's first kickoff.

### A played head-to-head, and the one thing still unproven

The schedule's rows now route by what the football has done: a live or played
round opens the head-to-head board, a round still to come opens the squads. That
needed `/league/matchups/[teamId]` to stop being hard-wired to the current
period, so it takes `?gw=`, `getLeagueSquads` takes an optional round, and
`fetchTeamRosters` takes an optional period.

`getTeamRosters?period=N` is honoured and echoed for all 38 periods (probed 20
Aug), and every one of them currently returns an identical roster — which proves
nothing either way, because nobody in the rehearsal league has ever made a lineup
change. So **whether a past period returns the eleven that was actually fielded
is still unverified**, and the board says so on screen rather than implying it.
Fantrax's product is a lineup per period, so it very probably is history; "very
probably" is not something to print without a hedge. This is HANDOVER's 28 Aug
item, now with a screen depending on the answer.

Also gone, on the same pass: "Period 1 · Gameweek 1" on both matchup screens.

### A third dropdown, and no more phantom goalless draws

Craig's last two notes. **A fixture that has not been played is a fixture, not a
0–0.** Fantrax answers `totalFpts: 0` for every unplayed period, and the board
was printing it — a scoreline against a date in March, which is the confident
wrong number wearing the costume that looks most like an answer. A round still to
come now reads `test4 v test2`, and a fixture list row reads "To play".

The third dropdown is a **fixture list**: pick a team, get its whole season. It
replaces the "Your season" option that briefly lived in the gameweek select —
the reader's own team is simply first in the list and named `(you)`, which
answers the same question and fifteen more. `seasonRows` already took a team id,
so the generalisation was a prop; what changed is that its two score fields are
now `pointsFor`/`pointsAgainst` rather than `yours`/`theirs`, because they are no
longer necessarily yours.

It sits on its own row. Three selects across a phone leaves each too narrow to
read the option it is showing, and a control whose value you cannot read is not a
control.


### The refactor pass over all of it (20 Aug 2026)

Craig asked for a rule-of-2/3, debloat and de-hardcode sweep once the feature
was working. What it actually turned up:

**One latent bug, from duplication.** The schedule worked out "which round does
the reader mean" in two places — the gameweek branch and the fixture-list branch
— and the two had drifted to *different fallbacks*: one ended on the season's
last round, the other on its first. Neither is reachable today, both would be
reachable the moment the league's calendar starts after FPL's. Now one
`chooseRound`, called twice. This is the rule of 2/3 earning its keep: the
duplication was the bug, not a symptom of one.

**One wasted request per view.** The board fetched `getLiveScoringStats` for the
round on screen whether or not it had been played. Fantrax answers for any period
asked, so browsing March cost a request per gameweek for totals the board had
already decided not to print. Gated on `kickedOff` now.

**Three rule-of-3 landings, and two of them were pre-existing:**

- `kickedOff(status)` in `football/selectors.ts`. "Has any football happened in
  this round yet" is the question that decides whether a score exists at all, and
  the scoreline, the fixture-list row and the row assembler each asked it their
  own way.
- `yoursFirst(items, isYours)` in `app/mine.ts`. The paper's doubts column had
  its own copy, the matchups board had another, and the schedule's team picker
  made three. They sort different shapes — a note, a pairing, a team — so the
  question is the argument. `mine.ts` already owned the other half of the same
  reading aid (the accent border), so it was the obvious home rather than a new
  file.
- `TeamBadge` now takes the team and the badge map rather than a name and a URL,
  which deleted the same pair of null checks from both call sites.

**Deliberately NOT abstracted**, so nobody re-opens it: the nine-plus
`unstable_cache` wrappers. This session added five more and the trigger is
firing harder than ever, but HANDOVER parks `leagueCache()` until after the GW1
weekend and a refactor mid-feature is the thing CODE_RULES §7 forbids.

**Debloat.** `SeededRound`, `CompetitionGroup` and `Competition` came off
`league/index.ts` — all three are inferred at every call site and §2 does not
keep an export nothing imports. `Controls` now builds its own option labels
instead of the page assembling three `{value, label}` arrays for a component
that only printed them, which took `page.tsx` from 258 lines to 213 and put the
labels beside the control that shows them.

**A name that had stopped telling the truth.** `yours.ts` became `teamSeason.ts`
when the fixture list generalised from the reader's own team to any of the
sixteen, and its two score fields went from `yours`/`theirs` to
`pointsFor`/`pointsAgainst`. That is an explicit refactor trigger in CODE_RULES
and it fired within an hour of the rename becoming wrong.

**Hardcoding found and moved:** the route path in `Controls`, which the form
posted to and the router pushed to separately. Everything else was already a
named constant with its reasoning attached — `SIZE` in both badge files,
`PLACEHOLDER_ROUNDS`, the caption regex. The `view: "SCHEDULE"` and `view:
"FPTS"` literals stay inline beside the method that sends them, matching what
was already there.

**Checked and clean:** no Map or Error instance crosses an `unstable_cache`
boundary; no `any`, no non-null assertions, no unused imports; and the schedule
serialises no lineup to the client — `Controls` is its only client component and
it carries gameweek numbers, competition ids and team names, all public all week.
Grepped the rendered source for `ACTIVE`/`RESERVE` on all three schedule views
and on the head-to-head board at a past, present and future gameweek: zero hits
on every one.


### The adversarial pass, and the one that would have hit every weekend

An independent review of the whole changed surface. Five real defects, one of
them the worst kind — correct on every day it was tested and wrong every
Saturday.

**1. A part-played round reported "upcoming", so the board hid scores it had.**
`gameweekStatus` is a three-state label: live if any match is, finished once all
are, upcoming otherwise. At six on a Saturday evening — nine results in, a Monday
night match to come — nothing is live and it is not finished, so the round is
"upcoming". That is *right for a caption*; a full-time label on it would be a
lie. The mistake was reading the same enum as "has any football happened",
which is a two-state question a three-state label cannot answer.

The consequence: every tie printed `v` instead of its scoreline, every fixture-
list row said "To play", the rows stopped linking to the head-to-head, and
`getLiveScoringStats` was never called — then on Monday night the last match
kicked off, the round flipped to "live", and all nine results appeared at once.
Scores, then no scores, then scores, inside one gameweek.

Worse, this session had *introduced* the bug while doing the opposite of the
right thing: `kickedOff(status)` was landed as a rule-of-2/3 abstraction over
three consumers, which made one wrong answer authoritative in three places at
once. **An abstraction over the wrong fact is worse than the duplication it
replaced.** Gone, replaced by `gameweekStarted(fixtures, gameweek)` — asked of
the fixtures, where the answer actually lives — surfaced as `ScheduleRound.started`
so the three views read a fact rather than re-deriving one.

**2. The fixture list marked a winner at half-time.** The scoreline guards it
with `status === "finished"` and says why; the season row only checked that a
score existed. Live on a Saturday, `?team=X` bolded a 30–25 lead as a win while
`?gw=7` showed the same fixture unmarked. Two answers to one question.

**3. `mapSeasonResults` could pair a team with another team's score.** The
comment claimed position-independence; what it actually assumed was
team-then-score *adjacency*. A reordering to Away/Home/Pts/Pts — which the file's
own comment concedes is theirs to make — reads the second team's name as the
first's total. The NaN filter is not a net: **this league contains a team called
"123"**, which parses cleanly as a hundred and twenty-three. Now a score cell
must name no team, and there is a test with that exact reordering.

**4. Tapping a cup tie opened a different match.** The head-to-head route
resolves its pairing from Fantrax's *league* schedule and knows nothing about
competitions, so a played cup tie A v D landed on A v whoever-A-played-in-the-
league-that-week, with nothing on screen to say so. Only league ties open a
board now.

**5. A postponement would have produced duplicate rounds.** `calendar.ts` names
this divergence exactly: FPL keeps a rearranged fixture under its original
`event` while Fantrax scores it in the period it was played. So a replayed
gameweek 20 match inside period 25 puts gameweek 20 in *both* periods — two
identical entries in the dropdown sharing a React key, the second unreachable,
and a team's fixture list printing its week twice. `rounds` is deduped by
gameweek now, lowest period winning, and the fixture-list key is the period.

**Two wasted reads on the head-to-head board**, both pre-existing: `squadPoints`
was fetched for *both* sides regardless, though it is read only inside the branch
that has already decided to show a side's eleven — so the page's own main use
("who am I playing this week", read on a Tuesday) threw away one whole read, and
a signed-out reader threw away two. And `liveScores`'s refusal was dropped, so a
scoreboard outage rendered as silent dashes on the one board that did not say so.
Both fixed.

**Hardening, not a demonstrated bug:** `next/image` throws on a URL outside its
allow-list, which takes down a page rather than losing an icon — and
`getTeamRosterInfo` carries `logoUploaded`, so a manager uploading his own crest
is a state this league can reach. `FANTRAX_BADGE_BASE` is now in config and
`mapTeamBadges` drops anything not under it, which turns a 500 into an initial on
a disc. `next.config.ts` names the same prefix and says the two must move
together.

**The lineup gate held everywhere**, in both directions, on a past, present and
future gameweek — traced through the code and grepped in the rendered source.
One soft spot closed anyway: the gate keyed entirely on the period Fantrax
*echoed*, while the route already knew which period it had *asked for*. Trusting
the provider for something we already know is free to get wrong, so
`periodAsAsked` now falls the whole payload back to squad-only when the two
disagree — and `teamDisplay` honours it too, or the per-team path would have
re-opened every lineup one route at a time.

## The live tranche, built the day before the football (20 Aug 2026)

Eight commits against `we-had-ideas-for-peppy-fog.md`, all four gates green on
each. The roadmap had deferred the live-state designs until a real Saturday
could judge them; Craig chose to design the whole tranche the day before GW1
instead, which means **every state below is written and unwitnessed**. The
observation list at the foot is the point of that admission.

### The football layer learned the difference between "over" and "settled"

`fixtureStatus` collapses `finished_provisional` into `"finished"` — right for a
reader watching a score, and useless to anything asking whether the numbers have
stopped moving. `Fixture.settled` is now raw `finished` on its own, and
`FootballSnapshot.dataChecked` is FPL's `data_checked` for the round.

`roundFinished(snapshot)` reads the ladder: every dated match finished with bonus
outstanding → `bonus-settling`; bonus landed → `provisional`; FPL's sign-off →
`final`. **"Final" is claimed only at the last rung.** A manager watching his
total shift under that word would be right to stop believing the screen, so the
two rungs before it say full time and, while bonus is landing, say why.

Null while a round is in play *or* has not started — two states a caller may
render alike but must not conflate. Callers pair it with `isMatchdayLive` rather
than the selector inventing a fourth answer from the same evidence.

**It fixed the pink dot for free.** `MatchupBoard`'s `live` boolean was fed
`duringGameweek` — the window from the first kickoff to the last whistle, which
is the right question for *how often to poll* and the wrong one for *whether a
match is on*. Saturday tea-time between the 12:30 and the 15:00 pulsed LIVE with
nothing in play. The poll rate still reads `duringGameweek`; the word does not.

### The app became partisan about the football

`join/involvement.ts`: `fixtureInvolvement(team, fixtures)` and `owners(teams)`,
both pure, both keyed off **squad membership** — public all week — and neither
reading a lineup in either direction. A fixture with none of his players in it is
**absent from the map** rather than present-and-empty: the question is "is this
one mine", and an empty array is a yes-shaped answer meaning no.

On `/gw/[gameweek]` and `/matchday`, a fixture the reader has somebody in takes
the standard accent border and a counted `2 yours`; opened, it leads with
`Yours · Gabriel · Saka` above the contributions. **Counted, not tinted** —
fifteen players across ten fixtures marks most of the list, and every row marked
is no row marked. The Yours line sits *above* the contributions because it
answers a different question: `contributions` lists only the notable, and "which
of mine is in this match" has to include the man who has done nothing.

Every contributor now carries the squad holding him. A footballer nobody in the
league holds is **untagged** rather than tagged "—", which would be a label on
500 of the 697.

**Historical rounds mark from today's squad**, deliberately: "which of these
results matter to me" is asked on Monday by the man who owns those players now,
and a squad as it stood in week six needs a period read nobody has proven serves
history (still open, below).

### One scoreline grammar, on all three head-to-head surfaces

The matchups list was eight identical two-row cards; `/matchday`'s own card was a
third design for the same fact. Both are now the board's row — name · score · v ·
score · name — so the margin between two **adjacent** numbers is the answer and
no invented "close" threshold decides anything.

Only the *number* dims for trailing. A name that dimmed for losing would give
accent a second meaning, and accent means "yours" on six screens.

One real bug fell out of it: the old list hid "n to play" on **falsiness**, so a
side on a literal zero — everybody played, nothing left to come, the most
interesting state a side can be in — was the one state it never showed. It reads
`all played` now, and only while football is on: on a Wednesday every side has
nobody left and sixteen such labels state the obvious.

`RoundWord` was extracted at the third caller, and the two existing copies had
**already drifted** — the board printed the "bonus settling" caption and the
matchups list did not, so the same Saturday evening said two different things
depending on which screen you were on.

### /matchday: the board stays one tap behind (Option A, Craig's call)

Decided on design argument and recorded in `matchday.md` to re-ask with
Saturday's answer. The board's premise is that it fits a 390×844 phone, which it
cannot do stacked over a fixture list. So the card speaks the board's grammar and
the board keeps its size. The instrument for re-asking is the league chat.

New on the page: **your afternoon** — your ACTIVE players still to come, grouped
by kickoff, a live group showing the clock instead of the time. Two different
squads on the same page on purpose: the fixture markers key off membership, the
strip keys off your lineup. Your own lineup is never withheld from you, so this
withholds nothing from anybody; a reserve is excluded because he does not score.

### The Desk

`/matchday/desk`: eight head-to-heads and ten fixtures as one-line scores, yours
in accent, nothing else on the page. Reached from the Live tab and nowhere else —
six tabs already brushes the 320px clip `matchdayfit` measures.

Gillette Soccer Saturday borrowed **in voice and typography, not in colour**: the
app's tokens stay, because the colour registers are binding and Ceefax's are not
ours. A side on four or more prints the number in words after the digit —
`BOU 4 (FOUR)–1 LIV` — which is Sky's threshold and not one we invented, and
which is applied to **football facts only**: "a lot of fantasy points" has no
custom behind it, and picking a number for it would be us making the joke rather
than quoting it. FT/live-minute ticks stand where the kickoff time was. **No HT**:
FPL publishes a minute and a finished flag, and a clock stopped on 45 is not a
claim they have made.

**Nothing on the Desk is a link.** Eighteen rows at a 44px touch target would
cost the screen the one property it exists for, and every row is tappable
somewhere else. Recorded in `desk.md` so the density argument has to be remade
from scratch if a row ever becomes a link.

Verified against the real league id on 20 Aug: the head-to-head half says
"Fantrax has no pairings for this period" and the football half renders all ten
fixtures, because that half needs no credentials at all.

### Two rule-of-2/3 calls, recorded so nobody reopens them

- The Desk's rows are a **copy** of `PairingCard`'s grammar, not a reuse: second
  occurrence, rendering at different sizes for different reading distances. A
  third forces the extraction.
- `leagueCache()` stays parked. This tranche added no new `unstable_cache`
  wrapper — `/gw/[gameweek]` moved onto `gameweekSnapshot`, which the schedule
  work had already added, because the new cookie read makes the route dynamic and
  without a cached reader every arrival would refetch a round of February.

### The lineup gate held

Grepped the rendered source of `/matchday`, `/matchday/desk`, `/gw/1` and
`/league/matchups` for `ACTIVE`/`RESERVE`: zero hits on every one. Everything
this tranche added is either membership (public all week) or the reader's own
lineup (never withheld from him). No new value crosses a `"use client"` boundary
— `MatchupBoard` gained a string, and every other component here is a server
component.

### What only a real Saturday can answer

The whole tranche, honestly. Specifically:

- **The Final ladder's real timing** — `finished_provisional` at the whistle →
  raw `finished` → `data_checked`; how long "bonus settling" sits on screen; and
  whether Fantrax's total moves after the last whistle at all, which is the
  assumption everything above prices in.
- **Marker density** across ten fixtures from a fifteen-man squad, and whether
  the "Yours" line is what a half-time scan wants. Opponent highlighting is
  recorded as an open question, not built.
- **`remainingEventPercent` hitting literal 0** at each full time, which is what
  drives "all played".
- **Whether finished pairings should sort below live ones** on the list.
- **The Desk's density at arm's length**, and the spelled-out thrashing, which
  has never rendered.
- **/matchday's real scroll length** with three panels, and whether managers tap
  through to the board — which re-asks Option A with data rather than argument.

## The sweep, and the UI refactor's first tranche (20 Aug 2026)

Craig's order: refactor first, then the roadmap's §1 pages. Four refactor commits
and six feature ones, four gates green on each.

### What the sweep actually turned up

**Four writings of one question.** `isMatchdayLive(s) ? "live" : roundFinished(s)`
sat at four call sites. Neither half answers alone — `roundFinished` cannot say
"live", `isMatchdayLive` cannot say "final" — so the pairing *and its order* is
the answer, and asking it the other way round is precisely how the board came to
burn a LIVE dot through a Saturday tea-time. Now `roundState`, in the football
layer, tested there.

**A clock read four times.** Each of four pages spelled out
`duringGameweek(snapshot, new Date().toISOString()) ? POLL.live : POLL.idle`.
`pollSeconds` in `app/football.ts` — the app edge, which is where a clock
belongs. The choice of `duringGameweek` over `isMatchdayLive` is now made once:
between kickoffs is exactly when a score is most likely to have moved since you
looked, which is right for a poll rate and wrong for a dot.

**The reader discovered on three screens.** Read squads, verify cookie, find
team, join — three places for the same two mistakes. `app/involvement.ts` holds
it and the distinction it exists for: `mine`/`owners` key off **squad
membership**, public all week; `afternoon` keys off the reader's **own lineup**,
because a reserve does not score. Nothing in that file can say anything about a
rival's arrangement.

**A predicate written twice under two names.** `involves` was exported from a
card component and copied into the desk as `isYours`. It is a league-layer
question about a pairing, so it is `pairingInvolves` in `league/selectors.ts`
now, with the test neither copy had.

**Fantrax's raw word, compared in two places.** `rosterStatus.ts` exists so
`"ACTIVE"` appears once and its own comment says so — then the gazette's team of
the week and the new involvement reader both wrote it out again. A third status
reads as "not active" through `isActive`, which is the safe answer; a string
comparison would have read it as neither.

**Two widths written twice each.** `PlayerPortrait` and the profile masthead each
spelled their pixel size into a class and again into `sizes`, which is what tells
the optimizer how small an asset it may serve. The tell for that bug is a soft
photograph, and nobody thinks to blame a class name.

### The pages

`/players` leads every one of 697 rows with the 32px face. The FPL code comes
**straight off the bridge** rather than through a football snapshot — the code is
all a portrait needs, and joining the football layer would give a page that is
entirely Fantrax's a second provider to fail on. `toFplClubCode` left the
identity barrel for it: without the translation Brentford and Forest take the
fallback grey on every row, which is a wrong answer that looks exactly like a
club we have no colours for.

`/players/[fantraxId]` opens with the cut-out at 112px on his club's colour. On
the colour rather than on nothing: everywhere else it stands on grass, and there
is no pitch here.

**The Gazetta is the one that mattered.** It was called a paper and looked like a
settings screen. A masthead now — centred, allowed to wrap, between red rules,
with a **dateline** under it, which is the whole difference between a masthead
and an `<h1>`. The date is the *edition's* instant, not the reader's clock: two
managers opening the same cached edition either side of midnight must not be
shown two different days. Columns sit on `Column` — heads in cream on a red
rule, items on hairlines, no cards. `shell/Section` is untouched and still right
on the four screens using it.

`yoursBorder` survived all of it unchanged, which is worth recording: the class
it returns sets a border *colour* plus an explicit left width, so on a ruled row
with no `border` utility it draws the accent bar alone. One treatment, two
grounds, and `mine.ts` stays the only thing that knows what "yours" looks like.

### Two roadmap claims that were wrong

- **`PitchFrame` is not free on `/fpl`.** A pitch needs positional lines and the
  football layer deliberately carries no position — `element_type` is FPL's
  fantasy classification, which is why it was removed. An FPL pitch needs that
  classification carried by `fpl-entry`, the FPL league layer. A data change, not
  a rendering one. What landed instead is the XI/bench split, which FPL's own
  1–15 ordering gives for nothing; carried as `slot`, never `position`, because
  `position` here means the letter a league files a player under.
- **`/league` and `/squad` cannot show record or badges as a visual pass.** Both
  need reads those pages do not make. The squad row's *opponent* was free — the
  schedule was already in the payload — and that is what landed.

### The bug the preview caught, on its first day

`/squad/[teamId]` shows `SquadBoard` all week, which owns a Pitch/List control,
then switches to `TeamSheet` with `mode="pitch"` hardcoded the moment a period
opens — and `TeamSheet` deliberately owns no toggle, because the head-to-head
board owns one for two sides. Sound where it was written; it never held on a
route with one side and no control of its own. So the view answering "who
exactly is in it" vanished exactly when managers start checking, and it was
invisible because no period has ever opened. The faked-Saturday harness opened
period 1 and it fell out immediately.

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

## The shape-diff script, and what it found on its first run (20 Aug 2026)

ROADMAP §6's shape-diff did not exist and is the 11:00 item on the ship-day
runbook. `npm run shape-diff` now compares the real league's live payloads
against the rehearsal league's, read for read.

The rehearsal league is the **reference**, because it is what every mapper here
was written against. The real league is the **subject**. The dangerous direction
is a path the reference has and the subject does not — that is a mapper reading
`undefined` and a screen quietly showing nothing.

`shapeOf`/`diffShapes` are pure and in `league/fantrax/shape.ts` with 16 tests;
the script does the I/O. Two things the first runs forced into the design, both
pinned by tests:

- **A dictionary of one.** Live scoring for a league with no teams answers with a
  single sentinel id, `-3` (the league average, alongside `LG_AVG`). The first
  heuristic needed two keys to recognise an id-keyed map, so it read `-3` as a
  field name and reported every path beneath it twice — once missing, once
  added. 158 lines of noise.
- **Empty is not absent.** Our real league answers every table with `[]` until
  draft night, and calling that 142 missing fields is the loudest possible way to
  say "no teams yet". Paths inside a collection the subject reported empty are
  counted as `emptied` and never listed. 142 → 22, and the 22 are real.

### What it found, and two of them matter

**1. The real league has a playoff, and Fantrax publishes it.**

```json
{"lastRegularSeasonPeriod":34,"numPlayoffTeams":4,"firstPlayoffPeriod":35,
 "mergePlayoffPeriods":false,"used":true}
```

The rehearsal league answers `{"used":false}`, which is why nobody had seen this.

Regular season is periods 1–34; the playoff is periods 35–38 between the **top
four**. `league/competitions.ts` currently declares a placeholder final in
gameweek 38 between the top two, and the roadmap says `PLACEHOLDER_ROUNDS` waits
on Craig settling a real cup. **The playoff is not waiting on anybody — it is
already data**, and reading it is the same one-way seam as the rest of
`getLeagueInfo`. The cup is still ours to invent; the playoff never was.

**2. The two leagues score different games.** Seventeen outfield categories
against ten:

| | real | rehearsal |
|---|---|---|
| assists | `AT` | `A` |
| keeper saves | `GKP` | `Sv` |
| minutes | `range0\|0\|0` — **nothing** | scored in two bands |
| keeper's goal | 10 | 6 |
| also in real | `CLRA` clearances, `DFP` defensive points, `SBON`/`SBOF` blocks, `KP` key passes, `MP`, `GS`, `GAO` | — |

So the real league is a defensive-stat-heavy system and the rehearsal one is
close to a default. **Every category code differs enough that anything keyed to a
rehearsal code would be wrong on 10 Oct** — which is exactly why the stat mappers
read categories per response and list none of them (`fantrax/stats.ts`). That
decision is now paid for.

**3. The one piece of scoring the app does survives the swap.** The clean-sheet
preview looks up the literal `"CS"` (`join/cleanSheets.ts`), and `CS` is present
in both leagues with the same values — `D: points4`, `Default: points0`, and
`points4` for a keeper. It is the only hardcoded category code in the tree and it
is safe. Checked rather than assumed, which is the whole point of running this
now rather than on ship day.

Also: the real league's `draftType` is `snake`; the rehearsal sends none.

### The 22 that remain, and why they are not alarming

Almost all are `table.header.cells[]` and `table.caption` on the transaction and
standings reads. Fantrax sends **no header at all** for an empty table — it sends
`emptyTableMsg` instead. So these resolve at draft night, and the script will say
so. Worth knowing that they exist now rather than reading them cold at 11:00 on
10 Oct.

## CI walks both leagues, and the build stops redeploying for data (20 Aug 2026)

ROADMAP §6's other two. Both are small; both close gaps that had been noticed and
left.

### `npm run smoke` — every view, against whichever league it is pointed at

The four gates never once asked what the app does when Fantrax says `NO_TEAMS`.
That is what our real league says to almost everything until 10 Oct, and those
views had been walked by hand exactly twice — once on 19 Aug and once this
session. `verify.yml` now walks them on every push, both leagues, off the one
build (every route is dynamic, so the league id is a runtime choice).

The script asks Fantrax whether the served league has teams and asserts the
matching half, so it needs no editing on draft night — it simply starts
asserting the other half. When there are teams it derives one team id and adds
`/squad/[teamId]` and `/league/matchups/[teamId]`, which are the two biggest
screens in the app and would otherwise never be walked.

**The inverse half is the one worth having.** A drafted league that renders
"nobody has drafted" is a bug this repo has already shipped — `edition.ts`
collapsed an outage into an undrafted league, and a drafted league having a quiet
week was told it had not drafted. A check that only asserted the empty states
would have passed that happily, so the drafted walk asserts that none of those
five sentences appears.

Three things the first runs taught, all now in the script:

- **Assert absence, not presence, for rendered copy.** `/gw/1` failed on
  `"Gameweek 1"` because React splits `Gameweek {n}` into separate text nodes —
  the same thing that made `(FOUR)` un-greppable on the desk. It asserts the
  *absence* of "No fixtures scheduled for this gameweek yet." instead, which is
  one fixed string and also the better question.
- **`kill %1` does not work in CI.** Job control is off in a non-interactive
  shell, and the step would have failed on a line that is only tidying up. The
  pid is captured instead.
- **A connection refusal has to be legible.** A CI reader handed a raw
  `ECONNREFUSED` stack has to work out that the server never came up, and they
  will work it out slowly and at a bad moment. It says so in one line now.

Caveat worth stating: the empty-state fragments are copy, and copy moves. That
is the intended cost — the list is edited in the same commit as the sentence,
exactly as `docs/ui/` is.

### The Ignored Build Step, pulled at last

`apps/companion/vercel.json`:

```
git diff --quiet HEAD^ HEAD -- ':(top)' ':(exclude,top)data/snapshots'
```

Exit 0 skips the build, exit 1 proceeds — so a commit touching nothing but
`data/snapshots` no longer redeploys production. That is six redeploys in six
days, which is what this file complained about on 13 Aug and again on 19 Aug.

Two details that are load-bearing:

- **The pathspecs are `:(top)`-prefixed** because Vercel's Root Directory is
  `apps/companion`, so the command runs from there and a bare `data/snapshots`
  would resolve to `apps/companion/data/snapshots`, which does not exist — and
  the ignore would then match nothing and quietly never fire. Verified from
  `apps/companion` against a real capture commit (skips) and a real code commit
  (builds).
- **It fails toward building.** A shallow clone with no `HEAD^` exits 128, which
  is non-zero, which means deploy. The wrong answer in that direction costs a
  build; the other direction costs a shipped commit that never went live.

## The bridge gate, and why `npm run bridge` was not re-run (20 Aug 2026)

ROADMAP §6's last item, in two halves — and only one of them turned out to be
worth doing.

**The gate: `npm run bridge:check`.** `npm run bridge` reports totals — 688
players, 568 mapped, 120 with no FPL counterpart — and has never answered the
question that actually matters. 78% coverage says nothing about whether any of
the missing 22% is *on somebody's team*, and each one that is is a hole in a
squad view. This walks every rostered slot in both leagues against the
checked-in bridge and fails on a hole.

What fails and what does not is the identity layer's own distinction, reused
rather than re-derived:

- **Unbridged** — the bridge has never seen the id. Somebody joined the pool
  since the last run. Always a fault, always fixed by running it.
- **Assumed unmapped** — the matcher looked and found nobody. Revisable by
  construction (`isAssumed`), and FPL adds players all window: three of the first
  residue recorded were in FPL a week later. On a rostered player this fails,
  because a manager is looking at the hole.
- **A person's verdict** — `unmappedBy: "manual"`, or any row carrying
  `auditedAt`. Passes, and is counted so the number stays visible. A person
  looked and the script did not; this gate has no standing to reopen that.

`isAssumed` left the identity barrel to make that possible, and travels with
`isUnmapped` for the same reason it does: a caller re-deriving "did a person
decide this" from `unmappedBy` and `auditedAt` is a caller that will one day get
it wrong and silently reopen somebody's verdict.

First run, on every push from now on:

```
~ real: NO_TEAMS — no squads to check
  rehearsal: 4 squads
60 rostered slots checked.
No holes: every player anybody holds resolves to a footballer.
```

**The re-run: deliberately not done.** The roadmap says to re-run `npm run
bridge` after the rehearsal league's waiver churn. The gate says the bridge
already covers everyone rostered, so a regeneration would change nothing that
matters — and it is not free: it rewrites `data/mappings/fantrax.json` and
`review/proposals.json` wholesale, deletes rows it did not re-derive, and
`proposals.json` currently holds three rows waiting on Craig's own call
(`Fred Heath`, `Enzo Kana Biyik`, `Lucas Pitt`). Churning a file with a person's
pending decisions in it, to fix nothing, is the wrong trade.

The gate is the better answer to the same worry: it is what will *say* when a
re-run is needed, on the push that needs it, instead of on a schedule.

## The first real matchday, witnessed (22 Aug 2026)

GW1 opened Fri 21 Aug 19:00Z with COV 0 @ ARS 3 and the other nine fixtures
spread across Sat/Sun/Mon. Everything in the live tranche had been written
against a season that had never kicked a ball; this is the first entry written
with football in the data. Observed at ~10:45–11:00Z on the Saturday, with one
match played and nine still to come — which turned out to be the single most
useful state to be caught in, because it is the one where "played" and "not
played" are both on screen at once.

### The state nobody had seen: finished, but not finished

Fixture 1 sat at `started=true, finished=FALSE, finished_provisional=true,
minutes=90` for **more than fourteen hours** after the whistle. That is the
`bonus-settling` rung, and its real dwell time is now a measured lower bound
rather than a guess: overnight, not minutes.

### `remainingEventPercent` does hit literal zero

The open question at the top of this file's live-tranche section. Answered: the
values are exactly `{0.0, 1.0}`, so "all played" is reachable and `countToPlay`
is counting the right thing.

### Fantrax's totals move

Also an open question — the 13 Aug note said in terms that `totalFpts` filling in
was "an expectation, not an observation". It is an observation now: 5.0 / 9.0 /
0.0 / 16.0 across the four rehearsal teams off a single fixture.

### `playerGameInfo` is decoded

Five ints that this file recorded as deliberately unmodelled, because they had
only ever been seen at rest. With one match played they resolve:

```
[0] players who APPEARED and whose match is over
[1] players currently in a match in progress
[2] players with a match still to come
[3] = [0] * 90   nominal minutes played
[4] = [2] * 90   nominal minutes remaining
```

`[3]` and `[4]` are **nominal, not real**: team `j9zadacn` reads `180` for Saka
(67') and Ødegaard (75'), whose real total is 142. So they are `count * 90` and
carry no information the counts do not.

The useful part is what the counts do **not** add up to. `[0]+[1]+[2] < 11`
exactly when a player's match has ended without him appearing: team `8enbgqo5`
reads `[1,0,9,…]` though two of its players' match is over, because Bruno
Guimarães never came on. Three such players existed across four teams in one
fixture (Bruno Guimarães, Gyökeres, Timber — all ACTIVE in somebody's eleven).
**`[1]` has still not been witnessed**; nothing was in play at the time.

### `gameStatusMap`, `statsMap` and the projections

- `gameStatusMap` is `"{OPP}~{kickoffEpochMs}|{gameId}|{state}"` before kickoff
  and `"COV 0 @ ARS 3 F|{gameId}|{state}"` after. State `1` upcoming, `3`
  finished; `2` is presumed in-play and **not witnessed**.
- `statsMap` fills in — this file recorded it as `{}` "in every section, so what
  they will hold is unknown". It holds `object1` (his total) and `object2`, a row
  per category: `{scipId: "5010#<categoryId>#<positionId>", sv, av, fpts}`. The
  category ids resolve against `getLeagueInfo.scoringSystem.scoringCategorySettings`:
  `6000 A · 6090 G · 6101 GAO · 6105 OG · 6112 GA · 6120 Min · 6170 PKS ·
  6190 RC · 6200 Sv · 6249 CS · 6280 YC · 6283 AF · 6332 PKM`.
  `statsMap2` is still `{}`.
- `projectedTotalsMap` and `calculatedProjectedTotalsMap` were "identical to each
  other today". They diverge the moment football is played: for a player whose
  match is done, `calculated` is his actual score and `projected` stays the
  pre-game number. So `calculated` is a live projected-finish.
- `allEventsFinished` is a top-level boolean on the same payload. Nothing reads it;
  the football layer already answers the same question from FPL.

### Fantrax scores the SLOT, not the player

The finding with product consequences. Fantrax's scoring is position-dependent
(`G: {D:6, M:5, F:4}`, `CS: {D:4, M:1, Default:0}`), and the position it applies
is **the slot his owner has him in**, not his position in the global pool.

> Saka, `04y92`. `getPlayerIds` lists him **F**. His owner rosters him at **M**.
> `getLiveScoringStats` scores him 8 — `Min 2 + G 5 + CS 1`, midfield rates.
> `getPlayerStats` scores him 6 — `Min 2 + G 4 + CS 0`, forward rates.

Seven of sixty rehearsal roster slots are off-canonical, all canonical-F players
slotted at M. So the pool table's `FPts` is **not** what a player scored for his
owner, and on this league it will differ for roughly one rostered player in eight.

Everything else is safe: the squad pages, the head-to-head board and the player
profile all read `getTeamRosterInfo`, which is per team and therefore
slot-correct. `/players` is the only surface reading the pool's number.

### `getPlayerStats` flipped its default

The 13 Aug sweep tried fourteen spellings and got a projection every time, and
left the question open: "whether it flips to real numbers once games exist is
unknown and resolves itself on 21 Aug". It resolved. The default is now
`SEASON_926_YEAR_TO_DATE` with real numbers. The lesson from 13 Aug still stands
and is now load-bearing for the opposite reason: read the season off
`displayedSeasonOrProjection` rather than assuming either answer.

### FPL, three things

- **`GET /api/event-status/`** is the authoritative answer to "has bonus been
  confirmed", one row per match date: `{"bonus_added": false, "date":
  "2026-08-21", "event": 1, "points": "p"}`. It matters because the live feed
  carries *provisional* bonus long before that flag turns: Ødegaard 3, White 2,
  Saka 1 were in `element.stats.bonus` and folded into `total_points` while
  `bonus_added` was still false. **Agreement with the BPS order is not evidence
  of finality — provisional bonus is by construction the current BPS order.** The
  `settled`/`dataChecked` ladder derives the same rungs from reads we already
  make, so this is recorded as a fact, not as a fourth request to add.
- **The live endpoint returns a row for every player in the league**, not only
  those who appeared: 600 elements, 600 with an `explain` block, 569 of them on
  zero minutes, including players whose fixture is three days away. Before a
  round's first kickoff it is `{"elements": []}` (verified against event 2).
  This is what broke `contribution.played` — see below.
- `influence`, `creativity`, `threat` and `ict_index` are the string `"0.0"` for
  every player in the live feed even after 90 minutes. We map none of them; do not
  start. `defensive_contribution` **is** live and is a count — CBI+tackles for
  defenders, CBI+tackles+recoveries for mid and forwards, 0 for keepers, verified
  against all 31 players with minutes.

### Pool sizes have drifted and CLAUDE.md is stale on both

FPL bootstrap now carries **600** elements against the 564 recorded on 3 Aug.
Fantrax `getPlayerIds` now returns **671** entries — 611 players plus 60 synthetic
club entities (20 each of `Tm`, `TmG`, `TmOF`) — against "759 entries of which
~699 are players". Both numbers in CLAUDE.md are now wrong.

### The real league answers live scoring with a team that does not exist

`getLiveScoringStats` on `ayyoh3n2mr326v2o` returns one team, id **`-3`**, on
`totalFpts: 0.0`, while `getTeamRosters` on the same league answers `NO_TEAMS`.
`mapLiveScores` maps it faithfully to a `LiveTeamScore`. It is inert — every
consumer looks the map up by a real team id and `-3` matches none of them — but
it is a negative sentinel id in a `Record<string, …>` keyed by team, and anything
that ever *iterates* that map instead of indexing it would print a phantom team.
Recorded rather than filtered: the filter would be a guard for a caller that does
not exist.

## Questions

- **Does `?period=N` serve history once a period has completed?** Partially
  answered 12 Aug — accepted and echoed, but inert while every period is still
  in the future. Re-ask after period 1 ends 28 Aug.
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
- **Is Fantrax's middle rung reachable?** If FPL confirms bonus per gameweek
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
- [ ] Design the cookie flow for the fxpa write surface.
- [ ] Re-run `npm run bridge` after rehearsal waiver churn; gate on zero
      rostered-but-unmapped.

**Done since:** rosters, standings, teams and matchups modelled against real
payloads; captures filed per league; period alignment settled and scripted; the
`CLAUDE.md` pool-count and `sportRadarId` corrections landed.

## Season log

- 2026-08-13 (evening): the app became the app in the vision. Six tabs
  (Gazetta, League, Squads, Live, Players, FPL), all fifteen on the pitch
  instead of eleven and a bench strip, and — the piece everything else was
  waiting on — it now knows whose team you are. Sign-in is one code per manager,
  HMACs only in the environment, signed httpOnly session, and reading stays open
  to everyone. Your head-to-head leads the live centre and sorts to the top of
  the matchups; your row is marked in the table. The Gazetta shipped its first
  edition off two readers that had sat unused in core for a week — the
  transaction feed and FPL's injury news — and Team of the Week names whose
  player it was and which manager benched him. The FPL tab landed small, as
  planned. Caching moved from pages to the shared provider reads, which is what
  made a cookie affordable.
- 2026-08-13: Craig's cookie went into `.env.local`, every fxpa method was
  probed twice, and the scoring engine died before it was written. Fantrax
  serves its own points publicly — typed team totals on `getLiveScoringStats`,
  per-player points and an exact category breakdown on `getTeamRosterInfo` —
  while the one login-walled method turned out to hold nothing but the schedule
  we already read. The head-to-head now shows their real numbers. Also today:
  the app grew its six-tab shape (League owns a prefix, /team became /squad, the
  tab bar became one component in two shapes, a Matchday section that exists
  only when there is football), the season's schedule landed as the first
  consumer of `periodGameweeks`, and both providers are asked politely now.
- 2026-08-13: The companion has somewhere to live. Craig ran the Vercel
  import in the evening: `https://epl-draft-companion.vercel.app`, root
  directory `apps/companion`, rehearsal league id set as a production env var.
  Verified from outside — the bridge crossed the boundary, portraits come back
  optimized, and `/matchup` 404s on production because `main` has not taken the
  branch yet, which is the merge's argument, not a bug.
- 2026-08-13: Head-to-head landed eight days before the league first needs it —
  `periodPairings` in core, `/matchup` under the League tab, and "vs" on every
  squad page. The probe that shaped it: `getMatchups` is login-walled, so the
  page shows pairings and countable events and no number it calls points. CI
  arrived the same day (`verify.yml`, four checks on every push); the Vercel
  deploy is decided but deliberately not executed — deferred to a day with eyes
  on it. Verified against both leagues: the rehearsal renders its pairings with
  the gate closed, the real league answers `NO_TEAMS` as a panel.
- 2026-08-12: Player profiles landed — one `getPlayerProfile` per tap from the
  pool, typed against a live probe. Refactor pass with it: the status strings, the
  violation check and the planner's move sheet each moved to the file that answers
  their own question, and the four routes that had each hand-rolled "a Fantrax
  refusal is a state, not a crash" now share one.
- 2026-08-12: The app got navigation and two more sections — `/players` (the pool
  as our league sees it) and `/standings` (Fantrax's table, never recomputed) —
  behind a four-tab bar. `violations()` landed with the planner as its consumer.
  Five empty states became one panel, which is what the rule of 2/3 asked for the
  moment the third appeared.
- 2026-08-12: Refactor pass over the day's work — five visibility exports down to
  one, the fxpa batch transport and its unused cookie parameter deleted, and
  SquadList's duplicate copy of the pitch order removed in favour of the one
  `positionDepth` core already owned. Lineup planner shipped behind a
  league-gated preview.
- 2026-08-12: Merged to `main` — the capture cron had never fired, because
  workflows only run from the default branch. Six days of history (7–11 Aug) are
  gone permanently. Dispatched the workflow by hand to prove it works rather
  than trusting 05:10. Craig executed the first rehearsal trade and free-agent
  claim, which settled the transactions design: the native feed wins, capture
  diffs corroborate. Lineup visibility gate shipped — squads all week, XI only
  once the period opens.
- 2026-08-05: Created `PLATFORM_NOTES.md` and improved `CLAUDE.md`.
- 2026-08-05: Probed Fantrax live and recorded the facts above. Added the
  read-only league layer, the dated snapshot capture, and the identity bridge
  (542/699 settled). Config module added; `npm run typecheck` made to pass for
  the first time.
- 2026-08-05: Removed position from the football layer. Added
  `MappedEntry.agreement` so the fuzzy audit can be ranked by risk rather than by
  a score that is always 100 — 13 of 66 rows need eyes, two of them genuinely.
  Established that the bridge covers 223 of the 224 players who can ever be
  rostered, which is the number that matters rather than 78%.
- 2026-08-06: The rehearsal league auto-drafted — 4 teams, 60 picks — and every
  read that had only ever returned an error or `[]` returned data. Captures are
  now filed per league with the pool outside them, and both leagues are captured
  on every run. Modelled rosters, standings, teams and matchups from real
  payloads; fixed `draftType` defaulting to `""` for a key the rehearsal league
  does not send. Settled the period↔gameweek question: aligned by **kickoff**, all
  38 periods and all 380 fixtures, with `npm run periods` re-checking against live
  FPL. The bridge resolved all 60 drafted players with zero misses.
