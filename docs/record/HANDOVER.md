# Handover — 23 Sep 2026, the pre-swap series

Replaces the 3 Sep handover, now `docs/archive/handovers/2026-09-03.md`.

**State.** `origin/main` at `9e9cfec` (#58). This handover is on `docs/handover-23-sep`, 0 ahead
and 0 behind before this commit; the tree was clean. **The gates were run on this tree:** 149
test files, **1560 tests passed**, typecheck clean (core, scripts and the app, all with
`--noUnusedLocals`), lint clean, build ok. Production smoke **34/34** after #58's deploy.
17 days to the swap. Captures are all 0 days old; intel XI is gameweek 6, 20 clubs.

**First thing: nothing is in flight.** Every branch is merged, and no PR is open. Start from
`CLAUDE.md`, which is now a 219-line briefing; the provider facts load from
`.claude/rules/providers.md` when you touch provider code.

## The finding that reorders the rest

**The UI instruments had been measuring a page that was gone.** `sweep`, `tapfit` and
`groundfit` each listed a match's tabs by hand, still walked `/prem/match/<id>/report`, deleted
when Highlights took its place, and reported `ok` on the 404. None of them ever measured
Highlights. So any audit before #57 that called the match tabs clean was one tab short and one
404 long. `tools/ui/routes.mjs` now reads the tabs off `prem/match/[id]/`'s folders.

The same run found `/matchday/desk` and two `/squad` lines printed straight on the photograph
(groundfit 42 elements → 0), so "the desk passes its audit" was not true before today either.

**Screenshots cannot prove a refactor here.** Two identical screenshot runs of `main` disagreed on
17 of 70 shots (the photo ground, image loading). The hydrated DOM agreed on 64 of 70, and the
other 6 were the clock and the tie order below. PR 8 was proven by the DOM
(memory: *prove a refactor by the DOM*).

## What was built — #38 to #58, 21 PRs

**Live and the league**
- An open live page kept polling but stopped updating (#41): the poll is timed on the client, the
  live reads live 20 s against a 30 s poll, and no `/prem` route is static.
- No league is named in code (#48): `FANTRAX_LEAGUE_ID` or nothing, and the server refuses to
  start without it. CI asks production (`GET /api/league`). **The swap is one Vercel change.**
- Teams tied on points swapped places on every read (#58): `placeTable` orders by points, then
  fantasy points for (Craig's rule), then name. Recorded in PLATFORM_NOTES because it is not in
  `getLeagueInfo`.

**Intel**
- Scout's predicted XI is fetched by CI every two hours (`scout-xi.yml`, #46). It is one file per
  season, and club pages show the latest eleven with its date (#43).

**CI**
- Actions are SHA-pinned, checkouts keep no credentials, and every job has a timeout (#51).
- The four writers push through `scripts/ci/push.sh`, which rebases and retries.
  - **Its push path is now proven in CI**: the 17:19Z editions run committed the paper through it.

**Security and correctness (#54)**
- A 15 s deadline on every provider fetch, and 5 min on the two model calls.
- A CSP and the other security headers. 33 routes at both widths, 0 violations.
- A malformed player id never reaches Fantrax, and the four player tabs share one profile read.
- The FPL tab reuses `gameweekLive` (1936/1936 points equal to FPL's).
- **The session cookie is now `v1.<team>.<sig>` under a derived key.** Everyone signed in to
  the rehearsal league signs in once more, with the same code.

**Refactor**
- 17 extractions in #55, each counted: core `time.ts` and `format.ts` (`DASH`, `thousands`),
  `<Absent/>`, `ClubLabel`, `SectionShell`, `ListAndPitch`, `ROW_HOVER`, `FantraxSilent`, four
  route builders and `theirFixture`.
- Dead code out in #56: `ReportSummary` and `packages/ui`. Eight app-only settings moved to
  `app/config.ts`, and the app's typecheck gained `--noUnusedLocals`.
- Files over 300 lines were split in #49, #50 and #52.

**Docs**
- CLAUDE.md went from 523 lines to 219 (#53).
- DESIGN.md and conventions.md: nine false claims fixed (#57).
  - The desk is set in **Oxanium and Jost**, not Archivo.
  - The frozen name column is built.
  - The breakpoints are declared.
  - Four deleted components are no longer named.
- The desk's Anfield photo is credited on `/credits` (#58).

## What was NOT built, and why

Each of these is in PLATFORM_NOTES, "What the pre-swap cleanup declined".

- **Loaders regrouped into `app/read/*`:** about 150 import rewrites, 17 days from the swap.
- **Display modules moved to core:** they are words for a screen. They are tested in place.
- **The app's 12 catches turned into throws:** each is a stated policy (fail open on Live, decoration,
  optional Premier League detail). An on-screen "unavailable" for the optional blocks is a
  DESIGN §8 question.
- **`error`/`not-found` folded into `Nothing`:** it would change both screens.
- **A true 404 status on a malformed player URL:** `/players/loading.tsx` streams first, so it is
  Next's 200 plus the not-found page and `noindex`. A real status needs `proxy.ts`.
- **The declined-with-count table** in `docs/ui/conventions.md` carries today's counts at 2
  (markings, `?gw=`, the lit row, a hand-sized panel) and the 15 refusal ternaries.

## Hazards

- **Two `.env.local` files.** `next start` reads `apps/companion/.env.local`; scripts read the
  root's only when their npm script says so. `npm run start` and `npm run smoke` both need
  `FANTRAX_LEAGUE_ID` in their own shell.
- **`next start` becomes `next-server`.** Stop it with `pkill -f next-server`, or the next smoke tests
  the old build.
- **`next build` fetches Google Fonts.** It failed once today on a network blip (`fetch failed`
  on `archivo_narrow`); a retry passed. It is not a code error.
- **Parallel sessions.** Another session added a memory today (*separate content on mobile*).
  Stage named paths; cut from `origin/main`.
- **Instruments need a private browser.** Headless Chrome on its own `CDP_PORT`, with the team
  cookie minted in the **v1** format (the `/shoot` skill has the new recipe; the old one is
  refused).

## Where the stats are (added 25 Sep 2026)

**`docs/providers/stats.md` is the reference for the stats we hold or can fetch**: FPL, Fantrax (the served league
and the stats league), the Premier League API and the sister repo's intel. It has a row per measurement,
not per field: keys, ids, names, labels and prose are left out on purpose. Each row gives the provider
field, the domain field, how complete it was when counted, and the files that read it. It also lists
what is fetched and read by nobody and what was counted and refused. It says which stats we keep a
dated history of, and which are live reads we could never backfill. `scripts/stats-reference.test.ts`
fails when a cited line stops being where the fields it names are declared, when a stat type gains a
count, flag or keyed bag of figures with no row, when a field or function on its `NAMED` list loses
its row, or when the stats league's columns leave the probe's order. It cannot check a completeness
fraction or a reader list, and it cannot see a text or list field that has no row; re-count those by
hand.
Read it before adding a figure to a screen.

## Still Craig's

1. **Swap day, 10 Oct.** Set `FANTRAX_LEAGUE_ID=mqsjd23smsgbiqzr` in Vercel and redeploy
   (`/swap-day`). This gates the whole real season; nothing else needs to change.
2. **Tell the rehearsal league to sign in once more** with their existing codes. The cookie
   changed in #54, and no code is reissued.
3. **A second Fantrax account holding one rehearsal team.** Unchanged, and it gates the entire
   write track (lineup writes through the commissioner's session). ROADMAP names it.
