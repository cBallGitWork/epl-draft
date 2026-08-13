# Tim Hortons Pro League — companion + platform monorepo

Read `PRODUCT.md` first for who this is for and why. This file is the technical
contract for architecture, conventions, and what the assistant should keep in mind.

**`CODE_RULES.md` is binding.** Read it before writing any code. Its rules —
rule of 2/3, no bloat, no hardcoding, small files, purity at the core — are hard
rules, not preferences. Exceptions are recorded in `PLATFORM_NOTES.md` in the
same commit.

A 16-user **Fantrax** Premier League draft league starts **GW6, 10 Oct 2026**.
Fantrax is the source of truth for the current season. This repo republishes that
league with what Fantrax lacks and lays the groundwork for our own platform in
27/28.

## Core idea

**Two data layers, never conflated.**

```
football layer (FPL, public)      →  the real Premier League
league layer  (Fantrax, cookie)   →  our fantasy competition
        ↘ join on player identity ↙
```

The football layer is permanent. The league layer is an adapter. In future
seasons the league engine can be replaced without rewriting the football layer
or the UI.

**Why they split, precisely: FPL has hard rules; custom rules are Fantrax's
product.** The football layer models a game whose rules are fixed for everyone, so
they can be constants. The league layer models a game whose rules are the thing
being sold — roster limits, the position vocabulary, the scoring system, the
period calendar, the lineup deadline, team count, the schedule, the draft type.
All of that is **data we read from `getLeagueInfo`**, never assumed, never
hardcoded, never inferred from the football layer. The two layers differ in
epistemics, not just in content.

The corollary bites often: **whenever an FPL concept crosses into league territory
it arrives wearing football clothes.** `element_type` did, which is why position
left the football layer. `deadline_time` is the same mistake waiting to happen —
FPL's deadline is FPL's house rule, and ours is a commissioner setting.

**Where the layers meet.** Player identity, through the bridge, and one other
place: the calendar. The league layer may be *told* about the football calendar as
plain data — `league/calendar.ts` declares its own `GameweekKickoff` rather than
importing `Fixture` — but it may never import the football adapter, and football
may never import the league. A script does the wiring.

## What the assistant should do first

- Read `CODE_RULES.md` before writing code. It overrides habit and convenience.
- Read `PRODUCT.md` before making product-level decisions.
- Keep `PLATFORM_NOTES.md` up to date with architecture decisions, season
  updates, data assumptions, and implementation notes.
- Prefer small, testable changes. Add or update tests when you change domain
  logic or data mapping.
- Keep UI and data layers separate. Do not let `packages/ui` or `packages/core
  football` import Fantrax-specific adapter code.
- Treat Fantrax as a provider adapter, not the source of product truth.
- When asked for a plan, start from the current season’s needs first, then the
  long-term platform.

## Layout

```
packages/core   domain types, adapters, scoring, competition engines, identity
packages/ui     shared components (empty until a second consumer needs them)
apps/companion  the 26/27 Next.js app — ships 10 Oct
apps/lab        the 27/28 platform prototype — empty on purpose
```

## Platform notes

We keep a living season log in `PLATFORM_NOTES.md`.
Use it for:

- architecture and data decisions
- Fantrax/FPL quirks and API gotchas
- season milestones and blockers
- feature ideas and follow-up work
- things we must remember next season

## Verified API facts (probed live, 3 Aug 2026 — do not re-derive)

### FPL — public, no auth

- `GET /api/bootstrap-static/` — 1.3 MB: 564 elements, 20 clubs, 38 events.
  Player `code` is **season-stable** (portraits key off it); `id` is per-season and
  **must not be persisted across seasons**. Carries `opta_code`, `squad_number`,
  `news`, `chance_of_playing_next_round`.
- `GET /api/fixtures/?event={gw}` — fixtures with `started` / `finished` /
  `finished_provisional` / `minutes` / scores.
- `GET /api/event/{gw}/live/` — per-player stats. `{"elements": []}` before the
  first kickoff is normal and not an error.
- Portraits: `https://resources.premierleague.com/premierleague/photos/players/250x250/p{code}.png`
  — **PNG only** (webp/jpg 403). Use 250x250 and let Next's optimizer resize.
- Crests: `…/premierleague/badges/t{code}.svg` (also `/50/`, `/70/` PNG).

### Fantrax — two surfaces

