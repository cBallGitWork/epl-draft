# `/league` — the table

Fantrax computes the standings. **This page never adds anything up.**

Wrapped in `LeagueShell`: page header, then the three-way section nav (Table ·
Schedule · Matchups) that the League tab is divided into. The nav stays on screen
even in the empty states — without it, a reader landing here during an outage has
no way to reach the other two and the section becomes a dead end.

## On the page

Standings rows as Fantrax gives them: rank, team, record, points. The reader's
own row carries the accent border.

## States

- **Unavailable** — Fantrax not answering, with the tell on screen.
- **Empty table** — a real state, not a fault: our league answers `[]` here every
  day until 10 Oct.

Those two are deliberately distinct.

## Known gaps

A plain table on a phone. Rank, record and points compete for the same row and
nothing is emphasised.
