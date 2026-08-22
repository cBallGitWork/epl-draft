# Roadmap to 10 Oct — the UI refactor, the dated work, and two ideas un-parked

Written 19 Aug 2026. When an item lands, mark it here in the same commit —
like `docs/ui/`, this file starts lying the moment the work moves without it.

## Context

Phase 1 and 2 of the last plan landed 19 Aug: main is clean at `3a9c56f`, 383
tests green, production deployed, and `docs/ui/` written as the handover for the
visual pass. Craig asked for the forward plan and a recall of the ideas he'd
given that aren't yet built. A full UI prompt refactor is coming; this roadmap
sequences it against the dated season work and un-parks two ideas Craig chose:
**probe `adminMode`** and **the player notes store**. Custom competitions and
`apps/lab` stay parked.

## The recall — ideas Craig gave that aren't built

| Idea | Where recorded | Status |
|---|---|---|
| Custom competitions (H2H groups, cups, points leagues over Fantrax points) | PRODUCT.md | **Shape landed 20 Aug** — a declared cup and playoff, labelled a placeholder, on `/league/schedule`. The feature is still parked; what is built is the seam. |
| Per-player intelligence store via `setPlayerNote` | CLAUDE.md fxpa methods | **In scope** (this session) |
| Commissioner cookie + `adminMode` as the only viable write path | PLATFORM_NOTES "extension plan is dead" | **In scope** — probe it |
| 27/28 draft/FM hybrid, `apps/lab` | PRODUCT.md | Parked, empty on purpose |
| FPL as one small tab | memory, 6 Aug | Done — keep it small |

