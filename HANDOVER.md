# What's needed — 22 Aug 2026, written during GW1

Replaces the 20 Aug handover. State: `main`, 74 commits ahead of `7944cf8`,
working tree clean but for `probe3.mjs`. 506 tests · typecheck · lint · build ·
smoke, green on every commit. **Nothing pushed.**

Thirty-seven commits today, all made while football was actually on. The 20 Aug handover
said the whole live tranche was "written and unwitnessed"; it has now been
witnessed, and seven of the things it was hiding were bugs.

---

## 1. What the first real matchday broke, and what fixed it

The first three were invisible until 19:00 on Friday and would have been invisible
again by Tuesday. None of them could have been found by a test.

### Every player read as "played" from the round's first whistle (`35cda17`)

`contribution.played` was `stats.length > 0`. That is right for the whole of
pre-season, because FPL answers `{"elements": []}` until a round starts — and
wrong from the first whistle, because after it FPL emits a row for **all 600
players in the league**, 569 of them on nought minutes, including men whose
fixture is three days away.

Four views branch on that flag to choose between printing a man's fixture and
printing his score. All four took the score branch for all fifteen: `/squad` and
the head-to-head board carried **no fixture chip and no kickoff time anywhere on
the page**, the photograph stopped being drawn back, and the live card offered a
breakdown for players who had not kicked off.

`kickedOff(opposition)` now asks the fixtures, in the football layer, and
`played` is gone rather than redefined. Rendered proof, mid-GW1: Haaland reads
`BOU (H)`, Bruno Guimarães — named in an eleven, never came on — reads `0`, and
Gabriel reads `CS YC 5`. Three states that were one.

Same root cause, one more place: `cleanSheet` was `every` over all rows, so on a
double gameweek a not-yet-played row took Saturday's clean sheet off a defender.

### The front page burned a live dot for three days (`1029cea`)

`edition.live` used `duringGameweek` — first kickoff to last whistle, overnight
included — to drive "Football is on. The scores are moving." and a pulsing bar.
GW1 runs Friday 20:00 to Monday ~21:50 with about twelve hours fifty of football
in it, so it was false for roughly **sixty-one of those seventy-four hours**. It
now uses `isMatchdayLive`, which four places in the tree already said was the
question. Verified in both states today: silent at 11:47 with nothing in play,
and correctly loud at 15:40 with three matches at 40 minutes.

### "Deadline" meant FPL's deadline (`bbdeb6c`)

`GameweekView` printed FPL's `deadline_time` under the bare word "Deadline" on
`/matchday` and every `/gw/N`. Ours is the commissioner's, fifteen minutes before
the first kickoff, not ninety. For GW1: 18:30 against 19:45, same word, same
round, and the front page saying one while the Live tab said the other.
`docs/ui/gameweek.md` already specified "FPL's deadline" — the component had
drifted from its own spec. Named, not replaced: football may not import league.

### And two of ordering (`dd74e44`, `0ae6e19`)

The afternoon strip and both whole-round fixture lists printed the hour and not
the day, for a round that runs Friday to Monday. `/gw/1` showed `17:30` above
`14:00`; `/gw/2` prints `20:00` on its first row and its last, three days apart.
Sorted correctly, reads as scrambled. The day now sits in the small line that
carries `FT` and the live minute and is empty for exactly the fixtures needing it.

---

## 1b. Craig's list, worked through the same evening

**The correction first.** I had written that Saka "is listed F". That is the trap
rather than the fact: `F` is what `getPlayerIds` prints, and that endpoint gives
one letter per man because it describes the global pool. The league's own answer
is `eligiblePos: "F,M"` — he is both — and **the position that decides his points
is the one his manager chose**. 48 of 607 players are dual-eligible, so this is
the normal case for the men who matter. Corrected in three files.

