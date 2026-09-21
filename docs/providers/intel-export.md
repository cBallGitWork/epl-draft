# The intel export — the contract between the two repos

`~/ai-carling-premiership` writes into `epl-draft-1/data/intel/`. Nothing in this
repo can make that data fresher; `npm run intel-check` exists only to say how old
it is. **This file is the contract**, written here so the sister-repo session has
something to build against rather than a conversation to reconstruct.

Four files exist today. This adds four more, in the order they should land.
Everything below is downstream of one rule:

> **Key on FPL's season-stable `code`. Never `element`, never `person_id`.**
> `element` is recycled every August and `person_season_id` is meaningless in
> this repo. CODE_RULES §3 forbids persisting either. The four existing files
> already do this and the join is `person_season_id → element → code` through
> `identity/bridges.py`'s `element_map(season)` plus bootstrap.

## What is already there

| File | Rows | Grain |
|---|---|---|
| `squads/26-27.json` | 651 players | one per code: real position, line, depth tier, shirt number, status |
| `matches/26-27.json` | 20 fixtures | per `fplFixtureId`: both sides' figures, every player's minutes/position/rating, goals and cards with minutes |
| `xi/gw3.json` | 20 clubs | the predicted eleven, **per round, round in the filename** |
| `set-pieces/26-27.json` | 20 clubs | takers and shares, club-scoped |
| `touches/26-27.json` | 367 players | every touch, per player per fixture, as a raw point cloud |

Types are in `packages/core/src/football/intel/types.ts`; readers in
`intel/map.ts` and `intel/matches.ts`. Every file carries the same `manifest`:
`{season, gameweek, exportedAt, rows, sources: [{path, mtime}], numberCollisions?}`.
`exportedAt` is when the export ran and each source's own `mtime` rides along,
because "the export is fresh" and "what it was built from is fresh" are different
claims and only the second catches a stalled pipeline.

## The shape rule, learned the hard way

**One accumulating `26-27.json` per kind. Never `gw{N}.json`.**

The XI is per-round and names its round in its filename, which means a static
import chooses the round at BUILD time while the heading above it is chosen at
REQUEST time. With `gw3.json` still on disk, a build made after the round turned
served last week's eleven under this week's opponent — eleven real names, a real
formation, and the wrong match. `xiRoundFault` is the check that was missing.

None of the four files below is per-round, so none of them may repeat that shape.
A horizon has no single round to name.

---

## 1. `eye-test/26-27.json` — first, and the cheapest

One row per code, no match join at all. It is what a player COMPARISON needs, and
comparison is otherwise limited to FPL's own counts.

```jsonc
{
  "manifest": { /* as above */ },
  "players": [
    {
      "code": 118748,               // FPL season-stable code
      "profileSeason": "26-27",     // REQUIRED — see below
      "plMatches": 3,
      "plMinutes": 251,
      "eyeTestScore": 7.4,
      "xgPer90": 0.41, "xaPer90": 0.22, "keyPassPer90": 1.8,
      "passAccuracyPct": 87.2, "oppHalfPassAccuracyPct": 79.1,
      "longBallAccuracyPct": 61.0,
      "duelWinRate": 0.52, "tackleWinRate": 0.61,
      "progressiveCarryDistPer90": 84.0, "carryDistPer90": 210.0,
      "dribblesPer90": 2.1, "touchesOppBoxPer90": 4.4,
      "chancesCreatedPer90": 1.9, "bigChancesCreated": 3,
      "passesFinalThirdPer90": 7.2
    }
  ]
}
```

**`profileSeason` is not optional.** The sister repo's own loaders warn that this
profile carries forward from last season when the current one is thin. A figure
from 25-26 printed under a 26-27 heading is the confident wrong answer this app
refuses, so the season travels with the row and the screen labels it.

Source: `data/staging/sofascore/eye_test_features.parquet`, joined
`ss_player_id → provider_to_root("sofascore") → root fpl_code`.
**Cap: 200 KB.** Roughly 651 rows × 22 numbers.

## 2. `events/26-27.json` — the maps

One row per ACTION, not per shot. `docs/ui/match.md` already names the absence as
the Action Zones gap, so the screen has a written home before the file exists.

