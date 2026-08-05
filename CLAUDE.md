# Tim Hortons Pro League — companion + platform monorepo

Read `PRODUCT.md` first for who this is for and why. This file is the technical
contract.

A 16-user **Fantrax** Premier League draft league starting **GW6, 10 Oct 2026**.
Fantrax runs the league and is the source of truth — we never write to it except
through explicit, user-initiated actions. This repo republishes that league with
what Fantrax lacks, and doubles as the groundwork for our own platform in 27/28.

## The one architectural idea

**Two data layers, never conflated.**

```
football layer (FPL, public)      →  the real Premier League
league layer  (Fantrax, cookie)   →  our fantasy competition
        ↘ join on player identity ↙
```

The football layer is permanent — the real world does not change provider. The
league layer is an adapter, and in 27/28 it is replaced by our own engine while
the football layer and the whole UI stay put. Nothing in `packages/ui` or the
football layer may import anything Fantrax-shaped.

This is the lesson from the World Cup app (`~/worldcup-fantasy`, now retired): its
`LeagueSnapshot` contract meant the UI never knew Draft Fantasy existed, which is
why swapping providers was an adapter change rather than a rewrite.

## Layout

```
packages/core   domain types, adapters, scoring, competition engines, identity
packages/ui     shared components (empty until a second consumer needs them)
apps/companion  the 26/27 Next.js app — ships 10 Oct
apps/lab        the 27/28 platform prototype — empty on purpose
```

## Verified API facts (probed live, 3 Aug 2026 — do not re-derive)

### FPL — public, no auth

- `GET /api/bootstrap-static/` — 1.3 MB: 564 elements, 20 clubs, 38 events.
  Player `code` is **season-stable** (portraits key off it); `id` is per-season and
  **must not be persisted across seasons**. Carries `opta_code`, `squad_number`,
  `news`, `chance_of_playing_next_round`.
- `GET /api/fixtures/?event={gw}` — fixtures with `started` / `finished` /
  `finished_provisional` / `minutes` / scores.
- `GET /api/event/{gw}/live/` — per-player stats. `{"elements": []}` before the
  first kickoff, which is normal and not an error.
- Portraits: `https://resources.premierleague.com/premierleague/photos/players/250x250/p{code}.png`
  — **PNG only** (webp/jpg 403). Sizes 40x40 ≈16 KB, 110x140 ≈108 KB, 250x250 ≈330 KB.
  Always source 250x250 and let Next's optimizer resize; eleven raw PNGs is 3.6 MB.
  The `premierleague25` / `premierleague26` path variants 403/502 — use the
  unversioned path.
- Crests: `…/premierleague/badges/t{code}.svg` (also `/50/`, `/70/` PNG).

### Fantrax — two surfaces

**Public reads, no auth:** `GET https://www.fantrax.com/fxea/general/{method}?leagueId=…`
— `getLeagueInfo` (45 KB: full scoring system, roster rules, 38 scoring + roster
periods, per-player waiver status), `getTeamRosters`, `getStandings`,
`getDraftResults`, `getPlayerIds?sport=EPL` (755 players; sport code is **`EPL`**,
not `SOCCER`).

**Internal SPA API:** `POST https://www.fantrax.com/fxpa/req?leagueId=…` with
`{"msgs":[{"method":…,"data":…}]}`. Cookie auth; returns the caller's `roles`.
Some reads work unauthenticated (`getStandings`, `getPlayerProfile`); league data
returns `WARNING_NOT_LOGGED_IN`.

Methods that matter:
- `confirmOrExecuteTeamRosterChanges` — **lineup writes**. Takes `rosterLimitPeriod`,
  `fantasyTeamId`, `applyToFuturePeriods`, and `adminMode` (commissioner editing
  any team).
- `getCommissionerHubInfo` + `executeCommissionerHubAction({actionKey, …})` — the
  commissioner console. Action keys: `executeAutoSubs`, `processWaivers`,
  `overrideLeagueChampion`, `copyRostersToPast`, `copyRostersToFuture`,
  `generateLeagueHistory`, `undoDraft`, `uncompleteDraft`, `deleteLeague`. **The
  action list is server-driven — render what the hub returns, never hardcode it.**
- `getMatchups` — the fast-updating live H2H scoring page. **Fantrax computes live
  points itself, so its numbers are authoritative**; any engine of ours is a
  fallback proxy, never the primary. (Same lesson as DF's per-GW points.)
- `getScorerDetails`, `getPlayerProfile` (public), `getPlayerNews`,
  `setPlayerNews` / `setPlayerNote` / `removePlayerNote` — per-player notes are
  **writable**, which is the native home for "info we hold on each player".
- `executeTrade`, `confirmOrExecutePlayerPickerChanges`, `findPlayers`.

### Auth constraint — read before designing any login

Fantrax's `login` method is gated by **reCAPTCHA v3 with a v2 image fallback**, plus
2FA and `ACCOUNT_LOCKED`. Server-side password login is **not viable** — the trick
the World Cup app used (minting sessions from stored credentials against Supabase)
does not transfer. Members hand over a **session cookie** from their own browser
via an extension; we never hold passwords. Store encrypted, per user, revocable.

### Identity

Fantrax exposes `rotowireId` (71% coverage) and `sportRadarId`. The pipeline at
`~/ai-carling-premiership/src/identity/` mints canonical `person_id`/`root_id` and
bridges FPL/SofaScore/FotMob/Understat/Transfermarkt — but has **no RotoWire or
SportRadar ID space**, so those are not a shortcut. The Fantrax bridge must be
built by matching normalised name + club + position, generated once, **hand-audited**,
and persisted as `source_mappings.fantrax`. Never name-match at runtime.

## Conventions

- All provider I/O stays in its adapter (`packages/core/src/*/[provider]/client.ts`).
  Shaping goes in `map.ts` and stays **pure** — no clock, no network, so it is
  testable. `fetchedAt` is injected, never read from `Date.now()` inside a mapper.
- Treat scraped data as untrusted and optional. Render gracefully when a field is
  missing; a blank page is a worse failure than a hedged number.
- Pure logic lives in `packages/core`, never in components. Add a test when you
  touch it.
- Phone-first: single column, thumb-reachable, readable at arm's length.

## Verify

```bash
npm test          # vitest across packages/*
npm run build     # Next production build — runs ESLint and TypeScript
npm run dev       # http://localhost:3000
```

## Next.js 16

Breaking changes vs. older training data: route `params` is a `Promise` (await it),
`'use cache'` needs the `cacheComponents` flag. Read `node_modules/next/dist/docs/`
before writing framework code.
