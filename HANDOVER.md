# What's needed — 27 Aug 2026, between gameweek 1 and gameweek 2

Replaces the 22 Aug handover. State: `main`, **pushed**, working tree clean but
for `probe3.mjs`. 534 tests · typecheck · lint · build, green on every commit.

Gameweek 1 is done. Gameweek 2 kicks off **28 Aug 19:00Z** behind a 17:30Z FPL
deadline; our lock is **18:45Z**. Fantrax period 2 opens at the first kickoff.

Eight commits today, six of them fixes to things that were only visible in the
**between-rounds** state — the four days the app sits in every week, which nobody
had ever looked at. Full account in PLATFORM_NOTES, 27 Aug.

---

## 1. The thing that was not a code bug and outranked every code bug

**`main` and `origin/main` had diverged, and production was serving 19 Aug code.**
Local held 79 unpushed commits on `3a9c56f`; origin held the same base plus eight
daily capture commits from the CI bot. Vercel builds origin, so every fix the
first matchday taught was undeployed and gameweek 2 would have kicked off on it.

Three things worth carrying forward:

- **Rebase, never merge.** `vercel.json` reads `git diff HEAD^ HEAD`, and a merge
  commit's first parent is our own tip — so the diff Vercel evaluates would have
  been the eight captures and nothing else, skipping the build and leaving 79
  commits undeployed a second time. Same trap the 22 Aug handover recorded as
  "never let a capture be the last commit in a push", wearing a different hat.
- **`--force` would have destroyed eight days of history** that `capture.yml`
  says cannot be recreated.
- **`capture:status` said OVERDUE and the cron was innocent.** It reads the
  working tree and cannot tell "captures stopped" from "you have not pulled".
  Do not react to it by running `npm run capture` before pulling.

One conflict: both sides captured 22 Aug. Thirteen of seventeen files identical;
the manual 11:07Z run was dropped for the CI's 05:18Z one, because the 23 Aug
capture records the waiver flip anyway and the CI series is unbroken. It survives
on `backup/pre-rebase-2026-08-27`.

## 2. What is fixed and deployed

- **The two calendars had drifted and every ordinary squad read crossed them.**
  Fantrax was serving period 2 while FPL pointed at gameweek 1, so the desk read
  "Gameweek 1 · head-to-head" over `0 – 0`, and `/squad` printed "Period 2 ·
  Gameweek 1" — the page reporting its own mismatch to anyone who read the line.
  The period now comes from the round in view. `periodAsAsked` also stopped being
  true-by-construction on the read nearly everyone makes.
- **The eleven adds up to the header, and "This period" means it.**
  `getTeamRosterInfo`'s period is inert for points; `getLiveScoringStats` honours
  it and is the only per-player number priced at the ROSTER SLOT. test3 now reads
  45 over an eleven of 45, and Saka reads 8 where the season table pays him 6.
  Costs no request and deletes three `getTeamRosterInfo` POSTs per window.
- **The playoff line is the league's own.** `numPlayoffTeams: 4` was on the wire
  all along and `raw.ts` did not mirror it, so the table drew the placeholder's
  invented top two.
- **`/matchday` can name the round coming up.** It was printing "The next one
  appears here once FPL names its fixtures" for four days, with both buttons
  pointing at the round just played. The schedule had the same root and opened on
  last week.
- Two links that asked the URL a question about the round: `Season.tsx` dropped
  `?gw=` (the sibling view was fixed on 22 Aug and this one was missed), and the
  provenance line vanished whenever there was no query string.

## 3. OPEN, dated, and the most serious thing found today

**The lineup gate is anchored on the roster-period boundary; the rule it enforces
is about the lock.** `gazette/deadline.ts` already made this correction for the
*displayed* deadline — "it is not fifteen minutes before the period boundary, and
this file used to compute it that way" — and `visibility.ts` never got it.

**33 of 38 roster periods open at 10:00Z on the Friday**, for a Saturday lock.

| | opens | first kickoff | our lock | open early by |
|---|---|---|---|---|
| Period 4 | Fri 11 Sep 10:00Z | Sat 12 Sep 14:00Z | 13:45Z | **27 h 45 m** |
| Period 6 — the league's first | Fri 9 Oct 10:00Z | Sat 10 Oct 11:30Z | 11:15Z | **25 h 15 m** |

It has not bitten yet **by accident**: periods 1, 2 and 3 are three of the five
that open at 19:00Z, after the lock. So **gameweek 2 is safe**, period 4 is the
first that is not, and period 6 is the day before this goes to sixteen people.

Reached without any assumption about Fantrax's rollover: a tap on a gameweek-4
row in the schedule asks for period 4, gets it echoed, and opens the gate.

**Honest bound:** a leak only if `getTeamRosters` serves the live editable
arrangement rather than a locked one. §4's first probe settles that.

**Fix, two commits:** move `locksAt`/`firstKickoff` from `gazette/deadline.ts`
into `league/calendar.ts` (three consumers, so the move is earned), then gate
`rosterDisplay` on `locksAt(firstKickoff(period, kickoffs))`. Before 11 Sep.

## 4. Two observations that expire

- **`getTeamRosters?period=1` after 28 Aug 18:59:58Z**, once period 1 has closed.
  Does it serve the locked arrangement or always the live one? Half-answered —
  periods 1/2/3 are byte-identical *while period 1 is still open*, which is
  suggestive, not decisive. A clean experiment for about a day, and it sets the
  severity of §3.
