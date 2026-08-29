# `/league` — the table

Fantrax computes the standings. **This page never adds anything up.**

Wrapped in `LeagueShell`: page header, then the three-way section nav (Table ·
Schedule · Matchups) that the League tab is divided into. The nav stays on screen
even in the empty states — without it, a reader landing here during an outage has
no way to reach the other two and the section becomes a dead end.

## On the page

Standings rows as Fantrax gives them: rank, team, record, games back, the win
fraction, fantasy points scored, and the league's points.

**The row is two lines, and the arithmetic decided it.** A phone gives the row
about 342px inside its padding, and those columns come to 286 of it before a
single letter of a team name — to more than all of it on the one row that also
carries the `You` chip. So the name keeps the first line and the figures take
their own. Nothing is dropped at a small width to make it fit: that is the rule
`/players` set (DESIGN §9), and this league is read on phones.

**Rank and points are the two numbers a table is read for**, and both used to be
quieter than the team name — the rank small and faint, the points bold at body
size. They are the figures now, set in the tabular face at either end of the line
the name is on. Everything on the second line decides neither.

**Every figure on that second line carries its own word**, because there are no
column heads over it to do the job. `Columns` heads the first line only — a head
over a figure that is not under it is worse than no head at all.

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
sixteen near-identical rows a 4px bar at the margin is easy to scroll straight
past, and this is the row a manager opened the page to find. The `You` chip sits
on `bg-bg` for the same reason: a chip the colour of its own ground is not a
chip.

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

**The points column is headed `FP`, not `Points`.** In a league table "points"
means the standings — three for a win — and this column is Fantrax points
scored, which is a different number the same word was claiming. The `W-D-L`
beside it is Fantrax's own record, in their own column order.

**`Win%` is not a percentage and is not printed as one.** Fantrax's `winpc` is a
fraction — literally `1` for a side that has won its only match — set
baseball-style as `1.000` / `.500` / `.000`, which is how it is printed here.
A `1%` beside the leader would put the table's best row last.

**`GB` is Fantrax's arithmetic and comes off a second read.** It is the one
column their standings PAGE does not carry, so `/league` also reads the fxea
array for it. That read failing costs the column and nothing else: it dashes,
because a team Fantrax has no number for is not a team level with the leader.
Half a game per win is a convention rather than a fact, and this league pays
three for a win in a sport with draws in it, so it is read and never worked out
here.

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