**Public reads, no auth:** `GET https://www.fantrax.com/fxea/general/{method}?leagueId=…`
— `getLeagueInfo`, `getTeamRosters` (takes an optional `period` and echoes it
back), `getStandings`, `getDraftResults`, `getPlayerIds?sport=EPL` (759 entries of
which ~699 are players — the rest are synthetic per-club entities; sport code is
**`EPL`**, not `SOCCER`).

**Field presence varies between leagues, not only between states.** On the same
day the real league's `getLeagueInfo` carries `draftType` and `leagueHistoryId`
and the rehearsal league's carries neither. Every field in `raw.ts` is optional
for that reason.

**Internal SPA API:** `POST https://www.fantrax.com/fxpa/req?leagueId=…` with
`{"msgs":[{"method":…,"data":…}]}`. Cookie auth; returns the caller's `roles`.
Some reads work unauthenticated (`getStandings`, `getPlayerProfile`); league data
returns `WARNING_NOT_LOGGED_IN`.

Methods that matter:

- `confirmOrExecuteTeamRosterChanges` — **lineup writes**. Takes
  `rosterLimitPeriod`, `fantasyTeamId`, `applyToFuturePeriods`, and `adminMode`.
- `getCommissionerHubInfo` + `executeCommissionerHubAction({actionKey, …})` — the
  commissioner console. The returned action list is server-driven; do not hardcode.
- `getMatchups` — Fantrax computes live H2H points itself. Their live scores are
  authoritative; our engine is a fallback proxy.
- `getScorerDetails`, `getPlayerProfile`, `getPlayerNews`, `setPlayerNews`,
  `setPlayerNote`, `removePlayerNote` — per-player notes are writable and are the
  native home for our player metadata.
- `executeTrade`, `confirmOrExecutePlayerPickerChanges`, `findPlayers`.

### Auth constraint — read before designing any login

Fantrax login uses **reCAPTCHA v3 with a v2 image fallback**, plus 2FA and
`ACCOUNT_LOCKED`. Server-side password login is not viable. Members must provide
their own browser session cookie via an extension. We do not hold passwords.

### Identity

Fantrax exposes `rotowireId` on 544 of the 699 players (78%). **`sportRadarId` is
not on this endpoint at all** — it is not a second identity space. The existing
identity pipeline at `~/ai-carling-premiership/src/identity/` produces canonical
`person_id`/`root_id` and bridges FPL/SofaScore/FotMob/Understat/Transfermarkt.
It does not include the RotoWire ID space either, so that is not a shortcut. The
Fantrax bridge is built once by matching normalized name + club + position,
audited manually, and persisted in `data/mappings/fantrax.json`.
Never name-match at runtime.

## Conventions

The full, binding set is in `CODE_RULES.md`. The ones that bite most often here:

- Keep provider I/O in adapters: `packages/core/src/*/[provider]/client.ts`.
- Keep mapping logic pure: `map.ts` should not access clocks or network.
- Inject `fetchedAt`; do not call `Date.now()` inside mappers.
- Treat scraped data as untrusted. Render gracefully on missing fields.
- Keep pure domain logic in `packages/core`; components should stay presentation-focused.
- Add tests alongside changes to core logic.
- Phone-first UI: single column, thumb-reachable, readable at arm's length.

## Verify

All four green before every commit.

```bash
npm test          # vitest across packages/*
npm run typecheck # core, scripts and the app
npm run lint      # ESLint — `next build` stopped running it at Next 16
npm run build     # Next production build
npm run dev       # http://localhost:3000
```

Data and league health, none of which the test suite can tell you:

```bash
npm run capture         # both leagues + the pool, into data/snapshots/
npm run capture:status  # per-league staleness; non-zero when overdue
npm run periods         # re-check period↔gameweek alignment against live FPL
npm run bridge          # regenerate the Fantrax→FPL player mapping
npm run team-codes      # issue one sign-in code per team; prints them once
```

**Two `.env.local` files, and they are not interchangeable.** `next dev` roots at
`apps/companion`, so the app reads `apps/companion/.env.local` (`SESSION_SECRET`,
`TEAM_CODES`) and never sees the repo-root one, which is what the scripts read
via `node --env-file` (`FANTRAX_COOKIE`). Next prints `- Environments: .env.local`
at startup when it has loaded one; its absence is the tell.

`FANTRAX_LEAGUE_ID` selects the league the app serves; it defaults to the
rehearsal league. Setting it to `ayyoh3n2mr326v2o` is the whole 10 Oct swap, and
running against it now is how the empty states get tested.

## Next.js 16

Route `params` may be a `Promise` (await it). `'use cache'` now needs the
`cacheComponents` flag. Check `node_modules/next/dist/docs/` when writing framework
code.
