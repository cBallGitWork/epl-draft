# `/players/planner` — the fixture planner

Craig, 24 Sep 2026: a planner that *"takes the team strength from the sister repo, lists their attack 1/20 (green
best fixture, dark red for worse) … next 6 gameweeks, and orders by strength, easiest at top"*, then *"keep the
fixture on one row"*, *"Use a bigger range of colours too"* and *"a ranking section too"*. Designed first
(option A, the mosaic), picked by Craig. His second look, the same day: *"just have an attack and defence and
rankings switcher"*, *"rankings - best at top"*, and remove the rows that explained it.

## On the page

- **Three views, one at a time at every width**, on a 44px strip (`?view=attack|defence|rankings`): **Attack**
  ranks each opponent's DEFENCE (who your forwards face); **Defence** ranks each opponent's ATTACK (who your
  back line faces); **Rankings** is every club's own strength.
- **The board**: every club down, the next six gameweeks with a match left across (`plannerGameweeks`), easiest
  run first. A cell is one fixture: the opponent, its venue `(H)` / `(A)` (under the code on a phone, beside it
  on a desk, Craig 30 Sep 2026) and its rank as an ordinal, `1st` the easiest (Craig, 1 Oct 2026: *"use '1st'
  'th'"*). On a phone the rank shares the venue's line under the code: a 37px cell cannot hold `20th` beside it.
  The ground is the ease ramp (DESIGN §3), two ranks a step.
- **Avg**, last and in cyan (ours): the mean rank of the six. A blank round counts as the hardest; a double
  averages its two; a tie goes to the kinder run soonest.
- **Rankings**: two tables under section bars, "Defences, easiest to attack first" then "Attacks, easiest to
  defend first", side by side on a desk. Every club by its OWN strength at home and away, the weakest first
  (`strengthTable`), so 1 is the easiest to face and a club's rank is the one the boards print against it
  (Craig, 30 Sep 2026: the two had run opposite ways). Same ramp, green the easiest. Ties share a place.
  Every place prints as an ordinal, the index block's too, as the league tables do (`ordinal` in core).
- **A club's name** opens the Players board filtered to that club and the positions the view is about
  (`F,M` for Attack, `D,G` for Defence), respelled for Fantrax (`toFantraxClubCode`).

## Where the numbers come from

The sister repo's Dixon-Coles team strength, exported to `data/intel/strength/26-27.json` keyed on FPL's club
code (`export_team_strength`). 1.0 is league average; a higher defence concedes less. An opponent is rated at
the venue HE plays: a home fixture reads his away defence. No caption or key line explains it any more (Craig
had them removed); `intel-check` reports the file's age.

## States

- **No export, or no fixtures left**: `Nothing`, saying which.
- **An opponent the export lacks**: a quiet cell with a dash, left out of the mean.
- **Fewer than six gameweeks left**: fewer columns.
- **320px**: the board keeps a 344px minimum and scrolls sideways with the club frozen.

## Known gaps

- No double or blank gameweek exists in 26/27's fixtures today, so neither has been seen on the real page;
  both are unit-tested (`strength.test.ts`).
