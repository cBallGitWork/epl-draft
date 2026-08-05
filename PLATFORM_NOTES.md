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
"running"}`. Their element shapes have therefore never been observed and are
typed `unknown` rather than invented. Model them when real data exists.

**`getLeagueInfo` is populated now**, and carries: 38 scoring and roster periods
aligned to FPL gameweeks (period 1 opens 21 Aug), roster limits 14 total / 11
active / 3 reserve with position caps G1 D5 M5 F3, snake draft, the full scoring
system, and a 699-entry `playerInfo` map. Timestamps carry a `-0400` (US Eastern)
offset while `startDate`/`endDate` are plain dates — do not mix them.

**`getPlayerIds?sport=EPL`** needs no leagueId and returns 758 entries, of which
**60 are not players**: synthetic per-club entities (`Tm`, `TmOF`, `TmG`) whose
`fantraxId` contains `#`. Filter them out or they reach the identity bridge and
match a club by name. `rotowireId` is present on ~78%; **`sportRadarId` does not
appear on this endpoint at all**, contrary to what `CLAUDE.md` implies.

**Club codes differ from FPL on exactly two of twenty:** Fantrax `BRF`/`NOT`
versus FPL `BRE`/`NFO`. Everything else matches.

**Position is league state, not football truth.** The commissioner can change a
player's position whenever they like, and `eligiblePos` is multi-valued (`"F,M"`,
`"M,D"` — 51 players today). It is a display hint and never a join key. The
player universe is mutable too: Fantrax carries academy players FPL has never
listed (699 real players against FPL's 570 non-manager elements), so `unmapped` is
a correct and permanent state for some players rather than a matching failure.

## Decisions

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

Cadence is weekly until 10 Oct and daily after. Known blind spot: at daily
granularity a player added and dropped the same day is invisible. Revisit once the
draft shows how much same-day churn there actually is.

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

**Outstanding:** 157 players in `data/mappings/review/proposals.json` need a human
pass. Most are academy players FPL has never listed, where `unmapped` is the right
permanent answer.

## Recorded rule exceptions

Each entry is a deliberate departure from `CODE_RULES.md`, recorded in the commit
that made it.

### `revalidate` literal in `apps/companion/app/page.tsx` (§3, no hardcoding)

Next requires a route segment's `export const revalidate` to be a statically
analysable literal, so it cannot be imported from `packages/core/src/config.ts`.
The value intentionally duplicates `REVALIDATE.live`. Both must change together;
a comment at each site says so.

### Next's `next.revalidate` inside `packages/core` (§5, framework-agnostic core) — UNRESOLVED

Both provider clients (`football/fpl/client.ts`, `league/fantrax/client.ts`) pass
Next's `next: { revalidate }` extension to `fetch`. CODE_RULES §5 says core must
carry no Next-specific options. This predates the league layer — the FPL client
shipped with it — and copying it into Fantrax makes it the third occurrence,
which is the point the rule says to act.

It is typed inline (`RequestInit & { next: … }`) rather than by importing Next's
global augmentation, so `npm run typecheck` passes and core still has no Next
dependency. That is a stopgap, not a resolution.

The real choice, still to be made: drop fetch-level caching from core and let the
route segment's `revalidate` bound upstream load (loses per-endpoint granularity —
bootstrap is 1.3 MB and would be refetched on every page revalidation), or inject
the cache policy from the edge (threads an init argument through `snapshot.ts`).

Also note: `npm run typecheck` had never passed before this — the failure was
invisible because `CLAUDE.md`'s verify section lists only `npm test` and
`npm run build`. Both now gate every commit alongside typecheck.

### New dependency: `tsx` (§2, every dependency is a recorded decision)

Dev-only, never shipped. The capture and bridge runners import `@epl/core`, whose
relative imports are extensionless, which Node's native type-stripping will not
resolve. `tsx` is the smallest thing that runs them unchanged.

Scripts transpile to CJS (the root package has no `"type": "module"`), so they
cannot use top-level `await` — each wraps its body in `main()` and calls it
without awaiting, so a rejection crashes the run loudly instead of being softened.

## Questions

- Does league scoring start at period 1 or period 6? `getLeagueInfo` numbers all
  38 periods from 21 Aug, but we draft at GW6. Inspect once teams have joined.
- What Fantrax data should we replicate vs proxy?
- What should `apps/lab` look like for the 27/28 platform prototype?

## Work items

- [ ] Audit the 157 proposals in `data/mappings/review/proposals.json`.
- [ ] Correct two now-disproven facts in `CLAUDE.md` (left alone here because the
      file has uncommitted edits): `getPlayerIds` returns 758 entries of which
      only ~698 are players, not "755 players"; and `sportRadarId` is not on that
      endpoint at all, so it is not the second identity space the file implies.
- [ ] Resolve the `next.revalidate`-in-core question (see rule exceptions).
- [ ] Model standings / rosters / draft picks once the draft populates them.
- [ ] Automate the capture (cron or CI) — manual runs will not survive October.
- [ ] Design the cookie flow for the fxpa write surface.

## Season log

- 2026-08-05: Created `PLATFORM_NOTES.md` and improved `CLAUDE.md`.
- 2026-08-05: Probed Fantrax live and recorded the facts above. Added the
  read-only league layer, the dated snapshot capture, and the identity bridge
  (542/699 settled). Config module added; `npm run typecheck` made to pass for
  the first time.
