# Tim Hortons Pro League — companion + platform monorepo

Read `PRODUCT.md` first for who this is for and why. This file is the technical
contract for architecture, conventions, and what the assistant should keep in mind.

**`CODE_RULES.md` is binding.** Read it before writing any code. Its rules —
rule of 2/3, no bloat, no hardcoding, small files, purity at the core — are hard
rules, not preferences. Exceptions are recorded in `PLATFORM_NOTES.md` in the
same commit.

**`DESIGN.md` is binding for anything visible.** Two registers — a printed paper
at `/` and a Championship Manager 99/00 desk on the other five tabs — League,
Prem, Live, Players and FPL — one shared skeleton, and a palette in which every
colour is a slot with one meaning. It also records what is deliberately
deferred, so an absence is not read as an oversight.

A 10-user **Fantrax** Premier League draft league starts **GW6, 10 Oct 2026**.
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

- `GET /api/bootstrap-static/` — 1.3 MB: 20 clubs, 38 events, and an element
  count that moves with the transfer window (564 on 3 Aug, 600 on 22 Aug — read
  it, never assume it).
  Player `code` is **season-stable** (portraits key off it); `id` is per-season and
  **must not be persisted across seasons**. Carries `opta_code`, `news`,
  `chance_of_playing_next_round`.
  `squad_number` is present as a **key and never as a value** — null on all 622
  elements, checked 29 Aug 2026. This entry used to list it among the fields
  bootstrap carries, which is how a shirt-number fallback came to be designed on
  top of it; a field that is always null is not a field. Count it before
  building on it.
- `GET /api/fixtures/?event={gw}` — fixtures with `started` / `finished` /
  `finished_provisional` / `minutes` / scores.
- `GET /api/event/{gw}/live/` — per-player stats. `{"elements": []}` before the
  round's first kickoff is normal and not an error. **After it, there is a row
  for every player in the league, not only those who played** — 600 elements,
  600 with an `explain` block, 569 of them on zero minutes. So the presence of a
  row says the round has started, never that the man appeared.
- `GET /api/event-status/` — one row per match date, carrying `bonus_added` and
  `points`. The live feed publishes *provisional* bonus long before that flag
  turns, and provisional bonus is by construction the current BPS order — so
  agreement with BPS is not evidence a bonus is final. Nothing reads this; the
  `settled`/`dataChecked` ladder derives the same rungs from reads we already make.
- Portraits: `…/premierleague25/photos/players/110x140/{code}.png` — **PNG only**
  (webp/jpg 403), and note there is no `p` before the code and no 250x250 under
  this prefix. `premierleague25` is the Premier League's own string, read out of
  FPL's production bundle on 19 Aug 2026; it does **not** track the season (we
  are in 26/27) and `premierleague26` answers 502, so it is a recorded fact and
  never something to compute.
  The old path `…/premierleague/photos/players/250x250/p{code}.png` still answers
  **200 with the set as it stood in August 2024** — which is how a season of
  stale portraits went unnoticed: nothing 404s, the players are simply in their
  old shirts. It is deliberately **not** read as a fallback: a player with no
  current photograph gets his club's crest instead, because a wrong photograph is
  worse than none — only one of the two looks like an answer.
  `next.config.ts` allow-lists image paths, so both prefixes must be named there.
- Crests: `…/premierleague/badges/t{code}.svg` (also `/50/`, `/70/` PNG).

### Fantrax — two surfaces

**Public reads, no auth:** `GET https://www.fantrax.com/fxea/general/{method}?leagueId=…`
— `getLeagueInfo`, `getTeamRosters` (takes an optional `period` and echoes it
back), `getStandings`, `getDraftResults`, `getPlayerIds?sport=EPL` (671 entries on 22 Aug —
611 players plus 60 synthetic per-club entities, 20 each of `Tm`/`TmG`/`TmOF`;
it was 759/~699 on 3 Aug, so count it rather than quoting it; sport code is
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
- `getStandings` takes a **`view`**, and `displayedLists.tabs` names all three:
  `REGULAR_SEASON` (the table), `SCHEDULE` (their "Results", 38 period tables)
  and `SEASON_STATS` (29 tables of per-category team totals). We read the first
  two. **Its stat tables repeat one header key eleven times**, so they must be
  read positionally — the inverse of the read-by-key rule the league table needs
  — and its "Games Played" counts player appearances, not rounds. PLATFORM_NOTES
  carries the probe.
- `getScorerDetails`, `getPlayerProfile`, `getPlayerNews`, `setPlayerNews`,
  `setPlayerNote`, `removePlayerNote` — per-player notes are writable and are the
  native home for our player metadata.
- `executeTrade`, `confirmOrExecutePlayerPickerChanges`, `findPlayers`.

### Auth constraint — read before designing any login

Fantrax login uses **reCAPTCHA v3 with a v2 image fallback**, plus 2FA and
`ACCOUNT_LOCKED`. Server-side password login is not viable. Members must provide
their own browser session cookie. We do not hold passwords.

**And "via a browser extension" is not a plan.** Ten friends will not install
one, and most of them read this on a phone, where Chrome has no extensions at all
and Safari's are a per-user install nobody is doing. Any write surface has to
work for a person holding a phone who has never heard of a cookie. The one route
that does is the commissioner's own session plus `adminMode` — one cookie, kept
by one person, writing on behalf of members our own team codes have already
authenticated. Unprobed as of 19 Aug 2026; see PLATFORM_NOTES.

### Fantrax scores the roster slot, not the player

Their scoring is position-dependent (`G: {D:6, M:5, F:4}`, `CS: {D:4, M:1}`) and
the position applied is **the slot his manager chose**, not any single position
of his own. 48 of 607 players are eligible at two — `getLeagueInfo.playerInfo`
carries `eligiblePos` like `"F,M"` — and `getPlayerIds`' one letter per man is the
global pool's default, never the league's answer. Saka is `F,M`, filed at M:
`getLiveScoringStats` pays him 8 at midfield rates while `getPlayerStats` pays him
6 at forward rates. So the pool table's `FPts` is not what a player scored for his
owner. **Read the roster slot, never a position off the player.**

### Identity

Fantrax exposes `rotowireId` on about four players in five — 544 of 699 on 3 Aug,
and the denominator has moved since (see the pool counts above), so count it
rather than quoting it. **`sportRadarId` is not on this endpoint at all** — it is not a second identity space. The existing
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
npm test          # vitest across packages/* and scripts/
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
`TEAM_CODES`) and never sees the repo-root one. Next prints
`- Environments: .env.local` at startup when it has loaded one; its absence is
the tell.