| Asked | Done |
|---|---|
| FPL tab needs the pitch | `FplPick.line` carries FPL's `element_type`, read in FPL's own layer because the football layer refuses to know a fantasy classification. `fplLineup` arranges it, pure and tested. |
| Pitch rows all one size, font too, truncate | Cards were `flex-1` under a max, so a back five drew narrower than a front two; the basis now comes from the fullest line. The name stepped down in three bands by length — one size now, truncating. |
| Schedule → week 2 → tap a team → full squad | Every row led to `/squad/{team}` with no gameweek, so a March fixture opened this week's fifteen. It carries `?gw=` now, resolved through the calendar seam. |
| Table points should be FP | It was headed "Points", which in a table means the standings. It is Fantrax points scored. |
| A playoff line | `playoffPlaces` reads the cut off the declared bracket, so the placeholder's final between 1 and 2 draws it under second and a top-four playoff moves it without a second edit. |
| Team logos on matchups, table, schedule | The schedule had the read privately; `app/badges.ts` owns it now and all four surfaces share one cache entry. |
| No initials under a thumbnail that has an icon | They sat under the photograph as a fallback, which works for a rectangle and not for a cut-out on transparency — a man's initials showed through his own shirt on every row of the pool. |
| No name under the player card's thumbnail | It drew a whole `PitchPlayer` beside the heading, so the card printed his name twice and his total twice. |
| Players tab: scroll across, more stats, more page | The read sends seven columns and the page drew four. It draws all seven now — his fixture, and the two ownership columns that are the only outside opinion in the app — and breaks out of the gutter to scroll rather than hiding the rank on a phone. |
| GK DEF MID FWD | Seven render sites, one `app/positions.ts`. Unknown letters still print verbatim. |

**Probed rather than assumed:** the recorded note said the pool's football columns
live "behind `scoringCategoryType`". They do not — Tracked, Standard and Extra all
answer the same seven, and `statisticsViewTypeId` in three spellings changes
nothing. Seven is what that endpoint has.

**Three more live-view bugs**, from a second adversarial hunt: the league table
never refreshed at all while showing a live total; the schedule stopped refreshing
the moment nothing was in play and never restarted; and "bonus settling" named
FPL's bonus ladder beside a Fantrax total, in a league with no bonus category —
checked against both leagues, not assumed. A team of the week picked from four
fixtures of ten now says "so far", because it was not merely leaving men out but
admitting the wrong ones.

**Two more from the same hunt, both mirror images of the morning's bug.** `/gw/1`
served a 68-minute-old snapshot under a LIVE badge — "BRE 2-0 Live 45'" while
/matchday said "BRE 3-0 FT" in the same second — because `gameweekSnapshot` is
reached from that one route, nothing warms it, and `unstable_cache` serves stale
while it revalidates. The current round comes from `footballNow` now. And
`GameweekView` was the only `AutoRefresh` in the app not calling `pollSeconds`:
it derived its interval from `isMatchdayLive`, so the Live tab dropped to 300s in
every gap between kickoffs while the desk and three boards beside it stayed at 30.
This morning's bug asked the wide question for a live dot; these asked the narrow
one for a poll rate.

**Two findings left on the table, deliberately.** `PairingCard` withholds
"all played" between kickoffs because it gates on `isMatchdayLive` — the doctrine
says `duringGameweek`, but there is a comment there choosing the narrow question
on purpose, and the harm is a withheld caption rather than a false one. And the
pitch prints a Fantrax number without saying whether it is a season or a
projection, which the list and the player card both label; not wrong today,
because the pool is answering year-to-date, and it threads through three pitches.

**Refactor, both passes.** `h-[1.15rem]` in four places and `w-[5.5rem]` in four
became variables on the `--pitch-boards` precedent; `roundFinished` left the
barrel because it is half an answer and publishing it beside `roundState` was
publishing the trap; two type imports left behind by the `round.ts` split are
gone. Checked clean: no league id or provider URL outside `config.ts`, no file
over the 300-line ceiling, no unused import anywhere in the tree.

---

## 2. What was witnessed — PLATFORM_NOTES, 22 Aug

Long section there; the headlines, all previously open questions in this repo:

- **`remainingEventPercent` reaches literal 0**, and is fractional in play
  (0.556 → 0.533 → 0.522, ticking down minute by minute).
- **Fantrax's totals move during a match**, not only at the whistle — watched one
  team go 2 → 7 while a match ran. The 13 Aug note called this "an expectation,
  not an observation". It is an observation.
- **`playerGameInfo` is decoded**, `[1]` included, verified against the count of
  `gameStatusMap` entries in state 2. `[0]+[1]+[2]` falls short of eleven by
  exactly the number of men whose match ended without them.
- **`getPlayerStats` flipped** to `SEASON_926_YEAR_TO_DATE`. The data-flow change
  §3 of the roadmap was hedging against is **not needed**.
- **FPL publishes provisional bonus long before it is confirmed.** `/api/event-status/`
  still says `bonus_added: false` fourteen hours after a whistle. Agreement with
  the BPS order is *not* evidence a bonus is final — provisional bonus is by
  construction the current BPS order. I got this wrong first time round and an
  adversarial check caught it; the repo's three-rung ladder and both its comments
  were right all along.
