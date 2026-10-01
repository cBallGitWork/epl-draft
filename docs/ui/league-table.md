# `/league` — the table

Fantrax computes the standings. **This page never adds anything up.**

Wrapped in `LeagueShell`: page header, then the section nav — `League · Cups
· Schedule · Results · Team Stats` (Craig, 27 Sep 2026: *"Change table to league. Move cups to
2nd"*) — that the League tab is divided into.
The nav stays on screen even in the empty states: without it a reader landing
here during an outage has no way to reach the others and the section becomes a
dead end. **Matchups is not on the strip**; it is in `SectionNav`'s `FOOT`,
which is where CM files a screen that is about a fixture rather than about the
division.

*This paragraph said "the three-way section nav (Table · Schedule · Matchups)"
until 3 Sep 2026, and had been wrong since 31 Aug — the strip gained Results and
both stats boards and lost Matchups on the same day. Corrected against
`league/SectionNav.tsx`.*

## On the page

Standings rows as Fantrax gives them, under the heads `# Team Pld W D L For Ag
Pts Form` — a football league table, which is what `cm9900/24.jpg` prints and
what every table in an English newspaper sets.

**One row, one line, every column sortable but the name and the form.**
`league/Columns.tsx` carries the list and `components/league/TableHeads` draws
the strip.

**The phone gets eight of the ten** (5 Sep 2026). `Ag` and `Form` are `hidden
lg:table-cell`, which takes the table from 380px to 310 and puts `Pts` on a 390
screen without a sideways scroll — the rule being that a table whose last column
is what the table is FOR shows it under a thumb, and a many-measure stats board
is the shape that scrolls instead. `For` stays: points-for is a head-to-head
league's tiebreak, so it is a column a reader compares rather than one he audits.
The visibility rides in each column's `width` string, so the heads, the rows and
the loading skeleton all read it from one place.

**And For and Ag are ink, not amber** (Craig, same day). DESIGN §3's amber slot
now reads "a figure standing alone beside a name — never a column of a standings
table". `cm9900/24.jpg` is white throughout with yellow for your own club.

*This section described a TWO-LINE row with a figure-and-its-own-word under the
name, and three columns that no longer exist. All of it went on 31 Aug 2026 when
the table became a football table; the doc was corrected 3 Sep. What follows in
"Known gaps" about `FP`, `Win%` and `GB` went with them and is struck through
there rather than deleted, because a dated record of a removed column is worth
more than a silence.*

**`Form` is the last five rounds, oldest first**, joined in `league/form.ts` from
the season results (one request for all 38) and the pairings `getLeagueInfo`
already carries. The record column is a total: a side on 5-2-3 that won five and
then lost three is not the same team as one that lost three and then won five,
and nothing Fantrax publishes says which. Each letter says which gameweek it was
and what the two totals were.

Two things keep it honest, and both exist because their results table numbers
rounds nobody has played:

- **How many games count is Fantrax's answer.** The run stops at
  `won + drawn + lost`, so a round in play falls outside it on its own — an
  unplayed round reads `0` on that table, not blank, and a run built on "there is
  a number" would hand every side thirty-six goalless draws in March.
- **The letters have to reproduce their record, or there are no letters.** A
  tally that disagrees means the season has been lined up wrongly, and a dash is
  better than five letters that are nearly right.

Colour is the loudness ladder and not a fourth palette: a win is full ink, a draw
is quiet, a loss is the red slot — which DESIGN §3 defines as "a loss, a doubt, a
negative". There is no green because `--color-up` / `--color-down` are still
deferred (§8), and the accent yellow is already spoken for twice on this row.

**The reader's own row takes the raised ground as well as the accent edge.** On
ten near-identical rows a 4px bar at the margin is easy to scroll straight
past, and this is the row a manager opened the page to find. The `You` chip sits
on `bg-bg` for the same reason: a chip the colour of its own ground is not a
chip.

## `/league/team-stats` — the board beside the table

Same shell, different question: not who is winning, but what each side is
actually DOING. The blue foot row picks the group — Attacking · Defensive ·
Keeping · Appearances · Discipline — and **the whole group draws at once**, three or four
categories across the top with every team down the side (Craig, 11 Sep 2026:
*"for each section, we can get all the columns in one go"*).

**One grey toggle at the top, `FPts` · `Total`, and it governs every cell.** The
same category is two numbers — what Fantrax paid for it and the raw figure behind
it — and the board shows one of them at a time. It showed both, as two columns,
while it drew one category; at four categories that is eight columns of
alternating meaning, and a reader compares a column against the one beside it.
Fantasy points is the default, because 1,500 minutes is not better than 1,400
unless those minutes were worth more.

**A third plate, `Squad`, asks a different question** (1 Oct 2026): what the men each
team holds now have done all season, added up off the stats league's counts
(`squadColumns.ts`: goals, assists, shots and key passes; tackles won,
interceptions, clearances and recoveries; saves, penalties saved and goals
conceded in goal; appearances, starts and minutes; cards, own goals and errors
leading to a goal). It fills in the day the draft ends, a week before Fantrax has
scored a lineup, and a quiet `Season to …` line names the file's date.

**The column heads sort**, as `/league`'s do — a link, so the server orders and
the ordering survives being shared. The pressed plate is the only mark of the
sorted column; every figure is ink, because the accent slot means "yours" and the
reader's own row is already using it.

**The arrow is real here and was not before.** Fantasy points always run
high-to-low, but a raw figure runs low-to-high in the categories where topping
the table is bad news — so `Total` on Discipline heads the board with the side on
one yellow card, under a `▲`. `rankBy` in core makes the same call, and never
applies the flag to the points, which Fantrax has already signed.

**Four columns is the ceiling** any group reaches, which is why this board keeps
`w-full` and lets the NAME truncate rather than taking `min-w-max` and a frozen
lead column the way `SquadStatBoard` must. Measured at 390: four 44px figure
columns and no sideways scroll.

The categories are ours, not Fantrax's — their `SEASON_STATS` view publishes each
one twice, split into a goalkeeper block and an outfielder block, and
`mapSeasonStats` adds them back together.

**DefCon is two columns, `DFP` and `DFP3`, and Keeping is its own group** (1 Oct
2026). The real league pays a defender on `Defensive Points` and a midfielder or
forward on `Defensive Points 3`, so their points are two halves of one bonus and
their counts are two different sums; adding them would be neither. Saves, keeper
actions and penalties saved moved to Keeping so Defensive stays at four.

## States

- **Unavailable** — Fantrax not answering, with the tell on screen.
- **Empty table** — a real state, not a fault: our league answers `[]` here every
  day until 10 Oct.

Those two are deliberately distinct.

## Known gaps

~~**No team badges.**~~ Drawn since 22 Aug. The read that was the objection now
lives in `app/badges.ts` and is shared by the schedule, the matchups list and the
head-to-head board, so it is one cache entry for four surfaces rather than a
second read for one page.

~~**The points column is headed `FP`, not `Points`.**~~ **Gone 31 Aug 2026.**
It is `For` now — a league table calls what you scored `For`, and the Fantrax
abbreviation was the last of that vocabulary on the screen. `Pts` is the
league's own points, which is what a reader means by the word.

~~**`Win%` is not a percentage and is not printed as one.**~~ **Column deleted
31 Aug 2026.** A baseball proportion set `.500`, needing a paragraph to explain,
saying less than `W D L` says in three narrower columns.

~~**`GB` is Fantrax's arithmetic and comes off a second read.**~~ **Column
deleted 31 Aug 2026**, and losing it took a second provider read out of `/league`
and out of the edition writer with it. Games back is half a game per win: a
baseball convention, in a sport with draws in it, in a league paying three for a
win. `league/Columns.tsx` records all three removals by name.

~~**`W-D-L` in one cell.**~~ **Split 31 Aug 2026.** Three numbers crushed into
one cell can only ever be sorted by one of the three, and this one silently
sorted by wins under a head that named all three.

**No movement arrows.** A rank a week ago cannot be had: rebuilding last week's
table needs what a win is worth, `getLeagueInfo` does not publish it, and this
app inventing three-a-win is exactly what §3 forbids. Fantrax's own
`goBackDays` was probed on 29 Aug and returned the same table for 1, 3 and 7 —
it does not answer the question either. The form strip is what carries the trend
instead.

**A line marks where the playoffs start**, read off the declared bracket by
`playoffPlaces` rather than written down here: the placeholder's final between 1
and 2 draws it under second, and the day it becomes Fantrax's published top four
it moves on its own. Never under the last row — a line beneath the bottom of a
table announces a cut nobody missed.