Design calls that bind the refactor (all Craig's, all recorded): stale photo =
missing photo = club crest; shrink never wrap; no pitch surround; scoreline is
one row; accent means "you" and nothing else; `min-h-9` on the squad toggle is
the one touch-target exception.

---

## 1. Now → 21 Aug — UI refactor, first tranche

The refactor is the visual pass `docs/ui/` was written for: pull every page
toward `/squad/[teamId]` (the reference — full-bleed angled pitch, cut-out
players, FDR chips, tap-to-open card). Order by payoff, doing first the pages
that don't need live football:

1. ~~**`/players`** — "it is a spreadsheet": 697 rows, no faces, no crests.~~
   *Done 20 Aug (`6055a95`) — every row leads with the 32px mark; the FPL code
   comes off the bridge, so the page keeps its single provider.*
2. ~~**`/players/[fantraxId]`** — no portrait, no crest, on a page about one
   footballer.~~ *Done 20 Aug (`9f544d1`) — the cut-out at 112px on his club's
   colour, crest and number on it.*
3. ~~**`/` Gazetta** — "called a paper and does not look like one".~~ *Done
   20 Aug (`96b39bf`) — a real masthead with a dateline, columns on rules
   instead of cards, the league register leading.*
4. ~~**`/league`** — plain table; emphasise rank vs points, mark your row
   harder.~~ *Done 20 Aug (`a152758`).*
5. ~~**`/squad`** — rows are a name and a number.~~ *Done 20 Aug (`12101eb`) —
   who each manager plays this week, free from the payload already fetched.
   Form and record would need `getStandings`; recorded as a gap.*
6. ~~**`/league/schedule`** — a jump/anchor to the current period.~~ *Done 20 Aug, and further: gameweek and competition dropdowns, opens on the current-or-next round with its scores, archived results, Fantrax team badges.*
7. ~~**`/fpl`** — the one squad still a list; `PitchFrame` reuse is free.~~
   *Partly done 20 Aug (`5ebd6e4`) — XI and bench split, the bench totalling
   what was left on it. **The "free" claim was wrong**: a pitch needs positional
   lines and the football layer deliberately carries no position, so an FPL
   pitch needs `element_type` carried by the FPL entry layer. Shape recorded in
   `docs/ui/fpl.md`; "keep the tab small" says it needs a reason beyond
   symmetry.*

~~**Defer until live football exists (21 Aug+):** `/matchday` (two unrelated
designs stacked), `/league/matchups` (nothing separates a blowout from a close
match, live from finished), `/gw/[gameweek]` (nothing marks a match with *your*
players in it), and the matchup board's list mode.~~ **Built 20 Aug instead**,
Craig's call — eight commits, `5bfdbab`..`c17f367`. The Final-state ladder,
your players marked, ownership tags, one scoreline grammar on all three
head-to-head surfaces, the afternoon strip and the Desk. Everything in it is
**written and unwitnessed**; PLATFORM_NOTES carries the observation list for
Saturday, and the board's list-mode XI/bench split is the one item still
deliberately waiting for it.

**Non-negotiables** (from `docs/ui/README.md` + `conventions.md`): the lineup
gate, provenance at point of use, absence ≠ zero, phone-first `min-h-11`; the
colour registers stay unmuddled; the Tailwind v4 literal-token trap
(`FixtureChip`'s written-out `Record`); each page's `docs/ui/*.md` updated in
the same commit or it starts lying. CODE_RULES stays binding — the refactor
never mixes with behaviour changes.

## 2. Also before 21 Aug — probe `adminMode` (the write-surface question)

The extension plan is dead; everything rests on whether
`confirmOrExecuteTeamRosterChanges` with `adminMode: true` lets the
commissioner's session write **another team's** lineup. Answerable safely
against the rehearsal league (`zbn1z3ukmsgb36sz`) — its four auto-drafted teams
belong to nobody.

- ~~One probe script (scratch, not shipped)~~ **Read-only half done 20 Aug;
  the rest is BLOCKED and the plan above was wrong.** The rehearsal league's
  four teams do *not* belong to nobody — `myTeamIds` says the commissioner owns
  all four, so a successful write there proves only that a man can edit his own
  team. That is a false positive that would green-light the entire write
  surface. Full findings in PLATFORM_NOTES, 20 Aug.
- **Unblocking step, and it is Craig's:** a second Fantrax account holding one
  rehearsal team (`replaceOwner.go` / `COMMISH_TEAM_PERMISSIONS` are in the
  commissioner hub). Then the probe has a control and its answer means
  something.
- Established meanwhile: the cookie authenticates, carries `commissioner: true`,
  `adminMode` is accepted and echoed by `getTeamRosterInfo`, and the hub
  publishes a **`COMMISH_TEAM_ADMIN`** link — strong evidence the capability
  exists, but a link key is not a probe.
- Record the answer in PLATFORM_NOTES either way.
- **If yes:** design the cookie flow — one cookie, visible staleness state, a
  path back to "open Fantrax yourself" (one stale cookie downs writes for all
  sixteen at once). Members authenticate with the team codes we already issue.
- **If no:** option 3 stands (plan in our app, deep-link to Fantrax to submit)
  and the cookie-flow work item closes.

## 3. 21 Aug — GW1 is live (Lane B) — worked 22 Aug, one match played

- ~~Re-read `getPlayerStats`~~ **Answered 22 Aug: it flipped.** The default is
  now `SEASON_926_YEAR_TO_DATE` with real numbers, so the pool's points column
  stays where it is and the sixteen `getTeamRosterInfo` reads are not needed.
  `/players` reads the season off `displayedSeasonOrProjection` and already
  prints "2026-27 - YTD" unprompted. **But** that column is priced at the
  player's *listed* position rather than the slot his owner has him in — a
  different and smaller problem, sized in PLATFORM_NOTES and left for Craig.
- ~~Watch one defender through a final whistle~~ **Half answered.** Gabriel, a
  defender who played 90 in a clean sheet, settled at Fantrax's **+4** — the
  same number `pendingCleanSheets` would have previewed, and it prices off
  `slot.position`, which is the right side of the split above. The divergence
  case is still open: theirs is "on field", so a defender subbed off before his
  side concedes is the one we would over-count, and that needs a substitution to
  happen in front of us.
- ~~Confirm Fantrax's numbers move~~ **They move.** 5.0 / 9.0 / 0.0 / 16.0 off a
  single fixture, and `getStandings` carries the same totals. What is still
  unwitnessed is whether they move *during* a match rather than at the whistle —
  nothing has been in play in any observation window yet.
- **Three bugs the live tranche could only show once football existed, found and
  fixed 22 Aug** (see PLATFORM_NOTES): every player read as "played" from the
  round's first whistle, so no squad screen printed a fixture; the front page
  burned a live dot for about sixty-one of GW1's seventy-four hours; and the
  afternoon strip printed hours without days across a Friday-to-Monday round.
- Still to do against real data: the board's list-mode XI/bench split, and the
  deferred design judgements (trailing dim at arm's length, whether finished
  pairings sort below live ones).

## 4. After the GW1 weekend — the parked refactors unlock

From HANDOVER §1, in this order only if their triggers still fire:
`contribution` shape over the four "what did he do" renderings; `leagueCache()`
over nine `unstable_cache` wrappers; `readerTeamId()` over six
hand-discriminations; splitting `fantrax/stats.ts`, `league/types.ts`,
`app/page.tsx`, and the four over-ceiling test files.

## 5. 28 Aug — period 1 ends

- Re-ask whether `?period=N` serves history once a period has completed.
- Check whether league scoring starts at period 1 or period 6 once the real
  league's teams join.

## 6. By 3 Sep — prove the swap (week-4 items, confirmed unbuilt)

- ~~**Shape-diff script** (does not exist)~~ **Built 20 Aug — `npm run
  shape-diff`.** Real league's live payloads against the rehearsal league's, read
  for read; pure differ in `league/fantrax/shape.ts` with 16 tests. Exits
  non-zero on the dangerous direction only, so CI can gate on it. Still the
  11:00 item on the ship-day runbook. **Its first run found the playoff and the
  scoring divergence below** — see PLATFORM_NOTES, 20 Aug.
- ~~**CI job against the real league id**~~ **Done 20 Aug.** `npm run smoke`
  walks every view against whichever league it is pointed at, and `verify.yml`
  runs it against both on every push. It asserts the empty states for a league
  with no teams *and* asserts their absence for one with teams — the half that
  catches the bug `edition.ts` actually shipped.
- ~~Re-run `npm run bridge` after rehearsal waiver churn; gate on zero
  rostered-but-unmapped.~~ **Gate built 20 Aug — `npm run bridge:check`, in CI
  on every push.** First run: 60 rostered slots, no holes. The re-run itself is
  deliberately not done — the gate says the bridge already covers everyone
  rostered, and regenerating would churn a file holding three review rows
  waiting on Craig, to fix nothing. The gate is what will say when a re-run is
  actually needed.
- ~~Pull the **Ignored Build Step** lever~~ **Done 20 Aug** —
  `apps/companion/vercel.json`, `:(top)`-prefixed because Vercel's root is
  `apps/companion`. A commit touching only `data/snapshots` no longer redeploys.
  **Needs one check from Craig on the next capture commit**, since only a real
  Vercel run proves it fires.

## 7. Player notes store (after tranche 1, no hard date)

`setPlayerNote` / `removePlayerNote` are writable via fxpa and are the native
home for our per-player metadata (CLAUDE.md).

- Probe write+read against the rehearsal league with the commissioner cookie;
  record shape in PLATFORM_NOTES.
- Read path is nearly free: `getPlayerProfile` is already fetched per tap on
  `/players/[fantraxId]` — surface the note there first.
- Decide what lives in it (scouting notes, waiver intel) before building any
  write UI; the write UI itself may wait on the §2 cookie-flow answer since
  it's the same auth question.

## 8. Before 10 Oct — launch checklist

- **Commissioner renames the league in Fantrax** — it is "Tim Hortons Pro
  League 24/25" and the schedule page prints it verbatim. Setting, not code.
- The 3 review rows (`Fred Heath`, `Enzo Kana Biyik`, `Lucas Pitt`) — Craig's
  call; only a person writes `unmappedBy: "manual"`.
- Issue team codes to the sixteen (`npm run team-codes`).
- Ship-day runbook: set `FANTRAX_LEAGUE_ID=ayyoh3n2mr326v2o` **in the Vercel
  dashboard** → capture → shape-diff → bridge → unmapped gate → redeploy →
  verify the deployed URL, not the commit.

## Explicitly parked

`apps/lab` · FPL authenticated endpoints · member-held cookies in any form ·
scoring engine (dead — Fantrax's numbers are public and authoritative). Custom
competitions keep their placeholder and go no further until Craig settles a real
cup — `PLACEHOLDER_ROUNDS` is the one thing that then changes.

## Verification

- Four green before every commit: `npm test`, `npm run typecheck`,
  `npm run lint`, `npm run build`.
- Standing acceptance test: every changed page renders against **both** league
  ids (roster limits 15/11/5 vs 14/11/3 is the hardcoding canary).
- UI changes: walk the changed routes in `npm run dev` on a phone-width
  viewport; grep page source for anything a `"use client"` boundary serialises
  that the screen withholds (the lineup-leak lesson).
- Probes: results recorded in PLATFORM_NOTES in the same session, dated.
