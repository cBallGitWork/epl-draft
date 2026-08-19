# `/league/schedule` — the season's head-to-heads

All 38 periods, who plays whom, from Fantrax's own description of the
competition. **We never generate a fixture list** — who plays whom is a
commissioner setting like everything else in the league layer.

Same `LeagueShell` frame as the table.

## On the page

Period by period, each pairing as a row, with the gameweek(s) each period covers.
The period↔gameweek alignment comes from `periodGameweeks()`, which is handed the
season's kickoffs as plain data — this is the second seam between the football
and league layers, and it runs one way only.

## States

Unavailable (Fantrax silent), and a league whose schedule is empty.

## Known gaps

38 periods is a long scroll with no way to jump to the current one.
