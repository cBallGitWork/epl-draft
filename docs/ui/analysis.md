# `/players/analysis` — a player, or two

Scout's second view. Craig, 6 Sep 2026: *"we need the player comparison tool too
— I attached the scout page a while back. Would need tables and probably a pitch
(which would plot the end points such as heat map/shot map etc)"*. Two
references: Fantasy Football Scout's Player Maps, and — added 10 Sep 2026 —
Understat's player compare, which is where the search boxes and the per-90 table
come from.

**It was `/players/compare` until 10 Sep 2026**, and the rename is not cosmetic:
the screen now works for ONE man as well as two (Craig: *"give me the option to
look at 1 player only"*), and a view called Compare that draws a single player is
a name making a promise the screen does not keep. "Analysis" covers one or two,
and covers figures, maps and attributes rather than any one of them.

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
3. **The figures**, mirrored: what each has DONE, per ninety minutes.
4. **The maps** — a touch map or a shot map, chosen by a picker above them.
5. **The attributes**, mirrored: figure · label · figure.
6. **Him on Fantrax**, and the second man too when there is one.

**Swap sides is gone** (10 Sep 2026, Craig). It answered "which side am I
reading", and the bar above answers that already — each man on his own club's
plate with his name on it, which is a stronger answer than a button that makes
you press it to find out.

**One man is a whole screen.** Every panel takes null for the second: the bar
drops the `v` and the second half, the two tables lose their right-hand column
and the label moves left, and the maps draw one pitch at half width rather than
one stretched across the desk. Nobody chosen is the only empty state left.

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
- **`scroll={false}` on the result links**, as on the map picker. It was left on
  at first, on the reasoning that choosing a MAN changes the whole subject of the
  screen where choosing a map changes one panel. The reasoning was sound and the
  answer was still wrong (Craig, 10 Sep 2026: *"its annoying"*): the result list
  collapses the moment you pick, so the page shortens under the tap and the jump
  lands somewhere nobody asked for. **Every navigation within this screen now
  holds its place**; the tab strip out of it does not, which is correct — that
  one really is a link to somewhere else. Measured after the fix: 0px of drift
  from a scroll position of 300, with `b` genuinely changing.

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

## The maps

Craig, 10 Sep 2026: *"currently on ours the plots are far too big, heatmaps are
rough squares. should have a filter for each map we can use"* — and, asked which
he wanted, **heatmap only, smoothed**.

**A pitch each, not two halves of one.** The old map put both men on one pitch
attacking opposite ways, which was right when each had a single dot: two dots
kept to their own halves cannot collide. It is wrong for a density field —
halving the axis squeezes a striker's whole map between the halfway line and one
goal, and what comes out is a smear rather than a shape. Both pitches now run the
same way, side by side on a desk and stacked under a thumb, which is also the
reference's own per-player presentation.

**The smoothing is a kernel, not a resolution.** `heat.ts` bins at 24 x 16 —
cells of 4.17 x 4.00 on the 100 x 64 pitch, near enough square, because an oblong
cell blurs into an oblong smudge and reads as a direction the player never had —
and an SVG `feGaussianBlur` at 2.0 does the rest. A finer grid would have made it
worse, not smoother: the busiest player in the league has 414 touches all season,
so a 32 x 20 grid gives him under one touch per cell.

An SVG filter rather than a canvas, so the map is server-rendered like the rest
of the desk: no client component, no hydration, and it survives being printed.
The filter id is per pitch — two `id="heat"` in one document and the second man
is drawn with the first man's filter, which is a real map of the wrong shape.

**A warm ramp, and NOT the club's colour.** The first cut shaded each map in its
man's club colour, since the bar above already codes them that way. Two things
were wrong and both were visible on sight. Manchester City's sky blue on green
turf is very nearly nothing, so the map was legible for Chelsea and blank for
City — a picture whose readability depends on who is in it. And the colour was
doing no work: these are SEPARATE pitches with the man's name over each, so
identity is carried by the caption, and club colour was spending the one visual
channel a density map has on a fact already stated.

> **This needs a DESIGN.md ruling and does not have one yet.** §3 makes every
> colour a slot with one meaning, and `--color-hot`/`--color-cold` are
> deliberately a THRESHOLD rather than a scale — *"a cell is lit or it is not;
> there is no second strength"* — confined to a board of many measures. A density
> ramp is a scale by definition, so it cannot wear them, and this is the app's
> first sequential ramp. It is kept local to the pitch on purpose: it shades a
> colour PLATE, which is DESIGN §5's own category and where the pitch and the
> crest already live, and it never touches ink, a cell or a control.

**A curve, not a gain, and that is the difference between a map and a fog.** Five
rounds in a man has perhaps 90 touches over 60-odd cells, so his busiest cell
holds three and a cell holding ONE is a third of the way up the scale. The first
cut multiplied by a flat gain to make up what the blur spreads away, which drew
that single touch at full strength and left every map warm from one goal to the
other — the rough squares solved and replaced with something worse. `shade()`
raises density to a power first, so the floor stays the floor.

The exponent went 1.8 then 1.25: 1.8 killed the fog and took most of the warmth
with it (*"heat maps are a little faint"*). The blur came down from 2.0 to 1.7 in
the same adjustment, and the two are the same knob from opposite ends — a tighter
kernel throws less intensity away, so less has to be added back. `shade` is
tested against the PEAK rather than against a number, because a brighter map
raises both and only the ratio is the rule.

**Each map is normalised to its own man's busiest area**, so the two show SHAPE.
A comparison where one man has 400 touches and the other 40 would otherwise draw
the second as a blank pitch, which says "no data" when the truth is "less of it".
Volume is a number and sits in the caption above each pitch.

### No prose under the maps

There was a line saying which way they attacked and what a mark meant, and it
came off on 10 Sep 2026 (Craig: *"remove this row"*). What it was doing is now
done by the things themselves, which is the better shape for both halves of it:

- **A faint thick arrow ON each pitch** (*"have a very feint thick arrow on the
  pitch to indicate thats the attack"*). Top centre, which is the one strip of
  grass no map fills — a shot map lives in the attacking third and a touch map
  spreads along the middle — so it never sits on a reader's data. Faint because
  it is the same claim on every pitch on the screen, and furniture must not
  compete with the one thing that differs.
- **A key drawn from the marks themselves** (*"maybe add a key for which shot was
  a goal"*), from the same `DRAWN` table the pitch draws from, so the key and the
  picture cannot disagree about what a goal looks like. A key written in prose is
  a second statement of the encoding, and two statements drift. Said ONCE for the
  section rather than under each pitch — both men are drawn by the same rules —
  which is the call the retired `Pitch.tsx` made about its own key.

The shot key carries the one thing a ring cannot show, in four words: size is the
chance behind it. The touch map has no key, because a warmer patch meaning more
touches is not a code anybody has to be taught.

**x is not flipped; y is — and SofaScore's two feeds disagree about y.**

x already runs from a man's own goal towards the one he attacks, in both feeds.
Measured across the whole export on 10 Sep 2026: keepers average x=11.0,
centre-backs 36.4, full-backs 47.6, midfielders 48.8, attacking midfielders 58.4,
forwards 61.8. A flip there would put every striker in his own box.

y is the trap. In the HEATMAP feed a right-back averages y=17.9 and a right
winger 26.0, against a left-back's 79.8 and a left winger's 70.9 — so y=0 is the
RIGHT touchline. In the SHOT feed it is the other way round: RW 59.6 and RB 59.8
against LW 43.9 and LB 45.1. **One provider, two conventions, and nothing in the
payload says so.**

Drawn from above with a man attacking to the right, his right side is the BOTTOM
of the picture — the larger SVG y. The shot feed already satisfied that; the
heatmap feed did not, so Arsenal's right winger was drawn out on the left
touchline (Craig, 10 Sep 2026: *"saka is showing as left wing, hes on the
right"*). The touch feed's y is flipped in the exporter, which is the contract's
rule and exactly the case it exists for.

**The check that settles it is the two feeds agreeing with each other**, not
either one looking plausible. Across the 86 players who have both a touch map and
four or more shots, mean touch-y against mean shot-y correlates at **r = +0.82**
after the flip. Before it, the same test would have been strongly negative — and
a screen drawing two maps that disagree about which side is which is indefensible
however good each looks alone.

### The head is CM's own words

**"Action Zones"** (Craig, 10 Sep 2026: *"replace with something more CM"*).
`cm9900/16.jpg` and `22.jpg` run `Match Overview · Match Stats · Action Zones ·
Match Report`, and `match.md` has listed Action Zones for weeks as one of the two
tabs the game has and we do not — `intel-export.md` calls it "the Action Zones
gap" in as many words. This is that gap closed, under the game's own heading. It
read "Maps", which was ours and named the picture rather than the reading.

### The picker, and why it waited

Craig, 10 Sep 2026: *"need options for touch map, shot map etc"*. It is built
from the kinds actually PRESENT for the two men on screen, never from a list of
its own — so a kind neither of them has does not appear, and where only one kind
survives there is no picker at all, because one plate is not a choice. That is
why it did not ship with the touch map: it would have been a single plate.

**A segmented strip and not chips**, which is semantic rather than visual.
`players.md` records the ruling: a Championship Manager tab strip picks ONE of a
set and marks exactly one plate current, so multi-select plates are a strip
making a claim it cannot keep. A map is one at a time — `cm-tab cm-tab-quiet`
with `aria-current`, a URL parameter and a `<Link>`, never React state.

**Both men always draw the same map.** Two pitches on two different kinds is not
a comparison, so the control sits once above both.

**`scroll={false}` on every plate.** Next scrolls to the top on each navigation,
which is right for a link to somewhere else and wrong for a control that changes
one panel in place: the maps sit well below the fold, so choosing one scrolled
the thing you had just chosen off the screen (Craig, 10 Sep 2026: *"everytime you
touch touch/shot map you go back to the top of the page"*). `Search.tsx` and
`PickField` pass the same flag to `router.replace` for the same reason. Measured
both ways after the fix: 0px of drift from a scroll position of 369.

**The head does not name the map**, because the picker under it does. Titling the
section "Shot map" over a plate reading "Shot map" is the duplication Craig
struck off the search boxes the same day.

The fixture filter is still unbuilt. Touches and shots both carry
`fplFixtureId`, so per-match is free whenever it is wanted — but five rounds in,
one match is about forty-six touches or four shots, which is a scattering rather
than a shape.

### The shot map

**Small, and the arithmetic is the point.** The pitch is 358px wide at 390 and
about 530px in a half-width desk column, so one viewBox unit is 3.58px and
5.3px. The role pitch this replaced drew `r="2.6"` — a 19px blob under a thumb
and 57px across a full-width desk, which is what Craig meant by *"the plots are
far too big"*. A base radius of **1.0** is 7px and 11px: a mark rather than a
blot, at both widths, with no breakpoint.

**Radius carries xG by its SQUARE ROOT, so AREA is proportional.** A radius
proportional to xG makes a 0.4 chance look four times a 0.1 rather than twice
it. Capped at 0.8 — a penalty is 0.79 — and a shot with no xG at all (five of
824) takes the plain radius rather than the smallest, because we do not know what
it was worth and drawing it as worthless would be a confident wrong answer.

**Outcome is fill and weight, never a new hue.** DESIGN §3 gives every colour one
meaning and none of them means "saved": `--color-bad` is a loss, a doubt, a
negative, and a blocked effort is none of those. Green turf refuses most of the
palette anyway. So every mark is cream — ink on a colour plate — separated on
fill and weight, which is PRODUCT.md's rule that a signal is paired with a shape.
**Three tiers and not five**: goal (filled), on target (ring), off target or
blocked (faint ring). A reader can hold three apart on a pitch this size; block
against miss is a number in a table, not a ring nobody can measure.

**The marks are not interactive**, which settles the tap-target question rather
than dodging it: a 7px target cannot meet the 44px thumb floor, so the map is a
picture and the figures live in the table above it.

**The coordinates are flipped IN THE EXPORTER.** SofaScore publishes a shot as
distance from the attacking goal — x from 0.8 to 52.6, penalties at exactly
x=11.5 y=50.0 — which is a different convention from the same provider's touch
clouds, where x already runs from a man's own goal to the one he attacks. The app
must not learn two conventions from one provider. Verified on the way through:
penalties land at 88.5, goals average x=89.8 against a miss's 84.7, and mean xG
falls from 0.20 inside x<10 to 0.03 beyond x>20.

### What replaced the role pitch

`compare/Pitch.tsx` and `app/pitchSpot.ts` are gone. They drew one dot per man at
his weighted role, which was the only locational fact we held; the heat map
answers the same question from 45,244 real touches. Keeping both would be two
pictures under one heading, and a reader could not tell which he was looking at
without reading the caption. A man with no touches gets "no touches recorded",
which is honest — a synthetic dot standing in for a real map is the confident
wrong answer this app refuses.

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

## The data behind the maps

Counted in `~/ai-carling-premiership` on 10 Sep 2026. The map section had been
written off as blocked on an absent export; what was actually absent was the
count. **Touches shipped the same day**; the other two are next.

| Map | Source | 26-27 |
|---|---|---|
| **Touches** (heat) — SHIPPED | SofaScore per-player heatmaps, via the match logs | 970 player-match files · 45,244 points joined · 367 players |
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
  raw cloud is also *cheaper* — the written file is **291 KB** against 0.78 MB
  for a dense 24 × 16 grid — and makes a per-fixture filter free.
- **The contract's fixture join does not work.** It names
  `bridges.match_provider_map("sofascore", "fpl_fixture")`, which returns nothing
  for every season. The route that does is the match logs, which is what
  `export_matches` already reads — the team log lists each match's per-player
  heatmap files, the player log carries `fpl_fixture_id` and a
  `provider_player_ids` pairing SofaScore's id with FPL's element, and bootstrap
  turns that element into a code. One file, three joins, and it cannot drift from
  the match export because it is the same file.
- **Both sides' team rows list every player in the match.** A path therefore
  arrives twice, and appending twice silently doubles a man's touches — 90,488
  points against the 45,244 that exist. Caught by counting the output against an
  independent count of the input.

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

- **Chances created** — the third map kind, plotting where the shots a man SET UP
  were taken from. Understat's `player_assisted` carries it on 402 of 549 shots
  and the assister's name must be resolved once in the exporter, never at
  runtime.
- **The fixture filter**, above. Both exports carry `fplFixtureId` already.
- **The ramp has no DESIGN.md ruling.** See "The maps" above; it is the app's
  first sequential scale and it is confined to a colour plate until it is judged.
- **Understat's xG family** — npxG, xGChain, xGBuildup, key passes — is a second
  block under "This season" once `eye-test/26-27.json` lands. FPL publishes none
  of it.
- **The two figures sit far apart at 1440.** The mirrored table puts a name's
  figures at opposite edges of a 1090px panel, which is a long way for an eye to
  carry a decimal. `Measures` has always had it and the shape is deliberate; it
  is recorded here because it is more noticeable with two-place rates than with
  integers out of twenty.
