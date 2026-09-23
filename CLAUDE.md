# Tim Hortons Pro League — companion + platform monorepo

Read `docs/rules/PRODUCT.md` first for who this is for and why. This file is the technical
contract for architecture, conventions, and what the assistant should keep in mind.

**`docs/rules/CODE_RULES.md` is binding.** Read it before writing any code. Its rules —
rule of 2/3, no bloat, no hardcoding, small files, purity at the core — are hard
rules, not preferences. Exceptions are recorded in `docs/record/PLATFORM_NOTES.md` in the
same commit.

**`docs/plans/GAZETTA.md` is the paper's own plan**, and it is the live one: what has
shipped, what is next, and one branch per item. `docs/plans/ROADMAP.md` is the app's and has
become a record of what landed rather than a plan for what is next. Both obey the
same rule — when an item lands, it is marked in the same commit.

**`docs/rules/DESIGN.md` is binding for anything visible.** Two registers — a printed paper
at `/` and a Championship Manager 99/00 desk on the other five tabs — League,
Prem, Live, News and FPL — one shared skeleton, and a palette in which every
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

- Read `docs/rules/CODE_RULES.md` before writing code. It overrides habit and convenience.
- Read `docs/rules/PRODUCT.md` before making product-level decisions.
- Keep `docs/record/PLATFORM_NOTES.md` up to date with architecture decisions, season
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

We keep two files, split on 3 Sep 2026 because one of them had reached 4,784
lines and the 300 an agent actually needs were buried in the middle of it.

**`docs/record/PLATFORM_NOTES.md` — the standing half, and it is meant to be READ.** What is
true now, what was probed and must not be re-derived, what was decided, and
which rules have recorded exceptions. It is no longer exempt from
`docs-drift-auditor`, which is the point of splitting it.

**`docs/record/SEASON_LOG.md` — the dated entries, and they are meant to be SEARCHED.** An
account of a day's work. True as a record, never a claim about the tree today.

The rule for which half a new section belongs in: a standing fact, a probe
result, a decision or a rule goes in the first; an account of a day's work goes
in the second.

Use them for:

- architecture and data decisions
- Fantrax/FPL quirks and API gotchas
- season milestones and blockers
- feature ideas and follow-up work
- things we must remember next season

## Verified API facts (probed live, 3 Aug 2026 — do not re-derive)

### FPL — public, no auth

- `GET /api/bootstrap-static/` — 1.3 MB: 20 clubs, 38 events, and an element
  count that moves with the transfer window (564 on 3 Aug, 600 on 22 Aug, **652 on
  4 Sep** — read it, never assume it).
  Player `code` is **season-stable** (portraits key off it); `id` is per-season and
  **must not be persisted across seasons**. Carries `opta_code`, `news`,
  `chance_of_playing_next_round`.
  **109 keys per element; the mapper reads 31 and the domain carries 28.** Counted 4 Sep 2026, the ones a player
  screen wants: `birth_date` 633/652 · `team_join_date` 633 · `known_name` 72 ·
  `status` 652 (`a`490 `u`91 `i`55 `d`15 `s`1) · `influence`/`creativity`/`threat`
  652 as decimal STRINGS · `penalties_order` 64, `direct_freekicks_order` 56,
  `corners_and_indirect_freekicks_order` 79 · `scout_news_link` 43.
  Counted and **refused**: the three `*_text` companions to the set-piece orders
  are **0/652** — the order is the data, the prose is not; `scout_risks` is a key
  on all 652 and a non-empty array on **7**, every entry `loan_ineligible`, which
  is a footnote and never a tab; `region` is 633 but 67 opaque integers with no
  lookup published, retired by Fantrax's plain-text birthplace;
  `teams[].strength_attack_*`/`strength_defence_*` are **0/20 non-zero**.
  `squad_number` is present as a **key and never as a value** — null on all 622
  elements, checked 29 Aug 2026. This entry used to list it among the fields
  bootstrap carries, which is how a shirt-number fallback came to be designed on
  top of it; a field that is always null is not a field. Count it before
  building on it.
- `GET /api/fixtures/?event={gw}` — fixtures with `started` / `finished` /
  `finished_provisional` / `minutes` / scores.
