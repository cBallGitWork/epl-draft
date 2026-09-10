# `/players/compare` — two men, side by side

Scout's second view. Craig, 6 Sep 2026: *"we need the player comparison tool too
— I attached the scout page a while back. Would need tables and probably a pitch
(which would plot the end points such as heat map/shot map etc)"*. Two
references: Fantasy Football Scout's Player Maps, and — added 10 Sep 2026 —
Understat's player compare, which is where the search boxes and the per-90 table
come from.

**Two profile reads and never more.** `subject()` is one live, uncached
`getPlayerProfile` each, and Fantrax throttles that endpoint at about
twenty-seven calls — `player.md` states the policy as "one profile per tap, never
a sweep of the 697". Two per view is inside it; a board of them never would be,
which is why comparison is a ROUTE you arrive at with two ids rather than a
column on the directory.

## On the page

1. **The picker** — two search boxes, one per side. See below.
2. **The bar**, split, each half on that man's club colour. `MatchBar`'s shape
   rather than `PlateShell`'s, which holds one plate and whose docblock
   pre-refuses a config object for a second. Copied rather than extracted: two is
   a coincidence (CODE_RULES §1), and the third occurrence is what will say what
   varies.
3. **This season**, mirrored: what each of them has DONE, per ninety minutes.
4. **The pitch** — where each of them plays.
5. **The attributes**, mirrored: figure · label · figure.
6. **Swap sides**, which answers the one thing a mirrored table cannot — which
   side you are reading.

## The picker

Craig, 10 Sep 2026: *"we need to compare players without leaving this screen, so
we need search bars."* Until then the only way to change either man was the board
— `/players?compare=<id>` turned the directory into a picker — so swapping one of
two players meant leaving the comparison, finding a name among six hundred, and
coming back.

- **Two boxes and not one**, because "who am I comparing him to" is asked far
  more often than "who am I comparing", and one box would need a mode. Each is
  labelled with the man it would replace, so the screen says what a tap does
  before it is tapped.
- **The pool, and never a profile read.** `subject()` is one live uncached
  `getPlayerProfile` per man against a ~27-call throttle, which is the whole
  reason comparison was a route you ARRIVED at with two ids. A picker reading a
  profile per candidate would blow that ceiling on the first keystroke. The pool
  is one `leagueCache` entry shared with the board, so a keystroke costs Fantrax
  nothing. `pick.ts` carries the argument.
- **`Search.tsx`'s shape, copied** (CODE_RULES §1, second occurrence): 250ms
  debounce, `replace` not `push`, GET form first and JavaScript second, filtering
  on the SERVER because `pool.ts` forbids shipping 670 players to a phone. What
  already differs is the point of it — the board's box navigates away by design,
  this one narrows a list beside the two men while they stay put.
- **An empty box offers nothing**, rather than the first six of six hundred: a
  list nobody asked for pushes the comparison off a phone. Six matches at most,
  so the last is not behind the keyboard.
- **The other side's man is excluded** — a name you cannot pick should not be in
  a list of names to pick.
- **The board's picker stays.** It is the way in from a player's own page; this
  is the way to change your mind once you are here. Neither is the other's
  fallback.

## This season

Craig, 10 Sep 2026: *"a table of relevant stats … highlighting who is best, use
per 90 in a list."*

**The grid says where he RANKS; this says what he DOES.** `Measures` renders the
same underlying quantities as a percentile out of twenty, which answers "is he
good at this" and cannot answer "how often". Understat's compare — the second
reference Craig sent — prints exactly this table beside exactly that normalised
picture. Without the rates the screen ranks men against a division it never
shows; without the ranks the rates have no scale.

**FPL's numbers only, and deliberately none of the three the competition counts.**
`SeasonTotals` binds goals, assists and clean sheets away from a fantasy screen
and names `/players` as one of the screens that is not `/prem`. This route
carries no Fantrax figure today, so the collision is not live — but the
underlying play is the safer read and the better one, and a man's goal count is
one tap away on his Data tab.

- **A row neither of them has anything to say about is dropped**, which keeps
  Saves off two forwards and keeps it on two keepers. `PlayerStats`' rule — *"a
  column of noughts … buries the two figures that are not one"* — applied to a
  table two wide, where the whole row can go rather than each cell.
- **Which end is better is per MEASURE.** Expected goals conceded is the one a
  defender wants LOW, so lighting the higher figure would praise the worse
  defence. `Measures` never had this problem — every attribute is out of twenty
  and up is good — which is why the ladder gains a direction here.
- **The measure decides how a figure prints, not the value.** A rate landing on
  a whole number is still a rate: `Number.isInteger` set Haaland's nought tackles
  and two bonus points as `0` and `2` in a column of `0.82` and `35.33`. Found by
  looking at the screen.

## The pitch

