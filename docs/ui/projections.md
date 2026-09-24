# `/players/projections` — Projections

Craig, 24 Sep 2026: *"just scaffold this … next 6 gameweeks … could import the current projections"*. Designed
first (option A, the model's table), picked by Craig, and built to his Players-board phone notes: no yellow
caption and no position tile down the left on a phone.

## On the page

- **Who the sister model tips** over the next six gameweeks: one ranked list, total descending. Each row is the
  crest and name (FPL's short name on a phone, the pool's full name on a desk), then a projected figure per
  gameweek, the total, and on the desk the minutes the model expects. Every figure is cyan (ours); the total is
  bold. A phone carries the Fantrax position and club on the name's second line; the desk adds CM's tile.
- **Filters**: All · each league position (Fantrax eligibility) · a club select. The URL is the state, through
  the Players board's own parsers (`playersQuery`, `filterHref` with this route).
- **Sort** by any gameweek, the total or the minutes; a week the window has lost falls back to the total.
- **Provenance** under the switch: FPL-scoring projections by the sister model, the window, and the export's
  date. These are never Fantrax points.
- The first hundred, then "Show all".

## States

- **No export, or no fixtures left**: `Nothing`.
- **A filter that empties the board**: says so.
- **A man the pool does not hold**: FPL's name, no tile, no link.
- **320px**: the board scrolls sideways with the name pinned; at 390 it fits with nothing hidden but the minutes.

## Known gaps (left out of the scaffold)

Fantrax-scoring conversion, the per-fixture split, ownership, search, and the low/high band the export carries.
