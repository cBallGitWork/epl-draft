# Tim Hortons Pro League — companion + platform monorepo

A companion app for a 10-team Fantrax Premier League draft league that starts **GW6, 10 Oct
2026**, and the groundwork for our own platform in 27/28. Fantrax is the source of truth this
season; this repo republishes the league with what Fantrax lacks.

## Read first

- **`docs/rules/CODE_RULES.md` is binding for all code**: rule of 2/3, no bloat, no hardcoding,
  small files, purity at the core. An exception is recorded in `docs/record/PLATFORM_NOTES.md` in
  the same commit.
- **`docs/rules/DESIGN.md` is binding for anything visible**: a printed paper at `/`, a
  Championship Manager 99/00 desk on League, Prem, Live, News and FPL, and a palette in which every
  colour is a slot with one meaning. It also lists what is deferred on purpose.
- `docs/rules/PRODUCT.md`: who this is for. Read it before a product decision.
- `docs/plans/GAZETTA.md` is the paper's live plan; `docs/plans/ROADMAP.md` is the app's, now
  mostly a record. Mark an item in the commit that lands it.
- `docs/record/PLATFORM_NOTES.md` is what is true now: probes, decisions, rule exceptions. It is
  meant to be read, and `docs-drift-auditor` checks it. `docs/record/SEASON_LOG.md` is dated
  accounts of a day's work, meant to be searched; true as a record, never a claim about the tree.
- `.claude/rules/providers.md` holds the verified FPL, Fantrax and identity facts, including the
  login constraint. It loads in `packages/core/src`, `scripts` and the app's data modules. Read it
  before designing on a provider field.
- When asked for a plan, start from this season's needs, then the long-term platform.

## Stack

Next.js 16.2.7 (App Router) · React 19.2 · TypeScript 5 · Tailwind 4 · vitest 3 · ESLint 9 ·
Node 24 locally, 22 in CI · npm workspaces · deployed on Vercel.

```
packages/core   domain types, adapters, scoring, competition engines, identity
packages/ui     empty until a second consumer needs it
apps/companion  the 26/27 app
apps/lab        the 27/28 platform prototype, empty on purpose
scripts/        capture, the bridge, the paper's writer, health checks, scripts/ci/push.sh
data/           snapshots, mappings, intel, editions, leagues (committed)
tools/ui/       browser instruments over one shared cdp.mjs
```

Next 16: route `params` may be a `Promise` (await it); `'use cache'` needs `cacheComponents`.
Read `node_modules/next/dist/docs/` before writing framework code.

## Commands

All four green before every commit:

```bash
npm test          # vitest across packages/*, scripts/ and the app
npm run typecheck # core, scripts and the app, all with --noUnusedLocals
npm run lint      # ESLint; next build stopped running it at Next 16
npm run build     # Next production build
```

Before a push, three more, against a running app:

```bash
FANTRAX_LEAGUE_ID=<id> npm run start &                                   # refuses without a league
SMOKE_BASE=http://localhost:3000 FANTRAX_LEAGUE_ID=<id> npm run smoke    # every route
npm run shape-diff     # the real league still answers in the shape raw.ts expects
npm run bridge:check   # every rostered player resolves to a footballer
```

Data and league health, which no test can tell you:

```bash
npm run capture         # every recorded league + the pool into data/snapshots/ (pull first)
npm run capture:status  # per-league staleness; non-zero when overdue
npm run periods         # period↔gameweek alignment against live FPL
npm run bridge          # regenerate the Fantrax→FPL mapping
npm run roster-limits   # position MIN/MAX off the commissioner's setup page; needs
                        # FANTRAX_COOKIE; re-run after the draft
npm run team-codes      # one sign-in code per team, printed once
npm run scout-xi        # Scout's predicted elevens; CI runs it every two hours
npm run edition         # file the paper's due stories; needs ANTHROPIC_API_KEY
npm run intel-check     # is the intel export fresh and whole
```

## Environment

- **No league is named in code.** `FANTRAX_LEAGUE_ID` names the one league served, with no
  default: Vercel for the app (the rehearsal league, `zbn1z3ukmsgb36sz`, until 10 Oct),
  `apps/companion/.env.local` for `next dev`, the shell for a script. The server, the writer,
  smoke and team-codes refuse to run without it. CI keeps no copy: it asks production
  (`GET /api/league`). **The swap is one change**: set it to `ayyoh3n2mr326v2o` in Vercel and
  redeploy (`/swap-day`).