- A clean sheet settled at Fantrax's **+4** for a defender who played 90 — the
  number our preview would have shown. The divergence case (subbed off before his
  side concedes) still needs a substitution in front of us.

---

## 3. Still Craig's, and the first one is now bigger than it looked

### Fantrax scores the ROSTER SLOT; three of their stat tables do not

Their live/matchup/standings engine prices a man at the slot his owner has him
in. `getPlayerStats`, `getTeamRosterInfo` and `getPlayerProfile` price him at his
`defaultPosId`. Saka **is a midfielder and a forward** — the league's own
`eligiblePos` is `"F,M"` — and his manager has chosen M: the engine pays him **8**,
the tables pay him **6**. There is no single right position for him, which is the
point; the only answer that means anything is the one his manager made.

**The head-to-head board therefore disagrees with itself on screen** —
`/league/matchups/j9zadacnmshcpazf` shows a header of **16** over an eleven that
sums to **14** — and `/squad` prints `Saka G CS 6`, the FPL chips claiming a
clean sheet the Fantrax number beside them prices at zero.

It is systematic, not an edge case: 48 of 607 pool players are multi-eligible,
and because the deeper slot pays strictly more (goals D6/M5/F4, clean sheets
D4/M1/F0) an optimal lineup **always** files them off their default. All seven of
today's off-slot cases are the same shape. On 240 slots from 10 Oct it is routine.

**Not fixed, deliberately.** The fix is cheap and already in the payload the board
fetches — `statsMap[id].object1` and `.object2`, slot-priced, which would also
delete two `getTeamRosterInfo` calls per board. But it changes what four screens
show, it turns an unplayed nought into a dash, and `statsMap` has been non-empty
for one day. Full sizing in PLATFORM_NOTES.

### The three from the last handover, unchanged

The `adminMode` probe still needs **a second Fantrax account holding one
rehearsal team** — everything downstream of the write surface waits on it. The
**playoff** is still published data against a placeholder in
`league/competitions.ts`. `data/mappings/review/proposals.json` still holds
`Fred Heath`, `Enzo Kana Biyik`, `Lucas Pitt`, and only a person may write
`unmappedBy: "manual"`. **Rename the league in Fantrax** — still "24/25".

### The Vercel lever has a hole, found by actually making a data commit

`vercel.json` skips a build when `git diff HEAD^ HEAD` touches nothing outside
`data/snapshots`. That reads **only the tip commit**. Push `[code, data]` in that
order and Vercel evaluates the data commit alone, skips the build, and leaves the
code change undeployed until something else is pushed. Today's push is safe —
`3b81f5f` is a pure data commit but is not the tip. **Rule of thumb until it is
fixed: never let a capture be the last commit in a push.**

---

## 4. The audit, and what is left of it

Five finders over the live paths, every finding then handed to a separate agent
whose job was to refute it. **Twenty-five findings, nine refuted** — including one
of mine, the "bonus settling" rung, which is honest and which I had called a bug
on evidence that meant the opposite.

Six of the sixteen survivors are fixed above. What is left, worth most first:

- **`getTeamRosterInfo`'s `period` moves the opponent column and not the points.**
  Asked for periods 1, 2 and 3 the reply is **byte-identical** — Ødegaard 8, Saka
  6, every category line the same. `SEASON_926_BY_PERIOD` behaves the same way. So
  the head-to-head board shows season-to-date under a card headed "This period",
  and `client.ts:186`'s comment claiming the period is honoured is wrong. Invisible
  this week because the season is one gameweek old; wrong from GW2, and wrong on
  every archived week the schedule links to. **This is the one I would take next.**
- **Team of the week ran from one played fixture of ten** and called itself the
  week's eleven. At 11:45 it was five men from a single match; it reads a full
  `1-3-5-2` now a proper round is running. So the section is right once a Saturday
  is going, and the question is what it should say at Friday midnight — a product
  call, not a defect. (The formation label itself was challenged and **refuted**:
  the collapsed form is deliberate and `teamOfTheWeek.test.ts` asserts `"1-2-3"`
  for a selection with no midfielders.)
- **Double gameweeks lose non-scoring stats.** `statsFor`'s `: 0` branch fires for
  any identifier FPL left out of `explain` because it scored nothing — a keeper's
  saves, a defender's goals conceded. Confirmed, severity marked down: there is no
  double in GW1, so nothing is wrong on screen yet.
- **The next deadline can be three weeks away and is printed as a bare weekday.**
- **The desk swallows the scoreboard refusal** that both sibling boards print, and
  calls an unreadable league "no pairings".
