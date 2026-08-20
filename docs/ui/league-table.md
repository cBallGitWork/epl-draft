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

**No team badges.** Sixteen names and nothing to tell them apart at a glance —
`TeamBadge` exists and the schedule already draws it, but wiring it here adds a
provider read to a page that makes one, so it is a data-flow change rather than
part of a visual pass.