**Scripts load nothing unless their npm script says so**, and now two do:
`team-codes` passes `--env-file=apps/companion/.env.local`, because the secret it
mints hashes with must be the one the app verifies with, and reading the
verifier's own file is what stops the two drifting; `edition` passes
`--env-file-if-exists=.env.local` (the repo-root one), because the writer's keys
are nobody else's and the app never holds them.

**`-if-exists`, and not the plain flag.** The same script runs in CI, where there
is no `.env.local` and the key arrives as a repository secret in the environment.
A hard `--env-file` would abort the workflow on a missing file, which is the one
place the file is *supposed* to be missing.

`write-edition` needs `ANTHROPIC_API_KEY` and throws without it, and it needs
`FANTRAX_LEAGUE_ID` too; `OPENAI_API_KEY` is optional and costs only the drawing.
Every other script reads public endpoints and needs nothing — and nothing in the
tracked tree reads `FANTRAX_COOKIE` at all.

*This paragraph used to say scripts read the repo-root file via `node --env-file`.
Nothing did: no npm script passed the flag, so `npm run team-codes` failed with
"SESSION_SECRET is not set" while both files held one, and the remedy it printed
would have invalidated every code already issued. Corrected 27 Aug 2026.*

*And it said both key-reading scripts "only ever run in CI". `write-edition` ran
locally on 2 Sep to file the paper's first stories, which is what exposed that
`npm run edition` passed no `--env-file` at all: a key sitting in either
`.env.local` was silently ignored, and the command failed as though no key
existed anywhere. Corrected 2 Sep 2026.*

`FANTRAX_LEAGUE_ID` selects the league the app serves; it defaults to the
**dummy** league (`config.ts` — `process.env.FANTRAX_LEAGUE_ID || leagueId("dummy")`).
This said "rehearsal" in three places until 2 Sep 2026 and was never true: the
dummy league is the ten-team one `next dev` opens on, and the rehearsal league
is a separate id you have to ask for. Setting it to `ayyoh3n2mr326v2o` is
**most** of the 10 Oct swap — the other half is `.github/workflows/editions.yml`, whose job has its own
environment and inherits nothing from Vercel. Miss it and CI keeps filing a
column about the rehearsal league; the front page will refuse to print it
(`PublishedStory.leagueId`, filtered by `normalizePaper`), so the failure is a
paper with no prose rather
than a paper about the wrong league, but it is still a failure.

Running against the real league now is how the empty states get tested.

## Next.js 16

Route `params` may be a `Promise` (await it). `'use cache'` now needs the
`cacheComponents` flag. Check `node_modules/next/dist/docs/` when writing framework
code.

## The crew — `.claude/`

Committed and project-level, so every session gets it.

**Hooks fire before you do.** `git add -A`, `git add .`, `git merge` and
`git push --force*` are **denied** — stage named paths, and rebase. You are
**asked** before `npm run capture` (pull first: `capture:status` counts
directories, so it cannot tell "the cron stopped" from "this tree never
pulled") and before a second build or server. A denial is the hook, not a
judgement about you; do the thing it names instead.

**`tools/ui/` is the instrument drawer** — `.mjs` browser instruments, outside
the tsc and vitest globs on purpose. `shot` `compare` `probe` `sweep` `navfit`
`tapfit` `pitchfit` `groundfit` `dialog` over one shared `cdp.mjs`. They talk to an already-running headless Chrome on
`CDP_PORT` (9261) and never launch one; auth is `--team-cookie <file>` or
`TEAM_COOKIE`, never a positional.

**Skills are the named rituals** — `/verify` `/shoot` `/audit-ui` `/probe`
`/refactor`, and four runbooks Craig starts: `/phase-gate` `/handover`
`/swap-day` `/rehearsal-saturday`.

**Agents are read-only** and see what a diff review cannot: `ui-verifier` opens
the screenshots, `probe-runner` counts the payload, `register-warden` judges
DESIGN.md, `docs-drift-auditor` checks the docs against the tree.

`.mcp.json` adds Playwright for interactive exploration. Deterministic audits
stay in `tools/ui/` — a repeatable number is what a claim needs.
