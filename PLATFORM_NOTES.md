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

Re-runs are additive only. Audited entries and confirmed-`unmapped` players are
never revised by the script — the pool mutates constantly, and a run that quietly
overwrote a human decision would be untrustworthy exactly where it was most
carefully made.

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
to `Dj` in one feed and folds to `d` in ours). Two cannot be settled from the
payloads at all, because the feeds agree on club *and* position:

- `Andrews, Keith` → `Kaine Andrews` (COV)
- `Koumas, Louie` → `Lewis Koumas` (LIV)

Adding the field changed no assignment: regenerating from an empty bridge
reproduced the same 542 rows with zero `fplCode` reassignments.

### What the coverage number means

78% understates it badly. Roster limits are 14 players across 16 teams, so **224
of the 699 will ever be rostered**. Against FPL's top 224 by price the bridge
covers 223 — and the miss, Nicolas Jackson, is absent from Fantrax's pool
entirely rather than unmatched. The 157 in review are overwhelmingly academy
players nobody will draft: 156 of them score below 60 against their best
candidate, which is noise. The single real match in that pile is `Ehor Yarmolyuk`
→ `Yehor Yarmoliuk` at 72, a Ukrainian transliteration that belongs in the alias
file.

**Outstanding:** nothing in the bridge is human-audited yet — `auditedAt` is unset
on all 542 rows.

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

### Branching on a Fantrax error code in `app/team/league.ts` (§3-adjacent)

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

`apps/companion/app/team/league.ts` does `mapping as Bridge` on the JSON import.
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

## The lineup preview is gated on the league, not on an environment variable

The planner has to be visible during development, and the visibility gate hides
every lineup until 21 Aug. The obvious lever is an env flag. We did not use one.

An env flag is correct until the day it is set on the deployment, and the harm it
guards against is asymmetric: publishing sixteen managers' lineups before a
deadline is the one mistake in this app that cannot be taken back. So the check
is **which league we serve** — the rehearsal league's four teams belong to
nobody, so previewing there leaks nothing, and the real league can never preview
whatever anyone configures. It **fails closed**: if the real league cannot be
identified in `FANTRAX_LEAGUES` at all, the answer is no, because the other
direction fails toward publishing.

It is also opt-in per request (`?preview=1`) rather than always-on, so the honest
gate remains the default on every page load and remains the thing under test. On
10 Oct the swap turns the planner preview off by itself, which is correct.

`mayPreviewLineups()` lives in `apps/companion/app/team/league.ts` and is not
unit-tested, because vitest covers `packages/*` only. That is the standing gap
for app-edge logic; this is the piece of it most worth watching.

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

`BottomNav` is `"use client"` for one reason — `usePathname`. A tab bar that
cannot say which section you are in is a row of links, and the answer only exists
in the browser. Nothing else in it is interactive.

Each tab owns a set of routes rather than the single one it links to, so reading
a squad (`/team/[teamId]`) or a past gameweek (`/gw/[n]`) keeps its section lit.
It carries its own `env(safe-area-inset-bottom)` padding: the body's padding does
nothing for a fixed element, which is positioned against the viewport.

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
install must run at the repo root) and `app/team/league.ts` imports the bridge
JSON from `data/mappings/` outside the app directory — if the first build
breaks, expect it to break there. `FANTRAX_LEAGUE_ID` is set explicitly in the
dashboard (rehearsal `zbn1z3ukmsgb36sz` until 10 Oct), which makes the swap one
dashboard field — and being a dashboard value it is invisible to git, so it goes
in the ship-day runbook as a numbered step. `FANTRAX_COOKIE` is read by nothing
in the tree and must never reach Vercel. Expect a redeploy per day off the
capture commit; Ignored Build Step is the lever if that becomes noise.

### A push that deploys nothing (13 Aug, open)

The merge of `feat/fantrax-league-layer` into `main` at 10:53 produced a
Production deployment that Vercel reports as **`failure — Deployment was
blocked`**, so the URL kept serving the 10:49 build and `/matchup` stayed a 404
on a commit that contains it. Nothing was wrong with the code: `verify.yml` was
green on the same commit, and the identical build passes locally.

Blocked is not failed — the build never ran, which is why there is no build log
to read, only the deployment page. The cause is account- or project-level and
lives in the dashboard: a spend or usage limit, deployment protection, or a
paused project. The team is `gsi-draft`, which is a team rather than a personal
account, and a team without billing settled is the readiest explanation.

Worth writing down beyond its own fix, because it is the **third** instance of
one pattern this month: the capture cron that had never fired, the capture
commits that trigger no workflow, and now a git push that deploys nothing. Every
one of them looks automated from the inside and is not. Green CI says the code
is good; it does not say the code shipped. **Before 10 Oct, the ship-day runbook
must check the deployed URL itself, not the commit that was pushed to it.**

## Questions

- **Why is Vercel blocking production deployments?** Opened 13 Aug — the
  dashboard holds the answer and the fix. Until it is settled, `main` and the
  live URL are two different versions of the app.
- **Does `?period=N` serve history once a period has completed?** Partially
  answered 12 Aug — accepted and echoed, but inert while every period is still
  in the future. Re-ask after period 1 ends 28 Aug.
- Does league scoring start at period 1 or period 6? `getLeagueInfo` numbers all
  38 periods from 21 Aug, but we draft at GW6. The rehearsal league's matchup
  schedule runs from period 1, so this is really a question about the real
  league's settings — recheck once its teams have joined.
- What Fantrax data should we replicate vs proxy?
- What should `apps/lab` look like for the 27/28 platform prototype?

**Answered:** period↔gameweek alignment — see above. Kickoff, not deadline.

## Work items

- [ ] Settle the two conflicting fuzzy rows (Andrews, Koumas), sign off the other
      eleven, and add `Ehor Yarmolyuk` to the alias file. Less optional than it
      looks now: a players tab puts all 699 on screen and the FPL tab reads the
      bridge backwards, so both make the noise visible.
- [ ] Decide how the ~156 never-in-FPL players get recorded. `auditedAt` means a
      person looked, so a score threshold must never write it — a distinct,
      machine-set reason keeps "confirmed" separable from "assumed".
- [x] Automate the capture (cron or CI) — manual runs will not survive October.
      Run `capture:status` as a **separate workflow on a different schedule**, so
      the job that might die is not the job responsible for noticing. *Landed
      6 Aug, but only became live on 12 Aug: workflows fire from the default
      branch and the branch had not merged, so the cron had never once run.
      Verified by dispatching it manually rather than waiting for 05:10.*
- [ ] Capture the three `getTransactionDetailsHistory` views daily, and build the
      feed from them rather than from capture diffs (see 12 Aug notes). Bind to
      `cell.key`; the header names include a broken i18n placeholder.
- [ ] Model `scoringSystem` when a view first explains a number — read from
      `getLeagueInfo`, never from a checked-in copy (§3).
- [ ] Design the cookie flow for the fxpa write surface.
- [ ] Re-run `npm run bridge` after rehearsal waiver churn; gate on zero
      rostered-but-unmapped.

**Done since:** rosters, standings, teams and matchups modelled against real
payloads; captures filed per league; period alignment settled and scripted; the
`CLAUDE.md` pool-count and `sportRadarId` corrections landed.

## Season log

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
