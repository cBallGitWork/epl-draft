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

## Known gaps

**The squad is a list where every other squad in the app is a pitch — and
`PitchFrame` is not free here, which the roadmap had wrong.**

A pitch needs positional lines, and the football layer deliberately does not
carry a position: `element_type` is FPL's own fantasy classification, not a fact
about a footballer, which is exactly why it was taken out (CLAUDE.md). So an FPL
pitch needs FPL's classification carried by **this** layer — `fpl-entry`, which
is the FPL league layer and the correct home for it — read from the bootstrap
and mapped onto `FplPick`.

That is a data change rather than a rendering one, and "keep the tab small"
(Craig, 6 Aug) says it needs a reason beyond symmetry with the other squads.
Recorded here with the shape it would take, so whoever picks it up does not
rediscover why the obvious route is closed.