- The leagues the archive records are data, in `data/leagues/recorded.json`; only scripts read it.
- `FANTRAX_DEMO_TEAM_ID` lends a test league's team to a reader with no code, and only when that
  team is in the served league.
- **Two `.env.local` files.** `next dev` roots at `apps/companion`, so the app reads
  `apps/companion/.env.local` (`SESSION_SECRET`, `TEAM_CODES`, `FANTRAX_LEAGUE_ID`,
  `FANTRAX_DEMO_TEAM_ID`) and never the repo root's. Next prints `- Environments: .env.local` when
  it loaded one.
- Scripts load an env file only when their npm script passes one: `team-codes` reads the app's
  (its secret must be the one the app verifies with), `roster-limits` reads the root's, and
  `edition` reads the root's with `--env-file-if-exists` (CI has no file; the key is a
  repository secret).
- Secrets: `write-edition` needs `ANTHROPIC_API_KEY` (`OPENAI_API_KEY` is optional, for the
  drawing); `roster-limits` needs `FANTRAX_COOKIE`. Everything else reads public endpoints.

## Architecture: two layers, never conflated

```
football layer (FPL, public)      →  the real Premier League
league layer  (Fantrax, cookie)   →  our fantasy competition
        ↘ join on player identity ↙
```

The football layer is permanent; the league layer is an adapter, replaceable in 27/28 without
touching football or the UI. **FPL's rules are fixed, so they can be constants. Custom rules are
Fantrax's product**: roster limits, positions, scoring, the period calendar, the lineup deadline,
team count, the schedule and the draft type are all data read from `getLeagueInfo`, never assumed
and never inferred from football. An FPL concept crossing into the league arrives in football
clothes: `element_type` did, and `deadline_time` would.

The layers meet at player identity (the bridge) and the calendar, which the league is told as
plain data (`league/calendar.ts` declares its own `GameweekKickoff`). Neither imports the other; a
script does the wiring.

## Conventions

The binding set is `docs/rules/CODE_RULES.md`. The ones that bite most here:

- Provider I/O lives in adapters (`packages/core/src/*/[provider]/client.ts`); mapping (`map.ts`)
  is pure: no clocks, no network. Inject `fetchedAt` and `now`.
- Treat provider data as untrusted and render gracefully on missing fields. Absence is `—`, never
  `0`.
- Pure domain logic lives in `packages/core`, with tests alongside; components present.
- Comments are one line, three at most: what a thing does or what would break. The why goes in the
  commit message, or in PLATFORM_NOTES if it is a standing decision.
- Phone-first: one column, thumb-reachable (`min-h-11`), readable at arm's length.
- A bug starts with the failing test.

## Never

- Name a Fantrax league in code, or hardcode a league rule instead of reading `getLeagueInfo`.
- Import the league layer from football, or the reverse.
- Persist FPL's per-season `id`; persist the season-stable `code`.
- Name-match players at runtime. The bridge (`data/mappings/fantrax.json`) is generated, audited
  and committed.
- Score a player by his own position. Fantrax scores the roster SLOT his manager chose.
- Hold a member's password or plan a login on one (see providers.md).
- Print FPL's count beside a Fantrax figure, or anything of ours under a column headed `FPts`.
- `git add -A`, `git merge`, force-push, or commit on `main`. The hooks deny all four.

## Pitfalls we have hit

- A piped instrument reports the pipe's exit code (`| tail` is tail's). Grep the verdict line.
- `next start` renames itself `next-server`, so `pkill -f "next start"` leaves it running and the
  next smoke tests the old build. Stop it with `pkill -f next-server`, and check the listener
  started after the build.
- Next 16 locks per directory: never start a second dev server. Turbopack in a long-lived
  `next dev` never sees a new file; restart it.
- `.next/types` from another branch's build makes typecheck name routes that are not there. Delete
  `apps/companion/.next/types`.
- Tailwind 4 drops a class it cannot read literally: `bg-bg/45${…}` and `var(--color-fdr-${n})`
  both vanished. Write the names out.
