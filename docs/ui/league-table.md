# `/league` — the table

Fantrax computes the standings. **This page never adds anything up.**

Wrapped in `LeagueShell`: page header, then the three-way section nav (Table ·
Schedule · Matchups) that the League tab is divided into. The nav stays on screen
even in the empty states — without it, a reader landing here during an outage has
no way to reach the other two and the section becomes a dead end.

## On the page

Standings rows as Fantrax gives them: rank, team, record, points.

**Rank and points are the two numbers a table is read for**, and both used to be
quieter than the team name — the rank small and faint, the points bold at body
size. They are the figures now, set in the tabular face at either end of the row,
with the record kept small between them. The record decides neither, and Fantrax
gives it as one unparsed string.

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
scored, which is a different number the same word was claiming. The `W-L-T`
beside it is Fantrax's own record string, unparsed.

**A line marks where the playoffs start**, read off the declared bracket by
`playoffPlaces` rather than written down here: the placeholder's final between 1
and 2 draws it under second, and the day it becomes Fantrax's published top four
it moves on its own. Never under the last row — a line beneath the bottom of a
table announces a cut nobody missed.
