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

## 2. `shots/26-27.json` — the shot map

One row per shot. `docs/ui/match.md` already names the absence as the Action
Zones gap, so the screen has a written home before the file exists.

```jsonc
{
  "manifest": { /* … */ },
  "shots": [
    {
      "code": 118748,
      "fplFixtureId": 21,        // joined via match_provider_map("sofascore","fpl_fixture")
      "minute": 63,
      "x": 88.4, "y": 51.2,      // NORMALISED 0–100, attacking left→right
      "xg": 0.34,
      "outcome": "goal",         // goal | saved | off-target | blocked | post
      "situation": "open-play",  // open-play | corner | free-kick | penalty | throw-in
      "bodyPart": "right-foot"   // right-foot | left-foot | head | other
    }
  ]
}
```

**Normalise the coordinates in the exporter, not in the app.** Every provider
uses its own pitch and the app must not learn five of them; 0–100 in both axes
with the shooter always attacking to the right is the one convention this repo
will draw against.

**Vocabularies are closed sets and a value outside them is dropped, not
guessed.** If SofaScore sends something new, the exporter names it in the
manifest rather than passing it through — a screen colouring by outcome cannot
render a word it has never heard.

Source: `data/staging/sofascore/shots.parquet` (staged and currently unconsumed).
**Cap: 5 MB at season end. Slice to the current season only.**

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

**The raw point cloud never ships.** It is thousands of coordinates per player
per match; `data/intel` is inside the Vercel build trigger and every file is
baked into the bundle. Aggregate upstream. A backfill on 3 Sep added 5,418 raw
heatmap files in the sister repo and none of them belong here.

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

## Not exported, and why

**Pass maps.** The FotMob pass-network builder is dead for 26-27:
`build_fotmob_pass_network.py` points `_RAW_FOTMOB_ROOT` at
`data/raw/fotmob/match_details`, which does not exist (the tree is
`data/raw/fotmob/matches/<season>/<comp>/<match>/`), its glob looks one level too
shallow, and `_SEASON_FOLDER_MAP` has no 2026-2027 entry. 380 raw match
directories are sitting there unread. Recorded in the sister repo's own
`signal_coverage.py`. **Fix the builder before promising a pass map**, and note
that what `pass_network.parquet` holds even when it works is `layout_x` and
`is_starter` — a lineup layout, not a network with edges.

**`role_cluster_label`.** KMeans on two columns of pitch position. The sister
repo's own comment says "deep-wide-1" holds Paul Dummett and Marcus Rashford, and
that the vocabulary regenerated three times in one evening, once by data alone.
It is a band of pitch, not a role, and this app already has a real position line.

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
