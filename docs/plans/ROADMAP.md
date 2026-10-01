# Roadmap to go-live, 7 Oct — the UI refactor, the dated work, and two ideas un-parked

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
| Custom competitions (H2H groups, cups, points leagues over Fantrax points) | docs/rules/PRODUCT.md | **Shape landed 20 Aug** — a declared cup and playoff, labelled a placeholder, on `/league/schedule`. **On screen 27 Sep** — the Timbeibs Cup (double elimination, GW9–17) and the Davy Propper Cup (groups then knockout, GW22–30) in `league/cups/`, shown on `/league/cups` (fixtures and bracket), Schedule and Live with a placeholder draw; the playoff stays Fantrax's. Next: put teams into the slots once GW9 is scored and the groups drawn. |
| Per-player intelligence store via `setPlayerNote` | CLAUDE.md fxpa methods | **In scope** (this session) |
| Commissioner cookie + `adminMode` as the only viable write path | PLATFORM_NOTES "extension plan is dead" | **Probed 28 Sep: it writes.** **Save landed 30 Sep** (#179): the planner saves a lineup and the bench order, behind `LINEUP_SAVE` and `FANTRAX_COOKIE` |
| 27/28 draft/FM hybrid, `apps/lab` | docs/rules/PRODUCT.md | Parked, empty on purpose |
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
   *Done — XI and bench split 20 Aug (`5ebd6e4`), the pitch 22 Aug (`320c6c3`).
   **The "free" claim was wrong and the shape recorded against it was right**: a
   pitch needs positional lines, the football layer deliberately carries no
   position, so `element_type` had to be carried by the FPL entry layer. It is,
   as `FplPick.line`, and `fplLineup` arranges from it — pure and tested. The
   bench stays a list, because four men in the order they come on is an ordering
   and not a shape.*

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
gate, provenance at point of use, absence ≠ zero, phone-first `min-h-11` (a rule
about a thumb: above `lg` a desk row is 28px and a control 36); the
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
- ~~**Unblocking step, and it is Craig's:** a second Fantrax account holding one
  rehearsal team (`replaceOwner.go` / `COMMISH_TEAM_PERMISSIONS` are in the
  commissioner hub). Then the probe has a control and its answer means
  something.~~ **Done by 28 Sep: Notemail.**
- Established meanwhile: the cookie authenticates, carries `commissioner: true`,
  `adminMode` is accepted and echoed by `getTeamRosterInfo`, and the hub
  publishes a **`COMMISH_TEAM_ADMIN`** link — strong evidence the capability
  exists, but a link key is not a probe.
- ~~Record the answer in PLATFORM_NOTES either way.~~ **Answered 28 Sep 2026:
  yes.** A dry run and one saved-and-reverted swap on Notemail; without
  `adminMode` Fantrax refuses. PLATFORM_NOTES, 28 Sep.
- **Yes, so this is next:** design the cookie flow — one cookie, visible staleness state, a
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
- ~~Watch one defender through a final whistle~~ **Answered, with a keeper.**
  `/matchday` rendered `+4` for test3 while Everton led 2–0 at 68' — the first
  number `pendingCleanSheets` has ever produced — and it was Pickford, slotted G.
  At the whistle Fantrax settled him at `CS 1 → 4.0` and the team went 20 → 27.
  **Our +4 became their +4 exactly.** Also learned: at 90' in added time his row
  carried `Sv 4 → 1.0` and neither `Min` nor `CS`, so saves are credited in play
  and minutes are not. The divergence case is still open: theirs is "on field",
  so a defender subbed off before his side concedes is the one we would
  over-count, and that needs a substitution in front of us.
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

## 3b. 27 Aug — GW1 done, GW2 next: the between-rounds state, first look

Eight commits. The full account is in PLATFORM_NOTES, 27 Aug; the headlines:

- **`main` and `origin/main` had diverged and production was serving 19 Aug
  code** — 79 unpushed commits against eight CI capture commits. Rebased (never
  merged: `vercel.json` reads only the tip, so a merge commit would have skipped
  the build), verified, pushed. `capture:status`' OVERDUE was a false alarm from
  the same cause.
- **The two calendars had drifted** and every ordinary squad read crossed them:
  Fantrax was serving period 2 while FPL pointed at gameweek 1, so the desk read
  "Gameweek 1" over 0–0. The period now comes from the round in view.
- **`getLiveScoringStats` honours the period and prices the roster slot**, so the
  eleven finally sums to its header (45 over 45) and "This period" means it.
  Costs no request and deletes three `getTeamRosterInfo` POSTs per window.
- **The playoff is published data** — `numPlayoffTeams: 4` — and the table had
  been drawing the placeholder's invented top two.
- **`/matchday` could not name the round coming up**, and the schedule opened on
  the round just played. Both fixed; `focusGameweek` deliberately untouched.
- Two links that asked the URL a question about the round.

## 4. ~~After the GW1 weekend — the parked refactors unlock~~ **All landed**

Every one of them went in on 20 Aug, before the weekend rather than after it, and
the HANDOVER section this cited no longer exists: `contribution` over the four
"what did he do" renderings, `leagueCache()` over eleven `unstable_cache`
wrappers, `readerTeamId()` over six hand-discriminations, and the splits.

The 22 Aug rounds added their own: `app/positions.ts` over seven renderings of a
Fantrax position letter, `app/unresolved.ts` over three of "why is nobody here",
`app/badges.ts` over three private badge reads, `leads`/`trails` over five
hand-written comparisons of two possibly-missing totals, and `--pitch-band` /
`--player-card-figure` over eight literal dimensions that had to agree.

## 5. 28 Aug — period 1 ends

- ~~Re-ask whether `?period=N` serves history once a period has completed.~~
  **Half answered 27 Aug, a day early and decisively for the part that mattered:**
  `getTeamRosterInfo`'s period is inert for POINTS (periods 1/2/3, byte-identical
  — only the opponent column moves), and `getLiveScoringStats` **does** honour it.
  The app's per-period numbers now come from the latter. What is still genuinely
  open is whether `getTeamRosters` serves a past period's ARRANGEMENT, and that
  is only askable once period 1 has closed — 28 Aug 18:59:58Z. It sets the
  severity of the gate finding below.
