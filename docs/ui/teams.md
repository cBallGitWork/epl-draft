# `/players/teams` — Team Stats

Craig, 24 Sep 2026: *"we're going to need a team stats section, contains all data for that, cm-ify it"*; and
30 Sep 2026: *"this page should be more pure stats, chances created, shots etc, errors"*. Prem keeps its own
`/prem/team-stats` (one measure at a time); this is every club's football on one board. No fantasy points of
anybody's, and no fixture run: the Planner owns that.

## On the page

One board, twenty clubs, twenty-one measures in five labelled groups over one sortable head strip. The place
and the club are pinned while the figures scroll on a phone; the desk shows everything.

| Group | Heads | Whose, and how |
|---|---|---|
| Attack | G Sh SoT BC xG | Opta's goals, shots, on target, big chances scored or missed; FPL's squad xG |
| Chances | A KP BCC xA | Opta's assists, key passes (passes that led to a shot), big chances created; FPL's squad xA |
| Defence | GC xGC CS ShA Tk Int Blk | Opta's conceded, clean sheets, shots conceded, tackles, interceptions, blocks; FPL's squad xGC over eleven |
| Errors | ErS ErG | Opta's errors leading to a shot, and to a goal |
| Discipline | Fls YC RC | Opta's fouls committed, yellow and red cards |

Each head carries its meaning in a `title`; the phone has the shared Key under the board. Standouts are lit
in ink over the twenty (a fifth yellow, a tenth orange); where more is worse (GC xGC ShA ErS ErG Fls YC RC)
the top of the column is red. A played nought is white. Sort is a link (`?sort=&dir=`); goals descending by
default, a column opens at its good end, ties fall to the name. A club opens the Players board at that club.

## States

- **The Premier League refuses**: every Opta column is a dash; FPL's expected three still draw.
- **FPL files nobody at a club**: its expected three are a dash.