**Points only, colour-coded, with a key** (Craig, 6 Sep 2026: *"points only, no
names / colour code with a key for the two different players"*). Names rode on
the turf for one build and collided the moment two roles were close.

- **Each man gets his own HALF, attacking his own goal.** The reference's caption
  is the instruction — "compare two players in opposing directions, with each
  standalone map normalised from defence on the left to attack on the right" —
  and its picture puts one man's marks at the left goal and the other's at the
  right. Overlaying them mirrored was the first build and it was unreadable: a
  defender mirrored onto the far end lands exactly where the other man's
  attacking midfielder stands. Halving the axis cannot collide.
- **His club's colour, and a shape as well.** The bar above is already each man
  on his club's plate, so the key confirms what the reader has just been told
  rather than teaching a new code. Two clubs can be near-identical reds, so the
  first man is a circle and the second a diamond — PRODUCT.md's rule that a
  colour signal is always paired with a label, shape or position.
- **Not `.pitch`.** That class is the squad and head-to-head pitch's frame and
  `pitch.css` gives it a PORTRAIT aspect ratio, so a landscape map inside it sat
  in a portrait box with 284px of dead grass under it, measured. It was borrowed
  for colour tokens that turn out to be global.

### One point each, and why there are not more

**FPL publishes no location at all**, the Premier League's own feed is per-team,
and the sister repo's SofaScore events are staged and **not exported**. So the
pitch plots the one locational fact we hold: the sister repo's weighted role,
which is already the cyan line on the player screen.

A scatter of invented points would look exactly like a real one, which is the
confident wrong answer PRODUCT.md's fourth principle exists to forbid.

**The map filter Craig asked for is not built YET** — *"filter for the
different stats (shots/recoveries etc)"* — because a control offering maps with
nothing behind them is worse than no control. What changed on 10 Sep 2026 is that
the data was found rather than assumed absent: see "The maps, and what is behind
them" below. `docs/providers/intel-export.md`
was widened from `shots` to `events` with a `kind` for exactly this, and the
picker is to be built from the kinds the file actually carries rather than from a
list of its own: a kind the exporter stops emitting then removes itself from the
control, and a new one appears without an app change.

## The attributes

**Rows align by NAME, never by index.** A keeper's grid drops the seven measures
about scoring and creating in open play and an outfielder's drops Handling and
Reflexes (`football/attributes.ts`), so zipping two arrays position by position
would print a keeper's Reflexes against a striker's Finishing under whichever
label came first. A measure only one of them has is still a row with a dash
opposite — a real answer about a keeper beside a forward, where dropping it would
silently shorten the grid.

**The better of the two is the LOUDER**, which is `player.md`'s rule for the
single grid carried over unchanged: a step down in loudness rather than a second
hue. `--color-mid` for the better, ink for a tie, `--color-muted` for the weaker.
Red is refused there and refused here — `--color-bad` means *a loss, a doubt, a
negative*, and a player is not a fault for being the weaker of two.

A missing rating is quieter still and is **not** a loss: he has not played the
ninety minutes the rate needs, which is a different statement from being worse
at it.

## The maps, and what is behind them

Counted in `~/ai-carling-premiership` on 10 Sep 2026. The map section was written
off as blocked on an absent export; what was actually absent was the count.

| Map | Source | 26-27 |
|---|---|---|
| **Touches** (heat) | SofaScore `data/raw/sofascore/2026-27/premier-league/<match>/player/<id>-heatmap.json` | 970 player-match files · 45,671 points · 408 players |
| **Shots** | `data/staging/sofascore/shots.parquet` | 1,233 |
| **Chances created** | Understat `player_career_shots.parquet` `player_assisted` | 402 of 549 (73%) |

Bridge: `data/mappings/season=26-27/fpl_to_understat.parquet`, 513 of 652 FPL
elements. `fpl_id` there is the per-season element id, so the exporter joins
through bootstrap to `code`.

Three findings that outrank what was written before:

- **SofaScore is the shot source, not Understat.** 1,233 against Understat's 829
  and FotMob's 827, with a richer schema (`xgot`, `goal_mouth_x/y/z`,
  `block_x/y`, `body_part`, `situation`) — and it is the **same provider as the
  touch clouds**, so both maps share one identity join instead of two. Understat
  keeps one job: `player_assisted`, for Chances created.
- **Located defensive actions do not exist.** `intel-export.md` §2 specifies
  `kind: shot | recovery | tackle | interception | clearance | key-pass | duel |
  save`; **only `shot` is buildable.** `data/derived/defcon/` has 1,200 rows for
  26-27 but they are per-match COUNTS plus one average position, and SofaScore's
  raw match dir has no per-action event stream at all. That vocabulary was
  written aspirationally.
- **The heat grid must be a kernel, not a resolution.** The contract's 12 × 8 =
  96 cells drawn literally *is* the "rough squares" Craig complained of, and
  going finer is worse: the busiest player in the league has **414 season
  touches**, so a 32 × 20 grid gives him under one touch per cell. Shipping the
  raw cloud is also *cheaper* — 45,671 points is ~350 KB against 0.78 MB for a
  dense 24 × 16 grid — and makes a per-fixture filter free.

Deferred rather than missing: `sofascore/goal_chains.parquet` is a real located
buildup-to-goal map (4,127 rows in 24-25) with **0 rows for 26-27**.

## States

- **Nothing chosen yet** — an ordinary state, not an error, and since 10 Sep 2026
  it carries the two search boxes rather than sending the reader to the board.
- **One chosen** — its own state, and a real one now that the boxes are here: it
  says which box to fill rather than pretending nothing has been picked.
- **Fantrax refused for one of them.** A profile is one live read each and
  nothing is cached for it, so there is no older answer to show instead. The
  picker stays, because a refusal a reader can do nothing about is still a screen
  he can choose a different man on.
- **A man the bridge has never settled** has no football half: no portrait, no
  attributes, no season, and both tables draw whatever the other man has with
  dashes opposite.

## Known gaps

- **The maps themselves** — the data is counted and the shapes are decided; the
  export is not written. Touches, then shots, then chances created.
- **The plots are too big**, which is the current one-dot-each pitch and not the
  maps: `r="2.6"` on a `100x64` viewBox is a 57px blob at 1440. The arithmetic
  for the replacement is `r ≈ 1.0` — 7px at 390, 11px at 1440, one value and no
  breakpoint.
- **Understat's xG family** — npxG, xGChain, xGBuildup, key passes — is a second
  block under "This season" once `eye-test/26-27.json` lands. FPL publishes none
  of it.