- Smallest: `"a quarter of an hour"` hardcodes `LINEUP_LOCK_LEAD_MINUTES` in prose;
  four `PlayerMatchStats` fields have no consumer anywhere.

**Refuted, recorded so nobody re-opens them.** The "bonus settling" rung is
honest. `fixturesInOrder`'s string sort is not the house-rule violation it looks
like. The formation label is a tested convention. The Doubts ordering cannot
mislead, because this league locks a whole period at once and mid-round there is
nothing to act on. `"N to play"` counting a man on the pitch is a reading of the
phrase, not a defect. And **"left him on the bench" is not a lineup-gate leak**:
it names at most eleven men who must all have played, and period 1 opens at
exactly the first kickoff, so anyone with minutes has an open period.

One thing worth keeping out of that last refutation. PLATFORM_NOTES' "the lineup
gate held" audit on 20 Aug grepped the rendered source for the tokens `ACTIVE`
and `RESERVE`. That cannot by construction catch an English sentence, and "left
him on the bench" is one. The conclusion stands; the method would not have caught
it if it had not.

**And one honest note about the audit itself:** it verified at most six findings
per lens, and the live-surfaces lens raised seven. The dropped one was real — the
`toPlay` truthiness bug fixed above, which I caught by reading the two files side
by side rather than because the harness told me to.

---

## 4b. The ship-day gates, audited — and this is the pile I did not clear

A whole-repo hunt closed the day. Most of what it found in the app is fixed
above; what it found in `scripts/**` is a coherent body of work of its own and is
recorded rather than half-done. **These are the checks the 10 Oct runbook rests
on, so they are worth a session.**

- **`npm run shape-diff` exits 1 today, and the documented chain is `&&`.** So
  `npm run smoke && npm run shape-diff && npm run bridge:check` never reaches the
  third. The script's own comment states the intent — "a gate that reddened on
  [an undrafted league] would be switched off long before it mattered" — and it
  is reddening on exactly that: 22 paths counted dangerous, all of them
  downstream of the real league having no teams. `diffShapes` already separates
  `emptied` from `missing`, but a container that is *absent* rather than empty
  (`table.header.cells[]`) cannot be attributed and lands in the dangerous count.
- **`shape-diff` exits 0 when the subject refused every read** — refusals are
  counted and reported but never redden, so a run that compared nothing passes.
  The inverse of the above and worse: on ship day it is green having checked
  nothing.
- **`capture-status` cannot tell a capture that recorded nothing from a healthy
  one.** It reads the directory's date, not its contents.
- **`build-bridge` rebuilds from scratch when the mapping is missing**, which
  overwrites `review/proposals.json` — the file holding your three pending
  decisions. The gate that protects it is a person remembering not to run it.
- **`verify.yml`'s two-league walk and `bridge:check` gates have never executed
  in CI**, so the thing that would catch all of this has not run.
- Smaller: `staleness.ts` cannot fire on the first missed capture, contradicting
  the cadence `capture-status.yml` claims; `smoke`'s desk fragment is printed by
  all three states it exists to keep apart; `smoke` never checks the server it is
  walking serves the league it derived its expectations from; `smoke` drops its
  two id-scoped routes when the second roster read fails and still reports
  "12/12"; `team-codes` cannot read `SESSION_SECRET` and prints a remedy that
  does not work; `pkill -f "next start"` cannot match the process it targets.

**Fixed already, because it was one line and it lies in CI:** `bridge:check`
printed "every player anybody holds resolves to a footballer" after checking
zero. Both leagues answer `NO_TEAMS` every day until 10 Oct, so on the morning of
the draft that gate reported all-clear having looked at nobody.

One caveat on the audit itself: it ran while I was fixing, so at least one
finding was refuted because its evidence had already been repaired underneath it
— the `?q=a&q=b` 500. Treat a refutation dated later than a fix with suspicion.

## 5. Unchanged from 20 Aug

`probe3.mjs` is still untracked in the root and still yours to delete —
untouched. `npm run bridge` still **not** re-run: the gate says the mapping
covers everyone rostered, and a regeneration would rewrite the file holding your
three pending decisions. `scratchpad/preview/` is gone, which is what its own
README asked for once real football arrived.

`npm run capture` was three days overdue against a one-day limit and has been
run — today's is the first snapshot of either league with a Premier League result
in it, and that history cannot be backfilled.

---

## 6. Before every commit, still

```bash
npm test && npm run typecheck && npm run lint && npm run build
npm run smoke && npm run shape-diff && npm run bridge:check
```

**Pushing is deploying.** `main` → Vercel production, no gate. Nothing here has
been pushed.