- Two colour utilities on one element resolve by stylesheet order, not class order. Compose a
  different ink from `SMALL_CAPS`, never append one to `LABEL`.
- A rebase merge deploys only its tip, because `ignoreCommand` reads `HEAD^..HEAD`. Squash-merge.
- An unset Actions variable is `""`, not undefined. Use `||`; `requireLeague` refuses the blank.
- A nested `unstable_cache` bypasses its own cache, and `router.refresh()` never invalidates one.
- Hooks match the command string, so a script that merely quotes `git add -A` trips the guard.
- A shot taken while another session drives the same Chrome lies. Use a private `CDP_PORT`.

## The crew — `.claude/`

- **Hooks** deny `git add -A`, `git add .`, `git merge`, `git push --force*` and any commit or push
  on `main`. They ask before `npm run capture` (pull first), a second build or server, cutting a
  branch from another branch, and staging a file past 300 lines. A denial is the hook: do what it
  names instead.
- **`tools/ui/`** holds `.mjs` browser instruments (`shot` `compare` `probe` `sweep` `navfit`
  `tapfit` `pitchfit` `groundfit` `dialog` `pollwatch`) over `cdp.mjs`. They talk to an
  already-running headless Chrome on `CDP_PORT` (default 9261) and never launch one; auth is
  `--team-cookie <file>` or `TEAM_COOKIE`.
- **Skills**: `/verify` `/shoot` `/audit-ui` `/probe` `/refactor`, and four runbooks Craig starts:
  `/phase-gate` `/handover` `/swap-day` `/rehearsal-saturday`.
- **Agents** are read-only: `ui-verifier` looks at the screenshots, `probe-runner` counts the
  payload, `register-warden` judges `docs/rules/DESIGN.md`, `docs-drift-auditor` checks the docs against the tree.
- `.mcp.json` adds Playwright for exploration; deterministic audits stay in `tools/ui/`.

## Working agreement — issues, branches, PRs

Set up 17 Sep 2026 (Craig: *"no working off main, branches for each sub task"*). **An issue is a
task somebody could pick up; a doc records a decision.** Deferrals and open questions live in
ROADMAP's *Explicitly parked*, DESIGN §8's *Deferred, deliberately* and PLATFORM_NOTES' *Questions*,
never in an issue.

**Issues**

1. An issue is for work not started, or blocked. Work in flight is a branch and a PR.
2. One issue, one branch, one PR. No epics.
3. The issue holds state; the doc holds reasoning. Link, never copy.
4. Issues close by merge: `Closes #N` in the PR body.
5. A deferral is not an issue: write it into ROADMAP or DESIGN §8 instead.
6. Reconcile the list at every `/phase-gate`.
7. Titles say what is WRONG, not what to add: *"the desk does not know what day it is"*.

**Branches and PRs**

8. Never work on `main`. Cut from `origin/main`: four crons push to it (capture, editions,
   round-state, scout-xi, all through `scripts/ci/push.sh`). Prefixes: `feat/` `fix/` `refactor/`
   `docs/` `chore/`.
9. Squash-merge, always (see Pitfalls).
10. Stage named paths; another session may be committing in the same tree.
11. Push before the pile grows. Unpushed work is the repo's most-repeated failure.
12. The four gates before any commit; the push three before any push.
13. Every PR carries a two-pass refactor before it opens. **Pass one counts** the duplication:
    extract at three, and at two write down the count you declined at. **Pass two reads what pass
    one left**: orphaned imports, dead bindings, dated comments. A pass that finds nothing says so.
    Refactor and behaviour changes are separate commits.

**Labels** live only in GitHub. Type, exactly one: `feat` `fix` `refactor` `docs` `chore`. Area,
at most one: `paper` `desk` `league` `football` `ci` `intel`. State, only when true: `blocked`
(name the blocker and who can clear it) and `swap-day`. No `parked` or `deferred` label, and no
label for the commit-only prefixes `perf`, `test` and `probe`. One milestone: `10 Oct — swap day`.

**`@claude` on a PR** asks `.github/workflows/claude.yml` for a review. It answers only an owner,
member or collaborator, and it reviews, never merges.