- `GET /api/element-summary/{id}/` — one player's own season, 13.7 KB. `history`
  (per-GW, the only read that gives bps and expected goals PER FIXTURE),
  `history_past` (completed seasons) and `fixtures` (his run, with FPL's own
  difficulty). **`history_past` writes every key on every row back to 2014/15**,
  so a statistic FPL did not collect that year is a nought and not an absence —
  `starts`, the expected family, tackles and defensive contribution all read zero
  for Maguire's 2021/22, a season in which he played **2,513 minutes**. Counted
  4 Sep 2026 across eight long-career players; `fpl/raw.ts` carries the table.
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
- Portraits: `…/premierleague25/photos/players/{size}/{code}.png` — **PNG only**
  (and since 10 Sep 2026 **no pitch reads them**: a pitch draws the club's kit,
  because the fallback ladder below is what put three kinds of object in one line
  of eleven. Faces survive where a page is about one man. PLATFORM_NOTES carries
  the counts, including the 40/40 on `shirt_{code}[_1]-220.png`.)
  (webp/jpg 403), and note there is no `p` before the code and no 250x250 under
  this prefix. **Two sizes worth asking for, not one** — counted across 120 random
  players on 4 Sep 2026: `110x140` **105/120**, and it serves a real 220x280 PNG
  despite the name; **`500x500` 104/120**, a real 500x500. `220x280` as a literal
  path is **12/120** and mostly a genuine 404, so it is not a second name for the
  small one — that claim came from probing a single player who happened to have
  it, and is the reason this line carries a denominator. This file and
  `portraits.ts` both said 110x140 was the only size published, and a soft lead
  picture was blamed on a ceiling that sits more than twice as high. 15 of the
  120 have no photograph at any size. `premierleague25` is the Premier League's own string, read out of
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

The full, binding set is in `docs/rules/CODE_RULES.md`. The ones that bite most often here:

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
npm run roster-limits   # re-read the position MIN/MAX off the commissioner's
                        # setup page — the one roster rule no JSON endpoint has.
                        # Needs FANTRAX_COOKIE. The real league has no table
                        # until it has members, so re-run it after the draft.
npm run team-codes      # issue one sign-in code per team; prints them once
npm run scout-xi        # Scout's predicted elevens into data/intel/xi/; writes only on
                        # a change. CI runs it every two hours (scout-xi.yml).
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

