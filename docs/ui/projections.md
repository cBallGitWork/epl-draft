# `/players/projections` — Projections

Craig, 24 Sep 2026: *"just scaffold this … next 6 gameweeks … could import the current projections"*. Designed
first (option A, the model's table), picked by Craig, and built to his Players-board phone notes: no yellow
caption and no position tile down the left on a phone. His second look, the same day: *"dont use just blue"*,
*"remove 2nd team column"*, *"total first column ahead of weeks. xmins first column before the points"*, and
*"add the other categories like goals/assists"* as *"just a dropdown filter"*.

## On the page

- **Who the sister model tips** over the next six gameweeks: one ranked list, total descending. Each row is the
  Players board's lead (`players/BoardRow`: crest, name, position under it on a phone; CM's tile on a desk),
  then **xMins · Tot · each gameweek**. Figures are ink, lit as the Players board lights a column (orange its
  best, yellow the rest of its top sixth, over the rows shown); xMins is never lit; Tot is bold. The crest is
  the club: no club text.
- **Category** (`?cat=`): All points, or one part of them: Goals, Assists, Clean sheets, Bonus, Saves, Def.
  contributions, Appearance. The weeks and Tot then hold that part's expected FPL points; the export carries
  `parts` per week (`PROJECTION_PARTS` in core).
- **Filters**: All · each league position (Fantrax eligibility), then the category and club selects
  (`QuerySelect`). The URL is the state, through the Players board's own parsers (`playersQuery`, `filterHref`
  with this route).
- **Sort** by any gameweek, the total or the minutes; a week the window has lost falls back to the total.
- **Provenance** under the switch: FPL-scoring projections by the sister model, the window, and the export's
  date. These are never Fantrax points.
- The first hundred, then "Show all".

## States

- **No export, or no fixtures left**: `Nothing`.
- **A filter that empties the board**: says so.
- **A man the pool does not hold**: FPL's name, no tile, no link.
- **320px**: the board scrolls sideways with the name pinned; xMins and Tot sit beside the name at 390.

## Known gaps (left out of the scaffold)

Fantrax-scoring conversion, the per-fixture split, ownership, search, and the low/high band the export carries.