- Check whether league scoring starts at period 1 or period 6 once the real
  league's teams join.
- **New, and it outranks both: the lineup gate is anchored on the roster-period
  boundary and the rule it enforces is about the lock.** 33 of 38 roster periods
  open 10:00Z on the Friday for a Saturday lock. Period 4 (11 Sep) is the first
  that bites, at 27 h 45 m of a rival's XI visible early; period 6 (9 Oct) is the
  day before sixteen people arrive. Two commits, shape recorded in PLATFORM_NOTES.

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

## 8. Before go-live, 7 Oct — launch checklist

The real league drafts Sat 3 Oct, the dry run is Tue 6 Oct, the app goes live Wed 7 Oct,
and GW6 locks Sat 10 Oct at 11:15 UTC. `/swap-day` is the runbook.

- ~~**Commissioner renames the league in Fantrax**~~ — settled 25 Sep: the real
  league is `mqsjd23smsgbiqzr`, already "Tim Hortons Pro League 26/27" (#110).
- The 3 review rows (`Fred Heath`, `Enzo Kana Biyik`, `Lucas Pitt`) — Craig's
  call; only a person writes `unmappedBy: "manual"`.
- Issue team codes to the ten (`FANTRAX_LEAGUE_ID=mqsjd23smsgbiqzr npm run team-codes`,
  with production's `SESSION_SECRET`).
- After the draft: capture → roster-limits → bridge → unmapped gate → shape-diff, each a
  data PR. On 7 Oct, one Vercel change (`FANTRAX_LEAGUE_ID=mqsjd23smsgbiqzr`, `TEAM_CODES`,
  `LINEUP_SAVE` naming Craig's team with `FANTRAX_COOKIE`, `FANTRAX_DEMO_TEAM_ID` removed) →
  redeploy → verify the deployed URL, not the commit → `warm.yml`.
- **And "verify the deployed URL" is now one command**, which it was not before
  27 Aug:

  ```bash
  SMOKE_BASE=https://epl-draft-companion.vercel.app   FANTRAX_LEAGUE_ID=mqsjd23smsgbiqzr npm run smoke
  ```

  It prints `✓ served league  <name>`, a manager's team name found on `/league`, so it fails loudly if
  the dashboard value did not take — which is the single step of the swap with
  nothing else standing behind it. Until 27 Aug nothing checked that the server
  served the league the walk was asserting about, and the failure it hid was a
  real one: six routes built **static** against the default league and served
  that way whatever the runtime setting said. See HANDOVER §6.

  Run it **after** the redeploy. Before the draft the real league has teams and empty squads,
  a state smoke must not call drafted.

## 9. 28 Aug — the Gazetta became a newspaper

Craig: *"this is a list, we wanted a news site"*, then *"look at the gazetta in
world cup fantasy, it has a real voice"*. Seven commits. Full account in
PLATFORM_NOTES, 28 Aug.

- **It stopped being a list.** The eleven moved off eleven hairline rows onto
  `PitchRows` grass with cut-outs, and the lead got a full-bleed picture band —
  a photograph for the bench story, the scoreline at 6xl for a result, because
  only one of the four kinds honestly has a face in it.
- **It went live.** `/` was the only live-worthy surface in the app that never
  mounted `AutoRefresh`. It now polls like every other screen, leads on an *As
  it stands* splash while the round runs, and flashes any figure that moved
  (with a reduced-motion crossfade, which docs/rules/PRODUCT.md requires by name).
- **It runs more than one story.** `stories()` returns the whole running order;
  the page leads on the first and runs two more as headlines.
- **It got a voice**, and the voice is not a template. A columnist writes a
  preview when lineups lock and a report when the football stops — one Claude
  call each, from CI, committed as `data/editions` and baked into the build.
  Facts stay live; prose is published. `markPreview` counts last week's calls,
  because a pundit nobody marks never has to be right.
- **Draft pedigree**, in the brief only. `getDraftResults` had been captured
  since 6 Aug and never read.

**Craig's items:** set `ANTHROPIC_API_KEY` as a repository secret (it never
touches Vercel — the app only ever reads a committed column), and sign off the
bylines in `scripts/edition/voice.ts`.

## 10. 31 Aug — the paper started rolling

Craig: *"it's live, like a website"*. The plan is
`planning-for-gazetta-features-quiet-lovelace.md`. Prose stopped being one
column a round and became a stack of stories that accumulates.

- **The rolling model.** `PublishedStory` (sixteen kinds) in
  `data/editions/paper.json`, ordered by one `composePaper` both writer and app
  consume — expiry, then supersession as a data table, then period over kind
  over recency. A ledger carries covered-keys (idempotence) and threads that
  WEAR OUT, so a 38-week season cannot run one joke for twenty weeks.
- **The newsdesk decides.** `newsdesk()` turns what is new since the last
  filing into an argued running order; the crons are only when the desk LOOKS.
  Match reports ranked by draft stakes, ties called mid-round, tonight's
  preview when an open tie has men on both sides.
- **The banter set landed**: predictions (marked the week after), the eleven's
  captions, power rankings, the Points Dodgers, The Bin with obituaries and a
  quiz, and two sketches — the paper's only licensed invented quotes, both of
  which say out loud that they are sketches.
- **The news wire**: a 40-line RSS reader, no XML dependency, keyed on the
  article URL because the BBC's guid double-covers. Filed as squad news for
  the manager it hits, never as a club story.
- **Journalism leads at all times.** The old *As it stands* splash became a
  scoreboard strip with your own tie promoted to *The Pink*'s scoreline banner
  while a ball is in the air. The front page prints ONE article and headlines
  the rest, each opening in place.
- **Three tables**, in the sidebar as a back page carries them: the draft
  table (Fantrax verbatim), the Premier League (computed — FPL's own table is
  a dead field, 0 of 20 populated) and the season's scorers (Fantrax's
  published FPts, three of the top ten unowned).
- **The splash drawing**, fail-soft: an editorial cartoon printed through
  `.paper-photo` so it cannot introduce a third colour.

**Reverted the same day:** inside pages under `/paper`. The Gazetta is one
section of six, not a site inside the site — a second paper route needs a
folio and a contents strip, which means printing the desk's own navigation in
newsprint.

**And un-reverted on 2 Sep 2026** (Craig), once the paper had columns to put
on them: the writer filed its first stories that afternoon, and a front page
cannot print two whole columns while a headline that opens in place is one
nobody can link to. `/paper/{slug}` and `/paper/reports` ship with a numbered
folio and a 200ms page turn. The revert's complaints are answered rather than
dropped — the desk's six names still print once, in `Index`; the paper's own
strip carries only the paper's pages; and an inside page leads with THE
GAZETTA, never with a section name.

**And cut on 30 Sep 2026** (Craig: *"the pages thing doesnt work"*): the page
strip, every page number and "turn to page", and `/paper/reports` and
`/paper/columns`. An article is `/paper/{slug}`, one tap from its headline.

**Craig's items:** `OPENAI_API_KEY` as a repository secret (optional — without
it every edition files exactly as it does now, with a typographic band instead
of a drawing); sign off the persona copy in `scripts/edition/voice/bylines.ts`
and `personas.ts` (the studio pair, the press-room traits, the edition names);
fill `data/derbies.json` if derbies are wanted; and decide the §2b layout
items still parked — unequal column widths and the tables side by side.

## Explicitly parked

`apps/lab` · FPL authenticated endpoints · member-held cookies in any form ·
scoring engine (dead — Fantrax's numbers are public and authoritative). Custom
competitions beyond the two cups, which are on screen with a placeholder draw (27 Sep).

## Verification

- Four green before every commit: `npm test`, `npm run typecheck`,
  `npm run lint`, `npm run build`.
- Standing acceptance test: every changed page renders against **both** league
  ids (roster limits 15/11/5 vs 14/11/3 is the hardcoding canary).
- UI changes: walk the changed routes in `npm run dev` on a phone-width
  viewport; grep page source for anything a `"use client"` boundary serialises
  that the screen withholds (the lineup-leak lesson).
- Probes: results recorded in PLATFORM_NOTES in the same session, dated.
