# What's needed — 22 Aug 2026, written during GW1

Replaces the 20 Aug handover. State: `main`, 47 commits ahead of `7944cf8`,
working tree clean but for `probe3.mjs`. 488 tests · typecheck · lint · build ·
smoke, green on every commit. **Nothing pushed.**

Ten commits today, all made while football was actually on. The 20 Aug handover
said the whole live tranche was "written and unwitnessed"; it has now been
witnessed, and three of the things it was hiding were bugs.

---

## 1. What the first real matchday broke, and what fixed it

All three were invisible until 19:00 on Friday and would have been invisible
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
`defaultPosId`. Saka is listed F and slotted M: the engine pays him **8**, the
tables pay him **6**.

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

## 4. Found by an adversarial audit, evidenced, and not taken

Five parallel finders over the live paths, each finding then re-derived by a
separate agent whose job was to refute it. **Nine of twenty-two claims died that
way, including one of mine** — the "bonus settling" rung, which is honest, and
which I had called a bug on evidence that turned out to mean the opposite. What
survived, worth most first:

- **`getTeamRosterInfo`'s `period` scopes the fixture column but not the
  points.** The head-to-head board asks for a named week and gets season-to-date.
  The verifier went further than the finder: asked for periods 1, 2 and 3, the
  reply is **byte-identical** — Ødegaard 8, Saka 6, every category line the same,
  only the opponent cell moving. `SEASON_926_BY_PERIOD` behaves the same way.
  Invisible this week because the season is one gameweek old; wrong from GW2, and
  wrong on every archived week the schedule links to.
- **Double gameweeks lose non-scoring stats.** `statsFor`'s `: 0` branch fires for
  any identifier FPL left out of `explain` because it scored nothing — a keeper's
  saves, a defender's goals conceded. `explain` carries only what scored. Confirmed
  with the severity marked down: there is no double gameweek in GW1, so nothing is
  wrong on screen yet.
- **Team of the week ran from one played fixture of ten** and called itself the
  week's eleven. At 11:45 it was five men, all from the same match. It reads a
  full `1-3-5-2` now that a proper round is under way, so the section is right
  once a Saturday is going — the question is what it should say at Friday
  midnight, and that is a product call rather than a defect.
- Smaller and unverified either way: a drop with no claim renders as an orphan
  bullet labelled a claim; the Doubts row key collides when one manager holds two
  players sharing an FPL `web_name`; "a quarter of an hour" hardcodes
  `LINEUP_LOCK_LEAD_MINUTES` in prose.

**Refuted, recorded so nobody re-opens them.** The "bonus settling" rung is
honest and could not even have been on screen today. `fixturesInOrder`'s string
sort is not the house-rule violation it looks like. The team-of-the-week
**formation label is a deliberate, tested convention** — `teamOfTheWeek.test.ts`
asserts `"1-2-3"` for a selection with no midfielders, so the collapsed form was
looked at squarely and chosen. The Doubts ordering cannot mislead anyone, because
this league locks a whole period at once and mid-round there is nothing to act
on. And **"left him on the bench" is not a lineup-gate leak**: it names at most
eleven men who topped a ranking, all of whom must have played, and period 1 opens
at exactly the first kickoff — so anyone with minutes has an open period.

One thing worth keeping out of that refutation, though. PLATFORM_NOTES' "the
lineup gate held" audit on 20 Aug grepped the rendered source for the tokens
`ACTIVE` and `RESERVE`. That cannot by construction catch an English sentence, and
"left him on the bench" is one. The conclusion stands; the method would not have
caught it if it had not.

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
