# `/fpl` — the other game

Most of the league also runs an FPL side at weekends. This is that one tab: your
points, your fifteen, your mini-leagues. **Kept small on purpose** — no history,
no projections. The football layer already models the real competition properly
and this is not a second attempt at it.

## On the page

- Three figures: Overall points, Overall rank, this round. A dash when FPL sends
  null, because nought is a different claim.
- **Gameweek squad** — the fifteen with portraits on club colours, captain and
  vice marked, benched players dimmed, and a points-hit note when there is one.
- **Mini-leagues** with your rank in each.
- "Not your side? Forget it."

Before an entry id is set, the page is just the entry form. A bad id gets a
`Nothing` panel telling the reader where to find the number in their own address
bar.

## The one rule this page carries

**Every number here is FPL's, under FPL's scoring, and the page says so.** The
same footballer is worth different amounts in the two games, and a reader coming
from the adjacent tab has to be told which game they are looking at.

## Known gaps

The squad is a list where every other squad in the app is now a pitch. It is the
one place `PitchFrame` could be reused for free.
