# `/players/planner` — the fixture planner

Craig, 24 Sep 2026: a planner that *"takes the team strength from the sister repo, lists their attack 1/20 (green
best fixture, dark red for worse) … next 6 gameweeks, and orders by strength, easiest at top"*, then *"keep the
fixture on one row"*, *"Use a bigger range of colours too"* and *"a ranking section too"*. Designed first
(option A, the mosaic), picked by Craig.

## On the page

- **Two views**: **Attack** ranks each opponent's DEFENCE (who your forwards face); **Defence** ranks each
  opponent's ATTACK (who your back line faces). A phone switches with a 44px strip (`?view=defence`); the desk
  shows both side by side.
- **The board**: every club down, the next six gameweeks with a match left across (`plannerGameweeks`), easiest
  run first. A cell is one fixture on one line: the opponent and its rank, 1 the kindest. A phone sets a home
  side in capitals and an away side in lower case; the desk writes `(H)` / `(A)`. The ground is the ease ramp
  (DESIGN §3), two ranks a step.
- **Avg**, last and in cyan (ours): the mean rank of the six. A blank round counts as the hardest; a double
  averages its two; a tie goes to the kinder run soonest.
- **The ranking** under each board: every club as an opponent at home and away, weakest first, on the same
  ramp. It is what the cells are made of.
- **A club's name** opens the Players board filtered to that club and the positions the view is about
  (`F,M` for Attack, `D,G` for Defence), respelled for Fantrax (`toFantraxClubCode`).

## Where the numbers come from

The sister repo's Dixon-Coles team strength, exported to `data/intel/strength/26-27.json` keyed on FPL's club
code (`export_team_strength`). 1.0 is league average; a higher defence concedes less. An opponent is rated at
the venue HE plays: a home fixture reads his away defence. The page says so under the switch: the ranks are
ours, with the export's date. `intel-check` reports the file's age.

## States

- **No export, or no fixtures left**: `Nothing`, saying which.
- **An opponent the export lacks**: a quiet cell with a dash, left out of the mean.
- **Fewer than six gameweeks left**: fewer columns.
- **320px**: the board keeps a 344px minimum and scrolls sideways with the club frozen.

## Known gaps

- No double or blank gameweek exists in 26/27's fixtures today, so neither has been seen on the real page;
  both are unit-tested (`strength.test.ts`).