**Widened from shots on 6 Sep 2026** (Craig, on the comparison pitch: *"filter
for the different stats (shots/recoveries etc)"*). A shots-only file answers one
of the maps he asked for and forecloses the rest: the comparison screen's map
picker is a control with one option until defensive actions arrive too, and a
second file per action type would be four joins doing one join's work. `kind` is
what the picker filters on.

```jsonc
{
  "manifest": { /* … */ },
  "events": [
    {
      "code": 118748,
      "fplFixtureId": 21,        // via the MATCH LOGS — see the note under §3
      "minute": 63,
      "kind": "shot",            // shot | recovery | tackle | interception | clearance
                                 // | key-pass | duel | save
      "x": 88.4, "y": 51.2,      // NORMALISED 0–100, attacking left→right
      "outcome": "goal",         // per kind, and a closed set per kind — see below
      // Shot-only, absent on every other kind rather than nulled:
      "xg": 0.34,
      "situation": "assisted",   // SEE THE CORRECTION BELOW — this list is wrong
      "bodyPart": "right-foot"   // right-foot | left-foot | head | other
    }
  ]
}
```

**Normalise the coordinates in the exporter, not in the app.** Every provider
uses its own pitch and the app must not learn five of them; 0–100 in both axes
with the shooter always attacking to the right is the one convention this repo
will draw against.

> **Counted 10 Sep 2026: only `shot` is buildable, and the rest of this
> vocabulary was written aspirationally.** Nothing we hold has located defensive
> actions. `data/derived/defcon/player_match_defcon.parquet` has 1,200 rows for
> 26-27 but they are per-match COUNTS — tackles, clearances, blocks,
> interceptions, recoveries — plus a single average position (`pos_x`, present on
> 660 of the 1,200). The SofaScore raw match directory holds only
> `average-positions`, `event`, `graph`, `incidents`, `lineups`, `shotmap`,
> `team-heatmap-*` and `player/<id>-heatmap.json`: **there is no per-action event
> stream**. The three kinds that can honestly ship this season are `shot`
> (SofaScore, 1,233 rows), `touch` (shipped, see below) and `chance-created`
> (Understat's `player_assisted`, 402 of 549 shots). Do not build a picker
> against the list above.

**`kind` is the picker's vocabulary, so it is the one field that must not
drift.** The comparison screen builds its map filter from the kinds actually
present in the file rather than from a list of its own — a picker offering a map
with no points behind it is worse than a shorter picker — so a kind the exporter
stops emitting removes itself from the control, and a new one appears without an
app change.

**Vocabularies are closed sets and a value outside them is dropped, not
guessed.** If SofaScore sends something new, the exporter names it in the
manifest rather than passing it through — a screen colouring by outcome cannot
render a word it has never heard.

Sources: `data/staging/sofascore/shots.parquet` for the shots (staged and
currently unconsumed), and the per-match event feeds under
`data/raw/sofascore/{season}/premier-league/{match}/` for the rest. **Cap: 8 MB
at season end. Slice to the current season only**, and if that cap binds, drop
the least-used kinds rather than sampling within one — half a player's recoveries
is a map that is quietly wrong, where a missing kind is a picker with one fewer
option and no lie in it.

## 3. `positions/26-27.json` — average position, and the heat grid

Two things in one file because they answer one question and share both joins.

```jsonc
{
  "manifest": { /* … */ },
  "positions": [
    { "code": 118748, "fplFixtureId": 21, "x": 62.1, "y": 40.8, "touches": 71, "side": "home" }
  ],
  "zones": [
    { "code": 118748, "matches": 3, "grid": [0.0, 0.01, /* … 96 in all … */] }
  ]
}
```

`grid` is **12 columns × 8 rows = 96 cells, row-major from the defensive-left
corner**, each the share of that player's touches in that cell, summing to 1.

> ## AMENDED 10 Sep 2026 — the grid is not built; the raw cloud ships instead
>
> `touches/26-27.json` exists and is the point cloud this section forbade. Two
> measurements overturned it, and both are about ONE season rather than about the
> archive:
>
> 1. **A finer grid is noisier, not smoother.** Craig's complaint was *"heatmaps
>    are rough squares"*, and 12 × 8 drawn literally is exactly that — but the
>    busiest player in the league has **414 touches all season**, so a 32 × 20
>    grid gives him under one touch per cell. Smoothness has to come from a
>    KERNEL, and a kernel wants points. The app bins at 24 × 16 and blurs.
> 2. **The cloud is SMALLER than the grid it replaces.** 45,244 points as flat
>    alternating integers is a **291 KB** file, against 0.78 MB for a dense
>    24 × 16 grid and 1.31 MB for 32 × 20. The paragraph above is right that
>    every byte is baked into the bundle; it was wrong that aggregating saves
>    any.
>
> It also makes a per-fixture filter free, which a season-aggregated grid cannot
> do at any resolution. **"The raw point cloud never ships" still holds for the
> ARCHIVE** — the 3 Sep backfill added 5,418 files across all seasons and none of
> them belong here. It is a rule about the archive, not about one season.
>
> **The fixture join in §2 and §3 does not work.** `match_provider_map(
> "sofascore", "fpl_fixture")` returns nothing for every season. The route that
> does is `data/match_logs/{player,team}_match_log/season={season}/` — the team
> log's `player_heatmap_paths` lists each match's per-player files, the player log
> carries `fpl_fixture_id` and a `provider_player_ids` pairing SofaScore's id with
> FPL's element, and bootstrap turns that element into the code. `export_matches`
> already reads the same file, so the two cannot drift.
>
> **Both sides' team rows list every player in the match.** A path arrives twice
> and appending twice doubles a man's touches — 90,488 against the 45,244 that
> exist. The seen-set in `export_touches` is correctness, not tidiness.
>
> `positions[]` — average position per fixture — is still unbuilt and still
> wanted; `avg_positions.parquet` has 1,370 rows for 26-27.

Sources: `avg_positions.parquet` for the positions,
`heatmap_match_features.parquet` (or the raw heatmaps) reduced to the grid.
**Cap: 1 MB.**

## 4. `projections/26-27.json` — last, and deliberately slim

Craig's call, 5 Sep 2026: connect them, with `xMins`, `pStart` and `xPts`.

```jsonc
{
  "manifest": { /* … */, "horizon": [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
  "rows": [
    {
      "code": 118748, "gw": 4,
      "xPts": 5.4, "low": 2.1, "high": 9.8,
      "xMins": 78.2, "pStart": 0.86,
      "fixtureCount": 1,          // 0 blank, 1 single, 2 double
      "fplStatus": "a",
      "chance": null
    }
  ]
}
```

**Drop `fixture_projections` entirely.** That per-fixture breakdown —
`minutes_points`, `goal_points`, `cs_probability` and a dozen more — is a debug
artifact, and it is the difference between a 350 KB file and a 12 MB one.

**These are FPL's scoring rules, not our league's**, and the app will label them
as such: the column is headed `xPts (FPL)` and never sits beside a figure headed
`FPts`, which is Fantrax's word for what a man HAS scored under OUR scoring.
That distinction is `docs/ui/conventions.md`'s provenance rule and it is the
whole reason this file is safe to import.

Source: `data/derived/projections/gw{N}/projections.json`, keyed on
`person_season_id` → `element_map(season)` → element → bootstrap `code`.
**Cap: 700 KB over a 12-gameweek horizon.**

**The horizon needs a staleness check and it is not the same one the XI has.**
`intel-check` must assert the first `gw` in the horizon is not `finished`
(`roundFinished`), on `xiRoundFault`'s precedent and for its reason: a
projection for a round already played is not stale, it is wrong.

---

## 5. `pressers/26-27.json` — Friday, and only about men somebody owns

Craig's call, 16 Sep 2026: *"press conferences friday article, we have the
ingestion for it. Only mention the players who are actually drafted/in the
team."* The ingestion is `src/sweep/agents/press_conference_agent.py`, which
already emits tagged signals; nothing new has to be learned, only exported.

```jsonc
{
  "manifest": { /* … */ },
  "rows": [
    {
      "code": 118748,
      "club": 3,                    // FPL club code, for a man who moved
      "tag": "rotation_risk",       // the agent's own vocabulary, verbatim
      "confidence": 0.65,
      "said": "2026-09-18T13:00:00Z",   // when the presser was, not when parsed
      "manager": "Mikel Arteta"
    }
  ]
}
```

**The agent's tag vocabulary, unchanged and not re-grouped**:
`rotation_risk` · `managed_load` · `injury_scare`. If it grows a fourth, export
the fourth — a mapping table here would be a second vocabulary to keep in step,
which is the failure `situation` already had in §2's corrections.

**Carry the quotes, verbatim** — reversed 18 Sep 2026. This section said *"no
quote, ever, and this is a hard line"* on two grounds: the paper's invented-quote
sketches were cut on 3 Sep, and republishing a real manager's words was *"a
question this repo has not answered"*. Craig answered both — *"you can use the
actual quotes in quotation marks too if needed. like the scout does"*, and on
republishing, *"its a 10 man league, its not public"*.

**The half that stands is the half that mattered: a quote may be CARRIED, never
COMPOSED.** `voice/house.ts` forbids writing one outright, and that rule is now
load-bearing rather than belt-and-braces — it is the only thing between the
column and a sentence nobody said. The export is the sole source: a quote not in
this file may not appear in the paper.

The reason the old rule was wrong in practice: reducing a press conference to
`(code, tag, condition)` and asking a model to re-inflate it gave six clubs the
same sentence shape and the word "knock" eight times. The writer had nothing to
say because nothing had been carried.

```jsonc
{
  "quotes": [
    {
      "club": 8,
      "text": "He is getting closer and tomorrow, we will take a final decision.",
      "said": "Xabi Alonso",
      "about": "Moises Caicedo"   // optional; the source's own "… on X"
    }
  ]
}
```

`text` carries **no quotation marks** — the renderer adds them — and is never
trimmed, joined or tidied. At most three per club: the column prints one and
wants a choice.

**Carry the clubs that SPOKE, not only the ones with news** (Craig, 18 Sep 2026:
*"mention all teams, no news is still news"*). A manager who held a conference
and reported a clean bill of health is telling a reader something, and a club
missing from the thread reads as an oversight rather than as calm. Signals alone
cannot express that, so the file needs a second member:

```jsonc
{
  "manifest": { /* … */ },
  "spoke": [
    { "club": 4, "manager": "Eddie Howe", "at": "2026-09-18T13:00:00Z" }
  ],
  "rows": [ /* the signals, as above */ ]
}
```

A club in `spoke` with no row in `rows` is a club that said nothing worth
flagging, and the column prints it as exactly that.

**The club on a row is checked against the PLAYER, not trusted.** The reader
resolves each signal's club from the footballer's own `clubId` in the FPL
snapshot and DROPS the row if the export disagrees. This is not defensive
padding: a hand-made test file on 18 Sep paired a Crystal Palace player with the
Spurs club code, and the column printed "Spurs — Glasner did not rule out
rotating Yeremy" — a real manager, a real player, both of them Palace, and only
the label wrong. A wrong crest beside a real quote is worse than no row.

**The roster filter is OURS, not the exporter's.** Export every signal; the
Friday column drops the men nobody owns, through `affectedBy` in
`gazette/newsTriage.ts` which already does exactly this for the news wire. The
exporter does not know our rosters and must not be taught them.

## 6. `other-comps/26-27.json` — the classified's other half

Craig's call, 16 Sep 2026, on the Prem classified: *"includes the other comps the
prem teams have so you can quickly see who played/scored etc, stats only maybe,
no match report."*

**FPL publishes no cup or European fixture at all** — `prem/club/[code]/fixtures`
says so on the page — so this is the only source for them. The data already
exists: `data/raw/fotmob/fixtures/2026-2027/` carries `champions_league`,
`europa_league`, `conference_league` and `efl_cup`, refreshed 11 Sep 2026, with
rows under `fixtures.allMatches` shaped
`{home:{id,name}, away:{id,name}, status:{finished, scoreStr, utcTime, reason}, round}`.

```jsonc
{
  "manifest": { /* … */ },
  "rows": [
    {
      "competition": "champions_league",   // one of the four below
      "round": "League phase, MD1",        // FotMob's own string
      "kickoff": "2026-09-16T19:00:00Z",
      "homeCode": 3, "awayCode": 14,       // FPL club codes, NOT FotMob ids
      "homeScore": 2, "awayScore": 1,      // null before it is played
      "finished": true,
      "scorers": [{ "code": 118748, "minute": 23 }]
    }
  ]
}
```

**Competitions in scope, and no others**: `champions_league`, `europa_league`,
`conference_league`, `efl_cup`. All four have 26/27 files today. The Championship
and Ligue 2 files sit beside them and are not ours.

**Only matches with a Premier League club in them.** The classified is a Prem
reader's page; a Champions League tie between two clubs nobody here follows is a
fixture list, not news.

**Key on FPL club `code`, never FotMob's club id**, the same rule the top of this
file sets for players. The bridge exists at
`src/identity/season_file_minting.py:195` (`_fotmob_to_team_id`). A row whose
club will not bridge is **dropped, not guessed** — a wrong crest beside a
scoreline is worse than an absent fixture.

**Scorers are optional and the file is useful without them.** If a scorer will
not bridge to an FPL `code`, drop that scorer and keep the match: the score is
the fact the classified is for, and Craig's own framing was *"stats only maybe,
no match report."*

---

## The XI export is still the wrong shape, and it is the oldest item here

`data/intel/xi/gw3.json` is the one file that breaks this document's own shape
rule, and it has been failing `npm run intel-check` for days: gameweek 3's
football has been played, so the eleven is not stale, it is **wrong**.

It needs to become **one accumulating `xi/26-27.json`**, keyed by gameweek
inside the file, exactly as every other kind here is. The reason is in *The shape
rule* above and it is not theoretical: a static import chooses the round at BUILD
time while the heading above it is chosen at REQUEST time, so a build made after
the round turned served last week's eleven under this week's opponent — eleven
real names, a real formation, and the wrong match.

`apps/companion/app/intel.ts` static-imports `gw3.json` by name and moves with
it.

---

## Not exported, and why

**Pass maps.** *This paragraph said the FotMob pass-network builder was dead for
26-27 — `_SEASON_FOLDER_MAP` with no 2026-2027 entry, 380 raw match directories
unread. Counted 10 Sep 2026: `pass_network.parquet` holds **1,497 rows for
2026-27**, so the builder is running.* The conclusion survives the correction and
it was always the stronger half of it: what that file holds is `layout_x`,
`layout_y`, `vertical_x`, `vertical_y` and `is_starter` — **a lineup layout, not
a network with edges**. There is no pass map in it to export, working builder or
not.

**`role_cluster_label`.** KMeans on two columns of pitch position. The sister
repo's own comment says "deep-wide-1" holds Paul Dummett and Marcus Rashford, and
that the vocabulary regenerated three times in one evening, once by data alone.
It is a band of pitch, not a role, and this app already has a real position line.

**Goal chains.** `data/staging/sofascore/goal_chains.parquet` is a genuine
located buildup map — `x`, `y` and `event_type` per node of the move, plus the
goal's own shot location — and it would answer "how does he contribute to goals"
better than anything else we hold. It has 4,127 rows for 24-25 and 3,498 for
25-26 and **0 for 26-27**, so it is stale rather than absent. Worth re-running
upstream before it is designed on.

**SofaScore ratings** are exported (they are already on `IntelMatchPlayer`) and
are always labelled as SofaScore's. `types.ts` sets the precedent in as many
words: *"SofaScore's out of ten. Theirs and labelled as theirs."*

## Size, which is a real constraint here

`data/intel` is 476 KB today against `data/snapshots`' 9.8 MB — but
`apps/companion/vercel.json` excludes `snapshots` and `probes` from the build
trigger and **deliberately does not exclude `intel`**, because the app imports it
statically. So every export commit redeploys, and every byte is in the bundle.
The four caps above total about 7 MB at season end and that is the ceiling to
design against, not a target.

## How this arrives

Same as the four that exist: `make export-epl-draft` in the sister repo writes
the files, they are committed here, and the commit redeploys. A commit that does
not build is data nobody reads.

Each new file needs, in this repo and in the same commit as its first reader:
a type in `packages/core/src/football/intel/`, a parser beside it (**parse, never
assert** — it is provider data written by another repo on another schedule), a
`__fixtures__` sample, tests, and a line in `scripts/intel-check.ts`.

---

## Corrections and requests, 10 Sep 2026

Filed while building the match screen's shot map and team sheet.

### `situation` is not the closed set this file specifies

The spec above says `open-play | corner | free-kick | penalty | throw-in`.
Counted over all 824 shots in `shots/26-27.json`:

| value | rows |
|---|---|
| `assisted` | 402 |
| `corner` | 125 |
| `regular` | 110 |
| `fast-break` | 58 |
| `set-piece` | 53 |
| `throw-in-set-piece` | 47 |
| `free-kick` | 24 |
| `penalty` | 5 |

**`open-play` and `throw-in` never appear**, and four values are undocumented.
`shots.ts:17` asserts "every vocabulary here is a closed set the exporter
enforces" while typing the field as a loose `string | null`, so nothing caught
it. Nothing in the app reads `situation` yet; a screen that does must be written
against the counted list, not the specified one.

### A key pass map has no source this season — REFUSED, with the evidence

Asked for on 10 Sep and not buildable. Both candidates were checked:

- **`pass_network.parquet`** holds `layout_x`/`layout_y` on a 0-1 scale, and a
  4-3-3 keeper sits at exactly `(0.100, 0.500)`. Those are formation SLOT
  coordinates — a lineup diagram, not a network with edges. This file already
  refuses it and the refusal stands.
- **`goal_chains.parquet`** IS a genuine located build-up map, with `x`, `y` and
  `event_type` per node and `pass` the commonest type. It holds 4,127 rows for
  24-25 and 3,498 for 25-26 and **0 for 26-27**.

So the map is not "not built yet", it is unsourced. Revisit only if goal chains
backfill for this season, and note it would then be a GOAL build-up map rather
than all key passes.

### WITHDRAWN for 26-27: `positions/26-27.json` (§3) — the cloud already carries it

*Asked for on 10 Sep. Measured 11 Sep 2026 and no longer needed this season.*
`avg_positions.parquet` is the **mean of the same heat map `touches/26-27.json`
is built from**: identical `points_count` against our cloud length on 30/30 men
of SofaScore match 16363243, and means agreeing to 0.44 — the half-unit the
touch export's truncation to integers costs. `averageTouchPosition` in
`packages/core/src/football/intel/touches.ts` is the whole of the read, and the
cloud's coverage is the better of the two: **30/30 fixtures and 438/440
starters** against the table's same 30. Its only two extra columns are the
cloud's own length (`points_count`) and `PlTeamSheet` (`team_side`).

**The request stands only for seasons we hold no cloud for.** The note below is
kept because it is what was measured upstream, and because it is the shape to
build against if an archive season is ever wanted:

- `data/staging/sofascore/avg_positions.parquet` — **925 rows, 30/30 Premier
  League matches, 385 players** for 26-27
- `match_id, player_id, team_side, average_x, average_y, points_count`
- the **same 0-100 frame** as the touch clouds, and the same `player_id` join the
  touches export already makes
- `team_side` is the part worth having: a match map draws two sides on one pitch
  and one of them must be turned around, and this says which

**No starter flag is needed.** `PlTeamSheet.lineup` is an exact eleven at 30/30
from the Premier League's own feed, so the starting-XI filter happens on our side
(Craig, 10 Sep: the map is the eleven who started, never a substitute — a sub's
centroid comes off as few as one touch and is a noisy point pretending to be a
position). Ship the rows as they are.

### Also stale: `matches/26-27.json`

20 fixtures against 30 in the source logs, exported 4 Sep. Re-running the
exporter is the whole fix. Until then `matchIntel` answers nothing for fixtures
21-30 while `shots` and `touches` cover them — which is why the team sheet stopped
reading it for shirt numbers, sub notes and ordering.
