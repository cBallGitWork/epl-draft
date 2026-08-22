# `/fpl` — the other game

Most of the league also runs an FPL side at weekends. This is that one tab: your
points, your fifteen, your mini-leagues. **Kept small on purpose** — no history,
no projections. The football layer already models the real competition properly
and this is not a second attempt at it.

## On the page

- Three figures: Overall points, Overall rank, this round. A dash when FPL sends
  null, because nought is a different claim.
- **Gameweek squad** — the **XI, then the bench under a rule of its own**, with
  portraits on club colours, captain and vice marked, benched players dimmed,
  and a points-hit note when there is one. The bench heading totals what was
  left on it: "did my bench outscore my side" is the question a benched
  hat-trick provokes, and a flat fifteen made a reader count.

  The split rests on `FplPick.slot` — FPL's own 1–15 ordering, named `slot` and
  not `position` because `position` in this codebase means the letter a league
  files a player under, and this is neither that nor a place on a pitch.
- **Mini-leagues** with your rank in each.
- "Not your side? Forget it."

Before an entry id is set, the page is just the entry form. A bad id gets a
`Nothing` panel telling the reader where to find the number in their own address
bar.

## The one rule this page carries

**Every number here is FPL's, under FPL's scoring, and the page says so.** The
same footballer is worth different amounts in the two games, and a reader coming
from the adjacent tab has to be told which game they are looking at.

## The pitch, and what it cost to get one

Built 22 Aug, exactly as the gap below it described.

A pitch needs positional lines, and the football layer deliberately carries no
position: `element_type` is FPL's own fantasy classification, not a fact about a
footballer, which is precisely why it was taken out (CLAUDE.md). So the FPL pitch
takes FPL's classification from **this** layer — `fpl-entry`, the FPL league
layer and the correct home for it — as `FplPick.line`, read by `fetchEntryLines`
on the same reasoning `fetchEntryPoints` already gave for `total_points`.

`fplLineup` arranges the XI back to front, pure and tested — including three at
the back with no forwards, and a pick FPL gave no line to, who stands in a row of
his own with the raw number for a label rather than disappearing from a fifteen.
`PitchRows` is shared with our own league's three pitches, which is what made the
ground free. `PitchPlayer` is not: it takes a Fantrax roster slot joined to a
footballer, and a pick is neither, so the sticker is a copy — second occurrence,
and the two genuinely differ, because only this one has an armband and only the
other has a fixture chip.

**The bench stays a list.** Four men in the order they would come on is an
ordering, not a shape, and standing them on grass would claim a formation nobody
picked.

## Known gaps

That is a data change rather than a rendering one, and "keep the tab small"
(Craig, 6 Aug) says it needs a reason beyond symmetry with the other squads.
Recorded here with the shape it would take, so whoever picks it up does not
rediscover why the obvious route is closed.
