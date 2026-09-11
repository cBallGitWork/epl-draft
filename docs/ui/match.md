# `/prem/match/[id]` — one match

The real Premier League fixture, on Championship Manager's own match screen.
**Everything on it is a fact the fixture list published; the minute a goal was
scored is not one of them, and the screen says nothing rather than guessing.**

`../../DESIGN.md` is binding for colour and type and this file defers to it.

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
2. **The strip** — `Overview · Fantasy Scores`. Two, and the reason is below.
3. **The caption — the GROUND, on the Overview only.** `cm9900/21.jpg` runs
   "Goodison Park, Liverpool" along the foot of every match screen and
   `cm0102/02.jpg` puts "St.James's Park, Newcastle" in the yellow caption at the
   top. The strip already names the view, so a caption repeating it said nothing.
   It was under all five tabs until 11 Sep 2026 (Craig: *"stadium name and ref
   row only show on overview page"*) — the other four are TABLES, and a table
   pushed down by a ground it did not ask for has paid a row of a phone's screen
   for a fact already read. The referee line went with it.
4. **The panel** — the date in full at the left, the round, the tense and the
   half-time score at the right **in cyan**, then either the scoresheet or the
   preview, then the referee and the attendance along the foot.
5. **Player stats** — every man in the match as a row: position, minutes, goals,
   assists, saves, bonus, and SofaScore's rating.
6. **`MatchFoot`** — CM's second foot row, finally drawn: the two clubs, and a
   **waiting plate** for the advanced data.

*Corrected 4 Sep 2026 after Craig read the first build.* The scores were centred
between the plates rather than at each side's own edge; an unplayed match drew
`V V`; the caption named the view; and an "In our league" panel counted rostered
men under the scoresheet. All four are gone.

## Five tabs, where the game runs four

`cm9900/22.jpg` runs `Match Overview · Match Stats · Action Zones · Match
Report`. We carry three of those four, plus Player Stats and Fantasy Scores —
`Overview · Player Stats · Match Stats · Fantasy Scores · Match Report`.

*This section said "two tabs, where the game runs four" until 10 Sep 2026, and
both halves were stale. The strip had grown to four, and Match Stats had a source
the whole time: `fetchPlMatchStats` was written on 4 Sep and had no caller in the
app for six days. `22.jpg`'s board is **thirteen of thirteen rows** from that one
call.*

**Action Zones stays off, and it is now the only one.** No provider publishes a
zone. `TabStrip`'s `dim` is not the answer: its docblock says it greys a view
with nothing behind it *for this subject*, and a plate greyed for all 380 matches
reads as broken rather than honest. This section has already ruled on the same
case once — [prem.md](prem.md): *"Tactics is not a tab and will not be one… It
arrives there when there is a real XI to draw."*

**`/team-stats` and not `/stats`**, which Player Stats already holds. The two are
a real pair and the names say which is which: Match Stats is the two SIDES
against each other, Player Stats is every man in the match.

**Fantasy Scores is where the game files Player Ratings**, which is a FOOT button
in `16.jpg` and `21.jpg` rather than a tab. It is a tab here because it is the
view this app exists for. The foot row is drawn as well and carries the two clubs
— the third plate on it was a dead `<span>` reading "Match Stats" until that
became a real tab, and a foot plate and a tab to one place is the screen
repeating itself.

## Match Stats

`cm9900/22.jpg`, thirteen rows in its order: Shots On Goal, On Target, Off
Target, Corners, Free Kicks, Throw-Ins, Fouls, Offsides, Passes Completed,
Tackles Won, Headers Won, Yellow Cards, Red Cards.

A figure plate each side with the label between them, which is why it is a
three-column grid and not a table: the label is the axis and the figures are its
ends, where a table would make one side the subject and the other a column.
Capped at `max-w-2xl` on a desk, because the reference is a PROPORTION — `22.jpg`
is ~690px on an 800px canvas, and stretched to 1440 the same markup put a
thousand pixels of turf between `14` and `10`.

Cyan on the three percentages, which is `--color-info` doing its job: a
proportion is a reading we derived and a count is Opta's. `22.jpg` prints the
same three in cyan and the two card LABELS in their own cards' colours.

**Opta's metric names are not English** and `matchStats.ts` carries the table:
`fk_foul_lost` is fouls COMMITTED and `fk_foul_won` fouls WON, `total_throws`
includes the keeper's. **A metric worth nought is absent from the payload**,
which inverts DESIGN §7 — see [premier-league-api.md](../providers/premier-league-api.md).

Under it, the **shot map**: every shot in the match on one pitch, the two sides
attacking opposite ways. The away side is mirrored because every coordinate the
sister repo exports is player-relative — both sides are stored attacking right —
and `mirrorShot` rotates rather than flips, since turning a pitch around swaps
left and right as well as ends. Radius carries xG by its square root so AREA is
proportional; outcome is fill and weight, and colour is the club's.

## The team sheet

`cm9900/16.jpg`, both sides, and every column on it has a 30/30 source since
10 Sep 2026. The shirt number is the Premier League's `matchShirtNumber` — the
number he wore in THIS match — the sub note and the card are its `events` array,
and the order is the FORMATION rather than a position string, so a back three
stops being read as a back four.

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

Under the board, the **formation**, drawn with the flat CM diagram rather than the
photographed trapezoid, which is `PitchRows`' own rule: a screen about
ARRANGEMENT gets the diagram. One `widest` across both pitches, so the two halves
of one match are drawn to one scale. It is UNDER the board and not over it: a
pitch is 612px tall at 390 and two of them put the scores this tab exists for two
screens down. It clears the fold on its own (780 against 844) — but clearing the
fold and being the first thing a reader meets are different claims.

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

**The shirt number is in CM's blue index block**, from the squads export: FPL
publishes `squad_number` as a key and null as a value on every element. A man
nobody has a number for gets the block and no figure.

**The sub note is `on 62` / `sub 74`**, from the match log, in the figure slot.
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
| Upcoming | `status === "upcoming"` | `Preview` — each side's **home record against the other's away**, its place, its last five, FPL's own difficulty | **both clubs' squads**, keeper to attack, with shirt numbers and owners |
| Live | `status === "live"` **and** `speaksForNow` | the scoresheet so far, `Live 45′` | who has appeared so far |
| Finished, bonus settling | `finished && !settled` | `FT · bonus provisional` | as below |
| Finished, settled | `settled` | `FT` | the appearance list, by bps |
| No round | `gameweek === null` | no sheet; the fixture still renders | `TabEmpty` |
| Fantrax silent | `marks()` empty | the owner lines vanish; the football renders | same |
| id is not an integer, or names no fixture | — | `notFound()` | `notFound()` |

**Four rungs and not two.** `Fixture.settled` is FPL's own sign-off that the
bonus has been added and stopped moving — a one-to-two-hour window after the
whistle in which the `b` chips are still provisional, and nothing may print a
flat `FT` over figures about to change. The sister repo's day-long lag is a
different absence and belongs only to the tabs that do not exist yet.

**No `loading.tsx`, deliberately.** `PLATFORM_NOTES.md` records that adding one
converts a true 404 into a soft 200, and this was one of only two routes still
answering honestly. The one slow read is Fantrax, so it streams behind
`<Suspense>` instead, as the player screen does.

## The files

| Route | File | What it draws |
|---|---|---|
| `/prem/match/[id]` | `page.tsx` | the scoresheet or the preview, and the league panel |
| `…/players` | `players/page.tsx` | both team sheets, by bps |
| — | `Shell.tsx` | the bar, the strip, and — on the Overview alone — the ground caption and the referee line |
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

- **Match Stats and Action Zones**, the two tabs the game has and this does not.
  The team figures for the first are already in the export and unread; the shot
  x/y and average positions for the second are in SofaScore staging and not yet
  exported. The waiting plate in the foot row is where they land.
- **A Fantrax figure per man per match.** 6 of 32 from what is wired, 32 of 32
  only through one rate-limited request per player — so it is a paced capture
  rather than a page read, and it is not built.
- **Attendance and weather**, which `cm0102/02.jpg` prints beside the referee.
  No provider we hold publishes either.
- **A predicted eleven on the preview.** `data/intel/xi/` has one per club, filed
  per round, and `xiRoundFault` is the check that it is the right round.
- ~~The two scorer columns sit a long way apart at 1440.~~ **Closed 4 Sep 2026**
  — the columns are capped at `22rem`, because `cm0102/02.jpg` sets its two
  blocks at about a third of the canvas each and half of a 1120px panel put a
  name and its minute 500px apart.
