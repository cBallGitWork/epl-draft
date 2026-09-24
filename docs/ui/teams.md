# `/players/teams` — Team Stats

Craig, 24 Sep 2026: *"we're going to need a team stats section, contains all data for that, cm-ify it"*.
Designed first (option A, one board), picked by Craig. Prem keeps its own `/prem/team-stats` (football, one
measure at a time); this is a real club seen by a fantasy manager: whose players score, whose defence holds,
whose run is kind.

## On the page

One board, twenty clubs, thirteen measures in five labelled groups over one sortable head strip. The place
and the club are pinned while the figures scroll on a phone; the desk shows everything.

| Group | Heads | Whose, and how |
|---|---|---|
| Points | FPts, FA | Fantrax's points, every man at the club; FA is the part nobody in the league owns |
| Run | Attack, Defence | **ours**: the next six opponents' mean ease rank from the planner, 1 the kindest, cyan, never lit |
| Points by position | GK DEF MID FWD | Fantrax's points by the position Fantrax lists, each man once |
| Keepers | CS, GA | Fantrax's keeper lines, summed |
| FPL expected | xG, xA, xGC | FPL's squad figures; xGC divided by eleven, per team rather than per man |

No key line explains the run (Craig had it removed, 24 Sep 2026); the head's title does. Standouts are lit in ink over the twenty (a fifth yellow, a tenth orange, red at the bad end: GA and xGC).
Sort is a link (`?sort=&dir=`); FPts descending by default, the run, GA and xGC open ascending, ties fall to
points then name. A club opens the Players board at that club.

FPL's goals, assists and clean sheets never appear here beside a Fantrax figure (DESIGN §7).

## States

- **Fantrax refused**: its columns print a dash under a note; the run and FPL's figures still draw.
- **No strength export**: the run is a dash.
- **Undrafted league**: FA equals FPts, which is true.
