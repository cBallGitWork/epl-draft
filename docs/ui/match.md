# `/prem/match/[id]` — one match

The real Premier League fixture, on Championship Manager's own match screen.
**Everything on it is a fact the fixture list published; the minute a goal was
scored is not one of them, and the screen says nothing rather than guessing.**

`../rules/DESIGN.md` is binding for colour and type and this file defers to it.

## Why it stopped being a scaffold

It shipped on 3 Sep 2026 as a landing place for links (Craig: *"clicking a prem
fixture takes it to match page (just scaffold for now)"*), carrying the two
sides, the score and the date, and saying so: *"The goals, the line-ups and the
match statistics are still to come."*

Two of the three no longer have to be. **FPL's `/fixtures/` carries a `stats`
block on every finished match** — scorers, assisters, own goals, penalties saved
and missed, cards, saves, bonus, a per-fixture bps and defensive contribution,
split home and away — and `packages/core/src/football/fpl/raw.ts` did not model
it. Three quarters of this screen was arriving on the wire and being thrown away
on every page view.

`packages/core/src/football/matchSheet.ts` is the read, and its header sets it
against the two neighbours that already answer a version of the question:
`selectors.contributions` answers it for the round in view off one live feed, and
`gameLog.mapGameLog` answers it per fixture for one player at thirty requests a
match. This is every player, any fixture, one 26 KB read.

## What the data is, counted

All figures counted 4 Sep 2026 across all 380 fixtures, and they are the reason
for every shape decision below.

| | |
|---|---|
| `/api/fixtures/?event=N` | **26 KB** — the read this screen makes |
| the whole season | 183 KB today; a finished fixture is 2,938 bytes against an unstarted one's 342, so **~1.1 MB by May** |
| `/api/event/N/live/` | 437 KB, and the only place minutes exist |
| identifiers on a finished fixture | 11 · on an unstarted one, `stats` is `[]` |
| the bps block | **exactly the appearance list** — fixture 11, 32 elements against 32 players with minutes above nought, no misses and no false positives |
| bps range | **signed**: 47 of 616 entries below nought, floor −14, none exactly nought |

## On the page

1. **`MatchBar`** — both clubs at once, each on its own colour, **each with its
   own score at its own right-hand edge**. `cm9900/21.jpg` is Everton blue
   against Arsenal red and `16.jpg` is the same blue against Torquay **white**,
   so a pale side is a case the reference has rather than an edge we invented;
   `inkOn` answers it. Before kick-off there is **one `v` between the plates**,
   not one in each box.
2. **The strip** — `Overview · Stats · Line Ups · Highlights`. Four, and the reason is below.
3. **The caption — the GROUND, on the Overview only.** `cm9900/21.jpg` runs
   "Goodison Park, Liverpool" along the foot of every match screen and
   `cm0102/02.jpg` puts "St.James's Park, Newcastle" in the yellow caption at the
   top. The strip already names the view, so a caption repeating it said nothing.
   It was under all five tabs until 11 Sep 2026 (Craig: *"stadium name and ref
   row only show on overview page"*) — the other four are TABLES, and a table
   pushed down by a ground it did not ask for has paid a row of a phone's screen
   for a fact already read. **The referee and attendance line under the panel is
   gone altogether** (Craig, 23 Sep 2026: *"remove that ref row and attendance"*).
4. **The panel** — the date in full at the left, the round, the tense and the
   half-time score at the right **in cyan**, then either the scoresheet or the
   preview. Under it, the **Match Report** — the commentary under a blue bar, run
   the page's full length rather than in a box of its own (Craig, 23 Sep 2026: *"we
   have a browser scroll AND a match report scroll"*).
5. **The foot row** — CM's related-screens strip (`cm0102/02.jpg`), under the
   panel on Stats (`Brentford · Match · Chelsea`) and Line Ups (`Team Sheet ·
   Pitch`). The shell's `foot` slot draws it with `TabStrip`. **On a desk it is pinned to the window's foot**
   (`lg:sticky`), so a long page keeps it in view (Craig, 24 Sep 2026: *"i need to be able to see the footer
   row"*); a phone's already sits above the thumb rail.

*Corrected 4 Sep 2026 after Craig read the first build.* The scores were centred
between the plates rather than at each side's own edge; an unplayed match drew
`V V`; the caption named the view; and an "In our league" panel counted rostered
men under the scoresheet. All four are gone.

## Five tabs, where the game runs four

`cm9900/22.jpg` runs `Match Overview · Match Stats · Action Zones · Match
Report`. We run `Overview · Line Ups · Stats · Action Zones · Highlights` — Craig's
order, 23 Sep 2026: the elevens second.

**Every name on a match screen opens the player's card, never his page** (Craig,
23 Sep 2026: *"tapping a player brings up their player pop up, not a link"*) — the
team sheet, the club boards, the pitch and the scoresheet all open
`components/league/PlayerCard`, **the same card the squad board and the lineup
planner open** (Craig, 23 Sep 2026: *"should be the same pop up as elsewhere, that
needs to be a repo standard"*). `matchCards` builds each man's `SquadPlayerDetail`
from the match and our league's `prem/leagueOpinions` — his Fantrax id is what the
card's *Full profile* opens — and a man our league does not list stays plain text.
The match screens' own card, with its sub minutes and owner, is gone. **A panel ends where its
content does** rather than filling to the foot of the screen, and a phone gets a
`←` plate at the left of the score bar, because the rail's arrows are a desk's.

**The Fantasy Report is a Stats view of its own** (Craig, 23 Sep 2026: *"fantasy
report needs a full page, put it in stats"*, `/stats?view=fantasy`, the fourth plate
on the foot row) — FPL's own match details (`Goals scored ·
Assists · …`) for our league: each category's men, home left and away right,
`Name (n)`, one category after another at every width, plain text set close
rather than a column of doors. **Counted by the real league** (Craig, 1 Oct 2026: *"use the
real league stats"*): `scoringDay.ts` reads the `scoring` league's `getPlayerStats` for the
match's London day, and `fantasyCategories.ts` lists the categories it scores, each found by
meaning (`AT` not `A`, `GKP` as *Keeper actions*, never `Sv`) and headed in plain football
words by the same meaning (`categoryWords.ts`: *Assists*, never Fantrax's *Assists (Total)*). Minutes, clean sheets
and goals against are left off: every man has the first, and the score says the other two.

**DefCon only when a man gets close** (*"defenders, only when they get 1, mids when they have 4
or more, forwards 3 or more"*): half the first band of the league's own DefCon at the letter his
points are priced at (`defConAt`: DFP from 3, DFP3 from 8 and 6), nearest the band first, nobody
below it. **FPL DefCon is a box of its own** (*"show fpl defcon too"*): FPL's count, by the same
half of FPL's threshold (5 of 10 for a man named in defence, 6 of 12 further up), and never on a
line beside ours.

**Stats is Player Stats and Match Stats merged** (Craig, 23 Sep 2026: *"player
stats and match stats can be merged to stats"*). `/stats` opens on the two sides
against each other; the foot row's club plates (`?view=home|away`) open that
club's men — CM 01/02's `Roma Stats` screen. `/team-stats` is gone, and so is the
one table of every man in the match.

*This section said "two tabs, where the game runs four" until 10 Sep 2026, and
both halves were stale. The strip had grown to four, and Match Stats had a source
the whole time: `fetchPlMatchStats` was written on 4 Sep and had no caller in the
app for six days. `22.jpg`'s board is **thirteen of thirteen rows** from that one
call.*

**Action Zones is a tab again, in CM's own place** (Craig, 23 Sep 2026: *"shots
need to show who made the shot, so we probably need to separate shots/average
positions into its own section"*). `/zones`: both sides' shots on ONE pitch, home
attacking the left box and away the right (the export is player-relative, so home
takes a half-turn), with every shot in one list under it — minute on the club's
tile, shooter, outcome, xG — ranked by minute or by xG. Tapping a row or a mark
picks the shot and rings it in the accent. **Each shot names who made it** — Understat's
`player_assisted`, joined onto SofaScore's shot by the sister repo's exporter (938 of 1,363,
23 Sep 2026) — under the shooter on a phone, beside him on a desk; and every **key pass** is drawn as a
dashed line from a square where it started (SofaScore's key-pass actions, 695 of the 938), its line
under the marks and stopping at its shot's edge, its square over them so no mark hides where a pass began,
and the square in the key. **Where the action is thick** every mark sits on a disc of turf inside its
halo, so a line or a mark under it stops at the edge, and bigger marks draw first so a smaller one is
never buried (30 Sep 2026: goals on top would have buried 2 shots and mostly hidden 29). On a desk
the list sits beside the pitch. **Every mark wears a cream halo and every pass line a cream underlay**: 14 of the 20
club colours fall under 3:1 on the darker mow band (Chelsea 1.38, Everton 1.15), cream is 10.5:1
(measured 23 Sep 2026), so the club colour stays and the edge carries the contrast. `Min` and `xG` are the list's two heads,
links like every other board's sort (`?order=xg`), and the shooter is named in full. Then the average positions, under a
blue bar of their own; a phone shows one section at a time. An
own goal is left off the side that scored it: the export flags none, so a shot is
dropped only where its unpriced goal and FPL's `ownGoals` for that man agree. **It
is only as current as the sister repo's shot and touch export** — fixtures 1-30 as
last run on 10 Sep — and a match past it says so rather than drawing two empty
pitches.

**Line Ups is where the game files Player Ratings**, which is a FOOT button in
`16.jpg` and `21.jpg` rather than a tab. It is a tab here because it is the view
this app exists for.

## A club's men

One club's squad **ranked by fantasy points** (Craig, 23 Sep 2026), ties in the
team sheet's order: the Fantrax position tile in the club's colour, the name with
its sub note on a desk, then the measures, centred under their heads as CM sets them — `Pts Min G A xG xA CS GC Sv DC B YC Rtg`, each head a sort
link that keeps the club (`statsSort.ts`). A man who played prints every figure
**including 0**; one who never got on prints `—` (Craig, 23 Sep 2026: *"zero is a
stat"*). The tile and the name are pinned so the measures scroll under them at
390, and neither wears a head plate — CM heads only its figures. A fade at the
right edge says the measures go on before CM's bar at the foot is in view.

Among the ties the bench's men who got on sit above the ones who sat. **A column's
standouts are lit in CM's inks** (Craig, 23 Sep 2026: *"yellow font colour, and
orange for even better"*): yellow for the top values inside a fifth of the men who
played, orange for the one best inside a tenth, red on `GC` and `YC` where high is
bad — `standoutCut`, and DESIGN §3's "Peak" row. `Pts` and `Rtg` stay cyan and
unlit.

## Match Stats

`cm9900/22.jpg`'s thirteen rows in its order, plus five simple ones (Craig,
23 Sep 2026: *"possession etc… simple stats fine"*): Possession, Shots On Goal,
On Target, Off Target, Blocked, Corners, Free Kicks, Throw-Ins, Fouls, Offsides,
Passes Completed, Tackles Won, Headers Won, Interceptions, Clearances, Saves,
Yellow Cards, Red Cards. All eighteen are one `/stats/match` call; Opta publishes
no xG there (0 of 187 metric names, probed 23 Sep on Brentford 3-0 Chelsea).

A figure plate each side with the label between them, which is why it is a
three-column grid and not a table: the label is the axis and the figures are its
ends, where a table would make one side the subject and the other a column.
Capped at `max-w-2xl` on a desk, because the reference is a PROPORTION — `22.jpg`
is ~690px on an 800px canvas, and stretched to 1440 the same markup put a
thousand pixels of turf between `14` and `10`.

**Under four plates — Attack, Possession, Defence, Discipline** (Craig, 23 Sep
2026: *"group it behind tiles better"*), two by two on a desk and stacked under a
thumb. Each side's figures sit on its club's colour with `inkOn`'s ink, so the
percentages are no longer cyan; the two card LABELS keep their cards' colours.

**Opta's metric names are not English** and `matchStats.ts` carries the table:
`fk_foul_lost` is fouls COMMITTED and `fk_foul_won` fouls WON, `total_throws`
includes the keeper's. **A metric worth nought is absent from the payload**,
which inverts DESIGN §7 — see [premier-league-api.md](../providers/premier-league-api.md).

**The two maps are on Action Zones since 23 Sep 2026**, each drawn once per TEAM
(Craig, 11 Sep 2026: *"shot and touch maps need to be by team"*): four pitches,
side by side within a map on a desk and stacked under a thumb. Each pitch wears its
club's own plate, with the count on the shot map and the formation on the other.

**Splitting deleted the mirror rather than moving it.** Every coordinate the
sister repo exports is player-relative — his own goal to the one he attacks — so
a side with a pitch of its own is already facing the right way, and both pitches
read left to right. `mirrorShot` existed only to put two frames on one picture,
and it went with its last caller (CODE_RULES §2).

The **shot map**: radius carries xG by its square root so AREA is proportional,
outcome is fill and weight, and colour is the club's.

The **average position map** (Craig: *"we can create a formation map"*, then
*"call it average position"* — which is the name on the screen and the name of the
file). Every STARTER at the centre of his own touches:

- **It is the shape as MEASURED, which is what makes it a different object from
  the pitch that came off Line Ups** the same day. That one drew the formation's
  own slots, and four characters of `sheet.formation` already said everything a
  slot diagram could. A back four camped on the halfway line and one pinned on
  its own box are the same four characters and not the same match.
- **The centre needed no export.** `averageTouchPosition` over the touch cloud is
  SofaScore's own `average_x`/`average_y` to within the export's rounding —
  measured 11 Sep 2026, counted in [PLATFORM_NOTES](../record/PLATFORM_NOTES.md),
  30/30 fixtures and 438/440 starters.
- **Starters only, and the eleven comes off the team sheet.** A cloud says a man
  touched the ball, never that he started; a substitute's centre can come off two
  touches and would be a noisy point pretending to be a position.
- **A named man with no cloud is dropped and the plate admits it.** `teamSheet.ts`
  sets the precedent for the dropping — *"a pitch with a hole in it is a worse
  answer than a pitch with ten men"* — but a reader counting ten discs and finding
  no gap has been told a side played a man short, so the plate reads `10 of 11 ·
  4-2-3-1` when it happens and carries the formation alone when it does not.
  Ipswich 0-2 Liverpool is a live case: Exequiel Palacios started and the export
  has no touches for him.

### Bunched players — the mark never moves, the label does

Craig, 11 Sep 2026: *"needs to handle players bunched together"*. Two centre-halves
splitting a back four average four units apart and their names are set on the same
line on top of each other, which is what made the first cut unreadable — the discs
underneath were perfectly clear.

`labels.ts` is the arithmetic and it is unit-tested, because two names that clear
each other by a pixel at 390 and collide at 1440 look identical in a diff. A name
takes the slot under its own disc, then the one over it, then a row further out
each way to three; **the disc itself never moves**, because it is a measurement
and nudging it draws a picture that lies about where a man played. Past eight
co-located men the arithmetic gives up NEAR the man rather than flying his name
across the pitch — an overlap is unreadable, a name closer to somebody else's disc
is wrong.

*The first cut instead hung the home side's names below its discs and the away
side's above, which was a two-sided fix for a problem that is also same-sided, and
it went when the pitches split.*

## The team sheet

`cm9900/16.jpg`, both sides, and every column on it has a 30/30 source since
10 Sep 2026. The index block carries **our Fantrax league's position** for him
(`PositionTile`, Craig, 23 Sep 2026: *"the squad number tile, replace with the
fantrax position"*), and it is the row's only position — the real one is on the
card. The sub note and the card are the Premier League's `events` array.

*Three of those columns read the sister repo's match log until 10 Sep, which
covers fixtures 1-20 of a season whose other exports reach 30. Ipswich 0-2
Liverpool drew no numbers, no sub notes and no order at all.*

A booking is a small coloured block between the number and the name — CM's own
mark, in a slot every row keeps so the names stay in one column. `YC` and `RC`
are filtered out of the chips beside it: the block already says it.

**Stacked under a thumb and paired on a desk.** CM runs both elevens facing each
other on an 800px canvas where each panel gets ~340; ours is 390, and two columns
gave each side 175 against a row measuring 199, so the away side's points column
was pushed out of its panel and clipped. The document never overflowed and no
element reported a right edge past the viewport — only the screenshot caught it.

**Only `Pts` is headed on the sheet, centred under it; no formation line over it** (Craig, 23 Sep 2026: *"column headers look
crap, remove them all except for PTS"*); the pitch carries no formation line.

**Under a thumb it is one club at a time** (Craig, 23 Sep 2026: *"a button for
each team, THEN for list/pitch, rather than a big scroll"*): a row of `BRE · CHE`
and `Team Sheet · Pitch` above the board (`?side=away`), and a desk shows both.

**The Pitch** is the foot row's other plate (`?view=pitch`): each eleven in
`sheet.shape`, the shape its manager drew, in **faces** (Craig, 1 Oct 2026: *"this
pitch view, use portraits"*; kits from 26 Sep to 1 Oct), a man with no photograph
in his club's kit, the score
under each name, and an amber `▼ 69′` on a man taken off. The men who came on
stand in a strip under the grass with `▲ 69′`. `pitch-match`
budgets the grass so the strip clears the nav at 390×844 (767 against 798 with the
phone's control row, measured 23 Sep). One `widest` across both pitches, so the halves are drawn to
one scale. No doubt colour on the plates: today's injury flag has no business on
a match already played.

## The scoresheet

**CM's arrangement with the assist added** (Craig, 4 Sep 2026: *"the screen that
has the goal scorer timer needs assists too"*). `cm0102/02.jpg` puts the home
scorers down the left and the away scorers down the right.

**One row per SCORER, not per goal** (Craig, 11 Sep 2026: *"isak can have one row
only for both goals… both assists can be one row too if its both. if it was 2
players, just show two assists row"*). `goalGroups` in core does the folding and
is tested there. Read next to the 10 Sep move from a list of MEN to a list of
GOALS, this is not a reversal of it: the scorer and the assister still sit on
different lines, in different ink, at different sizes. What folds is a man's own
name repeated over his second goal, which said nothing the minute beside it had
not. Alex Scott's two Bournemouth goals — the case that argued for goal-rows in
the first place — now read `9', 35'` with his one assister under them once.
A man's own goal never joins his real ones: they are credited to different sides.

**The owner rides in brackets after the name** (same message: *"owner name can go
after ISAK (put in brackets), saves a row"*), and the assister has one now too.
It was a second line under every name — two rows of chrome for one man, on the
screen with the fewest facts in the app — and a league team name is a gloss on
the name it follows rather than a fact of its own.

**The assister carries a minute only when a second assister makes it say
something.** This went round the houses in one afternoon and the landing place is
the rule, not the history: one assister and POSITION already answers it — he sits
under the scorer whose goals he made, so a clock repeats the line above him; two,
and position answers nothing, so `A Semenyo 17'` over `A Foden 84'` is the only
thing pairing each man with his goal. Craig settled both halves against real rows
(*"you dont need the assist number at all… as its under the goal"*, then *"keep
the assist when a player scores twice, and its two different assisters"*).
Crystal Palace 1-4 Man City is the fixture that shows both at once: Haaland and
Cherki keep their minutes, Donnarumma's own goal drops one. `PlGoalGroup.assisters`
is `{ code, minutes }[]` so the component can make that call.

**The ball marks the goal line** (Craig, 11 Sep 2026, drawing `(goal icon)` before
the scorer). It is `EventIcon`'s existing glyph, whose own rule is that it stands
beside a word and never instead of one — here the word is the name and the
minute, which is what CM's sheet is. Goal lines only: a sending off and a penalty
missed share the row shape and keep their word.

**Its size is stated at the call site**, because `EventIcon` draws at `1.1em` and
so is only ever as big as the type of the box holding it. That box inherited the
LIST's size rather than the name's, which put a 15px ball beside a 30px name and
made it read as a bullet (Craig: *"make goal icon bigger"*). It is now a step
above the name at both widths.

**The type went up a step on the desk** (same message: *"can make scorer and
minute font bigger"*, and *"stadium name, data, and gameweek, referee row all way
to small"*). `02.jpg` sets a scorer at about 2.2% of its 800px canvas and its two
furniture strips at about 1.4%, which on a 1440 desk is 32 and 20 against the 24
and 14 we had. The phone is unchanged where a column is only half a screen wide.

**Neither column is mirrored, and the first build got that wrong.** `02.jpg` sets
both sides name-first with the figure to its right — `L.Clark 29` on the left
half and `Flo 14` on the right — and `16.jpg` does the same with two columns of
ratings. The side is carried by *which column* a name is in; reversing the away
half puts its chips before its names and makes one of the two lists read
backwards.

**The events are `chipsFor`'s vocabulary**, unchanged. `MatchSheetLine` satisfies
its structural `Countable` as it stands, so this is not a fourth spelling of the
six events — that component's own docblock records the fixture list's drop-down
as the third rendering that had already drifted from the other two.

**Three events have no chip and take a word**: an own goal, a penalty missed, a
penalty saved. The first two take the loss slot and the third takes the gain
slot, because a saved penalty is the keeper's (DESIGN §3's direction pair).

**No minute, and that is the one thing FPL does not have.** Not the fixture list,
not the live feed, not `element-summary`. It is in the sister repo's SofaScore
staging — `events.json` carries goal, card and substitution minutes — and it
arrives with the export.

## The Fantasy Scores board

`cm9900/16.jpg`: both sides facing each other, a figure at the end of each name.

**The column heads take the clubs' own colours.** `21.jpg` heads each side's
stats with that side's colours, which is the rule `league/teamColours` states in
general — *a colour identifies a side in a confrontation*. Two blue plates said
which club only by reading three letters.

**The figure is FPL's points, in cyan** (Craig, 4 Sep 2026: *"dont use bps here,
use fantrax points"* and *"scores need cyan"*). The first half of that could not
be done and the second is right for a reason worth stating: a fantasy score is a
reading **derived** by a scoring system from recorded events, which is exactly
what `--color-info` means, and `cm9900/16.jpg` runs its ratings column in the
same ink.

**Why not Fantrax's own, counted against this fixture's 32 participants on
4 Sep 2026.** `mapLivePlayerPoints` — the read the app already has wired for live
scoring — answers for **6 of 32**: only the men a manager had ACTIVE, and what it
answers with is a **period total**, which would be wrong outright the first time
a period holds two gameweeks. `getPlayerProfile` → `recentGames` answers for
**32 of 32** with a true per-match figure, and works even for a free agent — at
**one rate-limited request per player**; the limiter fired within about thirty
back-to-back calls when it was probed. FPL's `explain` block answers for
**32 of 32**, exactly, in one read per round. So that is the figure, headed as
FPL's and never as `FPts`, which is Fantrax's word for Fantrax's scoring of a
slot we chose.

*A Fantrax figure for every man in a match is therefore a paced CAPTURE, not a
page read — 32 requests a match against 380 matches. It is not built.*

**The index block is the Fantrax position** since 23 Sep 2026, in the club's
colour; a man our league does not list gets `—`.

**The sub note is `sub on 64'` / `sub off 71'`**, from the Premier League's
`events`, beside the name (`SubNote`, shared with the club boards).
`cm9900/16.jpg` writes it in ORANGE, which the reference records as its ink for
an event rather than a figure — we have no orange slot, and the closest true one
is `--color-mid`, because the thing being printed is a minute.

**Ordered down the pitch, keeper to attack** (Craig: *"ordered by position/match
line up though (strikers at bottom etc)"*), which is the order `cm9900/25.jpg`
runs its slot strip. The bench sits under the eleven.

**Every row is a link and is therefore a CONTROL** — 44 under a thumb and 36 on
the desk, not `.cm-row`'s 28. `tapfit` failed all 32 names on the first build at
18px, which is what an inline anchor round a word measures. The cost is the one
`players/[fantraxId]/MatchLog` already recorded: this board is less dense than the
reference, because CM's could be dense when nothing in it was clickable.

## The fantasy layer, and how far it goes

Every name carries the squad holding him, from `owners()` — a **NAME and never a
figure**, which is the rule the club page's Owner column set and what keeps this
clear of `SeasonTotals`' bound. Fantrax publishes points per PERIOD and not per
fixture; a number here would be a period total wearing a match's clothes.

**No owner colour** (Craig, 4 Sep 2026, asked and answered). The two Premier
League clubs already own the sides on this screen, `teamColours`' docblock
restricts the hue to a title bar and a head-to-head side, and `--color-accent`
keeps its one meaning. Nine rivals are told apart by name, as
`components/football/MatchList` already does it.

~~**"In our league" is keyed off SQUAD MEMBERSHIP, not off the sheet.**~~
**Removed 4 Sep 2026** (Craig: *"remove this In our league"*), and the panel it
described is gone from both states. The join it used survives one level down:
every name on every board still carries the squad holding him, which is the half
that is about a player rather than about a tally.

## States

| State | Test | Overview | Players |
|---|---|---|---|
| Upcoming | `status === "upcoming"` | `Preview` — each side's **home record against the other's away**, its place, its last five, FPL's own difficulty | **both clubs' squads**, keeper to attack, to the team sheet's standards — the Fantrax tile, the name opening his card, the owner; one club at a time on a phone |
| Live | `status === "live"` **and** `speaksForNow` | the scoresheet so far, `Live 45′` | who has appeared so far |
| Finished | `finished` | `FT` | the appearance list |
| No round | `gameweek === null` | no sheet; the fixture still renders | `TabEmpty` |
| Fantrax silent | `marks()` empty | the owner lines vanish; the football renders | same |
| id is not an integer, or names no fixture | — | `notFound()` | `notFound()` |

**Full time is `FT`, whether or not FPL has settled its bonus** (Craig, 6 Oct
2026: bonus is the FPL tab's alone, so nothing outside it waits on it). The sister repo's day-long lag is a
different absence and belongs only to the tabs that do not exist yet.

**No `loading.tsx`, deliberately.** `docs/record/PLATFORM_NOTES.md` records that adding one
converts a true 404 into a soft 200, and this was one of only two routes still
answering honestly. The one slow read is Fantrax, so it streams behind
`<Suspense>` instead, as the player screen does.

## The files

| Route | File | What it draws |
|---|---|---|
| `/prem/match/[id]` | `page.tsx` | the scoresheet or the preview, and the league panel |
| `…/players` | `players/page.tsx` | both team sheets, by bps |
| — | `Shell.tsx` | the back plate, the bar, the strip, the foot row slot, and — on the Overview alone — the ground caption |
| — | `MatchBar.tsx` | the two-plate header |
| — | `MatchTabs.tsx` | the strip |
| — | `Scoresheet.tsx` | who was named |
| — | `Preview.tsx` | a match nobody has played |
| — | `match.ts` | the one read both views make |

Core: `football/matchSheet.ts` (the type, the mapper, `sheetSides`,
`scoresheet`), `football/fpl/raw.ts` (`RawFixtureStat`), and `gameweekSheets` in
`app/football.ts`.

## How you get here

**Every score in the section is a link, and that sentence was false until 4 Sep
2026.** `prem/Match` — the row on Results and on Fixtures, which is where a
reader lands from the rail — rendered its scoreline as a bare `<span>` and had
done since the section shipped, while [prem.md](prem.md) and this page's own
docblock both claimed otherwise. The only two links that ever reached here were a
club's fixture run and a player's match log.

`prem/club/[code]/Run.tsx` also linked **played fixtures only**, which was right
while there was nothing behind a preview. Every row links now.

## The sister repo's match log, and what it is worth

Wired 4 Sep 2026. `scripts/export/epl_draft_intel.py` writes a fourth file,
`data/intel/matches/{season}.json`, and `football/intel/matches.ts` reads it.
**20 of 380 matches, rounds 1 and 2**, running about a day behind full time — so
the question a screen asks is never "does the file exist" but "is THIS match in
it", and `matchIntel` returns a Map whose miss is the ordinary answer.

What it carries that FPL does not, with the counts as at that date:

| | |
|---|---|
| goal and card minutes | 20 of 20 logged matches |
| the position a man actually played | 440 of 1,220 rows (the starters) |
| on/off minutes | 363 of 1,220 |
| SofaScore's rating | 602 of 1,220 |
| formation, possession, shots, corners, fouls, tackles, xG | both sides of all 20 |
| half-time score | 20 of 20 |
| **referee** | **2 of 20** — Andy Madley and Samuel Barrott, and eighteen nulls |

**An own goal arrives as a plain `goal` with no flag**, and the screen reconciles
it against FPL's `own_goals` list. Verified across all 20: 17 name only men FPL
also calls scorers, and the three that do not are exactly the three in those
lists. Without the reconciliation an own goal reads as a goal for the wrong side.

## Known gaps

- ~~**Action Zones**, the one tab the game has and this does not.~~ **A tab since
  23 Sep 2026**, when Stats merged and freed the plate. **Before that, closed
  11 Sep 2026, as two maps on Match Stats rather than as a sixth tab.** *This
  entry said the average positions were "in SofaScore staging and not yet
  exported" and paired the gap with Match Stats, which had been a real tab since
  10 Sep.* Both halves were in the tree: the shots were already drawn, and the
  average position turned out to be `averageTouchPosition` over the touch cloud.
  **Not a tab, and the strip is why**: a sixth plate is 65px wide at 390
  against the five's 78, and `TabStrip`'s own docblock records "Team Stats" — the
  same length as two labels in this strip — needing 58px at `3xs` inside a plate
  that would now have 49px of room. A tab bought by wrapping two of the labels it
  already has is not a tab. The four pitches belong on the two-SIDES tab in any
  case, which is where Craig put them (*"Match Stats as one page"*).
- **A Fantrax figure per man per match.** 6 of 32 from what is wired, 32 of 32
  only through one rate-limited request per player — so it is a paced capture
  rather than a page read, and it is not built.
- **Referee, attendance and weather**, which `cm0102/02.jpg` prints along its
  foot. We drew the first two until 23 Sep 2026 and Craig took them off; nobody we
  read publishes weather.
- **A predicted eleven on the preview.** `data/intel/xi/26-27.json` has Scout's
  latest per club, one rolling file with a round in its manifest.
- ~~The two scorer columns sit a long way apart at 1440.~~ **Closed 4 Sep 2026**
  — the columns are capped at `22rem`, because `cm0102/02.jpg` sets its two
  blocks at about a third of the canvas each and half of a 1120px panel put a
  name and its minute 500px apart.

## The report is on the Overview now, and the fouls are not

Craig, 11 Sep 2026: *"so we could leave a bit of space under the goals, and have
the match report underneath? to remove clutter, we could hide all fouls/free
kicks won"*.

**Under the goals, in its own panel.** The overview was the scorers and then a
screenful of ground — a 2-0 fills a fifth of the panel and the photograph filled
the rest. The scoresheet answers "what was the score" and the commentary answers
"what happened", which is two statements rather than one long one, so it is two
boxes (DESIGN §2). Capped at `max-h-96` with `.cm-scroll-y`, on `Wire`'s rule
that a list cut short with no bar looks like a short list.

Behind its own Suspense boundary: the stream is the one read on this page the
scoresheet has not already warmed, and the scorers must not wait on it.

**`withoutFouls`, and the denominator is why.** Opta has no `foul` type. It has
`free kick lost` — literally *"Foul by Florian Wirtz (Liverpool)"* — and
`free kick won`, the two halves of one event. Counted across all ten fixtures of
gameweek 3 on 11 Sep 2026: **1,141 events, of which 489 are those two — 42.9%**.
The next biggest type is `miss` at 8.9%.

So it is applied on BOTH screens, this one and the Match Report tab. That
reverses a principle `plCommentary` states in its own docblock — *"a report is
everything"* — and the principle was written before anyone counted. A feed where
two types are nearly half the rows is not a record of a match; it is a record of
its fouls with a match between them.

The emptiness test on the Report tab is asked of the WHOLE feed, not the filtered
one: a match with commentary but no incident outside the fouls still has
commentary, and "no commentary" would be the wrong sentence.

`Commentary.tsx` is the row both screens draw. Two callers rather than three, so
CODE_RULES §1 would leave it duplicated — and would, if what was duplicated were
small. It is a row, an icon map, a tone map and the argument for all three, and
two copies seventy lines apart are free to disagree about what a goal looks like.
Both callers are in this folder, so it is co-located rather than promoted.