- **The flip-order sample, Mon 31 Aug ~21:00Z.** Whether the `bonus-settling`
  rung is reachable needed `/api/event-status/`, `/api/fixtures/?event=N` and
  bootstrap `data_checked` sampled together from Mon 24 Aug. Nobody was watching,
  and by today all four GW1 dates read `bonus_added: true` with the round
  `data_checked` — that answer is gone. This is the second chance.

Also still open from before: the clean-sheet divergence needs a defender subbed
off before his side concedes.

## 5. Still Craig's

- The **`adminMode` probe** still needs a second Fantrax account holding one
  rehearsal team. Everything downstream of the write surface waits on it.
- `data/mappings/review/proposals.json` still holds `Fred Heath`,
  `Enzo Kana Biyik`, `Lucas Pitt`. Only a person may write `unmappedBy: "manual"`.
- **Rename the league in Fantrax** — `getLeagueInfo.leagueName` is still
  "Tim Hortons Pro League 24/25" and the schedule prints it verbatim.
- `LINEUP_LOCK_LEAD_MINUTES = 15` is a commissioner setting no API exposes, and
  sixteen people will act on the 18:45Z it produces tomorrow. Worth one look at
  the settings page.
- The **cup** stays a placeholder. Only the playoff half became real, because
  only the playoff half is published.
- `probe3.mjs` is still untracked in the root and still yours to delete.

## 6. The ship-day gates, and the bug the first one caught

**`verify.yml`'s two-league walk had never run.** It was written on 20 Aug into a
branch nobody pushed, so its first ever execution was tonight — and it went red.
Four defects had to be cleared before it could even say why:

- it could not name WHICH wrong state it found (an outage and a league with teams
  in it produced the same complaint and want opposite fixes);
- it never checked the server served the league it was asserting about;
- `set -e` meant the first walk's failure skipped the second entirely, so the
  rehearsal half — the one its own comment says has caught a real bug — had still
  never run;
- `next start` renames its process to `next-server (v16.2.7)`, so
  `pkill -f "next start"` matched **nothing**. The server outlived the walk, the
  next `next start` died with EADDRINUSE, `smoke:wait` was answered by the OLD
  server, and the second walk reported "10/10 clean" having asked the first
  walk's app about the second walk's league. Reproduced locally.

**And then the walk earned its keep.** The real-league red was not the empty
states: six routes were **prerendered static at build time against the default
league** and served that way whatever the running server was set to.
`myTeamId` checked `SESSION_SECRET` and returned *before* reading the cookie, and
that `cookies()` call is what makes the render request-dependent. CI has no
`.env.local`, so it had no secret, so `/`, `/league`, `/league/matchups`,
`/squad`, `/matchday` and `/matchday/desk` built static against the rehearsal
league. `/league/schedule` has no session read and stayed dynamic and correct —
which is why the schedule printed "Tim Hortons Pro League 24/25" over a table
reading `test3 1-0-0 45`. Half the app served one league, half the other, every
page returned 200.

This is precisely what `leagueCache` exists to prevent, through a door it cannot
watch: a static page never reaches the cache, so putting the league id in every
key cannot help. **On 10 Oct the swap is one environment variable and a redeploy.
A build that had lost `SESSION_SECRET` would have shipped the rehearsal league to
sixteen people, silently.**

Fixed, and `secret()` with it — it used `??`, so `SESSION_SECRET=""` counted as a
real key and every team code would have verified against an HMAC keyed on
nothing. Verified by building with `.env.local` removed, which is CI's actual
condition: every league route now reads `ƒ` dynamic where six read `○` static.

**Verify is green for the first time since 19 Aug**, and the two-league walk has
now completed both halves once: real 10/10, rehearsal 12/12.

### Still in that pile, untouched

`shape-diff` exits 1 today so the documented `&&` chain never reaches
`bridge:check`, and exits 0 when the subject refused every read; `smoke`'s desk
fragment is printed by all three states it exists to keep apart; `smoke` drops
its two id-scoped routes when the second roster read fails and still reports
"12/12"; `staleness.ts` cannot fire on the first missed capture; `team-codes`
cannot read `SESSION_SECRET` and prints a remedy that does not work.

Two of the pile were fixed on 23 Aug (`capture-status` counting directories,
`build-bridge` rebuilding from nothing) and are already in.

**One lesson worth keeping separate from the bug.** Every hypothesis I could form
from outside CI was wrong — wrong league, cold-start race, missing session env,
provider refusal, cache contamination — and none of them reproduced locally. What
ended it was making the gate print the first words the page actually rendered.
A gate that says an assertion failed and cannot say what it saw sends somebody to
reproduce a thing that only happens in CI.

Also unchanged: the bridge was last built 19 Aug against the 19 Aug pool.
`bridge:check` stays green because it only gates on *rostered* players, which is
a smaller question than it looks.

## 7. Before every commit, still

```bash
npm test && npm run typecheck && npm run lint && npm run build
npm run smoke && npm run shape-diff && npm run bridge:check
```

**Pushing is deploying.** `main` → Vercel production, no gate. And never let a
capture be the last commit in a push — nor a merge commit, for the same reason.