**No league is named in the code** (Craig, 23 Sep 2026: *"We shouldn't be hard
coding any Fantrax league. Once my real league is in, should be a straight
swap"*).

- `FANTRAX_LEAGUE_ID` in Vercel's environment is the only place the served
  league is set. There is no default: the server refuses to start without it
  (`instrumentation.ts`), and so do the writer, smoke and team-codes
  (`requireLeague`). `next dev` reads it from `apps/companion/.env.local`.
- **CI asks production** (`GET /api/league`) and keeps no copy, so the paper can
  never file about a league the site isn't serving. The 10 Oct swap is changing
  that one Vercel value to `ayyoh3n2mr326v2o` and redeploying.
- Production serves the rehearsal league today (verified 21 Sep by matching
  team ids).
- The leagues the archive records are data, in `data/leagues/recorded.json`:
  capture, capture-status, bridge:check, shape-diff, roster-limits and the
  verify walk read it, and the app never does.
- `FANTRAX_DEMO_TEAM_ID` lends a test league's team to a reader with no code,
  and only when that team is in the served league.

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

**Three more since 17 Sep 2026, each for a mistake made that day**, because
branch protection is a paid feature on a private repo and this is the only place
the working agreement can be machinery rather than manners:

- **A commit or push on `main` is DENIED.** Rule 8 is one branch per piece of
  work. The crons are the exception and do not run through the hook.
- **Cutting a branch from another branch ASKS.** A PR stacked on a branch is
  auto-closed by GitHub when that branch is deleted on merge — it happened to
  PR #3 and cost a rebuild.
- **A staged file past the 300-line ceiling ASKS.** `line_ceiling.sh` already
  reports this, but it matches `Write|Edit`, and a file edited through a bash
  heredoc never reaches it — which is how `write-edition.ts` reached 302 without
  the hook that exists for it saying a word.

*They match the command string, so a heredoc that merely QUOTES a guarded
command trips the guard. That is the right trade — a guard that parses shell
properly is a guard with bugs — and the way past it is to anchor the edit on
text that does not contain the phrase.*

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
docs/rules/DESIGN.md, `docs-drift-auditor` checks the docs against the tree.

`.mcp.json` adds Playwright for interactive exploration. Deterministic audits
stay in `tools/ui/` — a repeatable number is what a claim needs.

## The working agreement — branches, PRs, issues

Set up 17 Sep 2026, on Craig's ruling: *"time to treat this like a real repo — no
working off main, branches for each sub task"*, and *"set up rules for repos
github issues first, want the project clean"*.

**The split that keeps it clean: an ISSUE is a task somebody could pick up; a DOC
records a decision.** Deferrals, parked ideas and open questions are decisions and
stay where they already live — `docs/plans/ROADMAP.md`'s *Explicitly parked*, `docs/rules/DESIGN.md`
§8's *Deferred, deliberately*, `docs/record/PLATFORM_NOTES.md`'s *Questions*. An issue must
never become the place a deferral is recorded, because three separate rules here
say the record lives in the commit and not in a follow-up (`phase-gate` §5,
CODE_RULES §6, and this file's own *mark it in the same commit*).

### Issues

1. **An issue is for work NOT started, or blocked.** Work in flight is a branch
   and a PR; an issue opened and closed within the hour is bookkeeping.
2. **One issue, one branch, one PR.** No epics. If it needs splitting it was two.
3. **The issue holds STATE; the doc holds REASONING.** `docs/plans/GAZETTA.md` says *why*
   the publishing week is Sunday-anchored; the issue says *do it* and links.
   Never copy the argument across — two copies is one that goes stale.
4. **Issues close by merge, never by hand** — `Closes #N` in the PR body.
5. **A deferral is not an issue.** Closing one as parked means writing it into
   `docs/plans/ROADMAP.md` or `docs/rules/DESIGN.md` §8 in the same breath.
6. **At every `/phase-gate`, reconcile the list.** Close anything nobody can
   justify out loud. That skill's own standard is that a phase closes when
   someone could pull the tree tomorrow and find the docs true.
7. **Titles say what is WRONG, not what to add** — the same style `phase-gate` §6
   sets for commit subjects. *"the desk does not know what day it is"*, never
   *"add a publishing schedule"*.

### Branches and PRs

8. **No working off `main`.** Cut from `origin/main` — three crons push to it, so
   it moves without you. Prefixes are the commit prefixes: `feat/` `fix/`
   `refactor/` `docs/` `chore/`.
9. **Squash merge, always.** `apps/companion/vercel.json`'s `ignoreCommand` reads
   `HEAD^..HEAD`. A rebase merge leaves N commits and Vercel sees only the tip, so
   a branch ending on a docs or `data/` commit lands correctly and **silently
   never deploys** — that has happened twice, at nine commits and at seventy-nine.
10. **Stage named paths.** `git add -A` is hook-denied; a second session may be
    committing in the same tree.
11. **Push before the pile grows.** `docs/record/HANDOVER.md` has opened on unpushed work
    three times — 24 commits, then 72, then 40 on 17 Sep. It is the repo's
    most-repeated failure and it is an agreement problem, not a tooling one.
12. **The four gates before anything leaves**, plus the push three when it does.
13. **Every PR carries a TWO-PASS refactor** (Craig, 17 Sep 2026 — "should be a
    2 pass refactor as a rule"). Both passes run on the branch *before* it
    opens, never as a follow-up branch that never gets cut.

    **Pass one counts.** Grep the duplication and write the number down: extract
    at three, and at two **record the count you declined at** — that half is what
    stops the next session re-opening the question and answering it from taste.

    **Pass two reads what pass one left**, and it is not optional bookkeeping:
    an extraction orphans imports, strips a binding's last consumer and dates the
    comment beside it, and *the first pass cannot see its own leavings*. Both
    passes of the fix that prompted this rule found something — the first a
    forced file split at 302 lines, the second a duplication worth declining at
    two.

    A pass that finds nothing is the honest answer and the PR says so. CODE_RULES
    still forbids mixing a refactor and a behaviour change in one COMMIT, so
    inside the branch they stay separate commits.

### The labels, so they can be rebuilt

They live in GitHub's database and nowhere else. Deliberately not scripted — §1
refuses a mechanism for one caller; if the set ever drifts from this list, *that*
is when `scripts/labels.ts` earns its place.

- **Type**, exactly one, mirroring the commit prefix: `feat` `fix` `refactor`
  `docs` `chore`.
- **Area**, at most one, and these are the scopes already in the log: `paper`
  `desk` `league` `football` `ci` `intel`.
- **State**, only when true: `blocked` (the body names the blocker **and who can
  clear it**) and `swap-day`.

Three deliberate omissions, so nobody tidies them back in. **`paper` settles the
scope split** — the log has both `paper` and `gazetta` for one thing, and
`docs/plans/GAZETTA.md` is a document's name rather than an area's. **`perf`, `test` and
`probe` are real commit prefixes with no label**, because they describe a commit
rather than a task. **There is no `parked` or `deferred` label**, because those
are the docs' words and an open issue nobody intends to do is a graveyard.

**`@claude` on a pull request** asks for a second opinion —
`.github/workflows/claude.yml`, mention-only so it costs nothing idle. It
reviews and never merges. It reads `ANTHROPIC_API_KEY`, the same secret the
paper's writer uses.

### What CI needs, and what it had

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
- **`GAZETTA_MODEL` defaults to `claude-opus-4-8`, and that is current** —
  verified 17 Sep against the model table, $5/$25 per MTok, 1M context. It is
  deliberately NOT `claude-opus-5` despite the identical price: on 4.8 an absent
  `thinking` parameter means no thinking, while on Opus 5 thinking is ON by
  default, so the same request would silently start thinking on every column.

One milestone: **`10 Oct — swap day`**. GitHub's nine stock labels were deleted
the same day — `bug`, `documentation` and `enhancement` say `fix`, `docs` and
`feat` in different words, which is the drift these documents exist to stop.
