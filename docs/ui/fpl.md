# `/fpl` — the other game

Most of the league also runs an FPL side at weekends. This is that one tab: your
points, your fifteen, your mini-leagues. **Kept small on purpose** — no history,
no projections. The football layer already models the real competition properly
and this is not a second attempt at it.

## On the page

- **Two figures: this week's points, and the overall rank.** A dash when FPL
  sends null, because nought is a different claim.

  It was three, and the third was wrong twice over (Craig, 5 Sep 2026: *"round -
  0 still, just remove that box"*, *"remove overall points score, just use
  weekly"*). The Round box preferred `squad.total` — FPL's own STORED round total,
  which lags its live one — so at 19:44 on 5 Sep it printed **3** while the eleven
  on the grass under it summed to 27. A figure the pitch six pixels below
  contradicts is worse than no figure. The weekly number now leads, off
  `summary_event_points`, the same read the rank comes from; the season total goes
  because this tab answers "how did I do this week" and the pitch under it is a
  week.
- **Gameweek squad** — the **XI on the grass and the bench as kits in a strip under
  it**, numbered in the order FPL would bring them on (Craig, 25 Sep 2026: "pitch view
  still too big on desktop and mobile, make much smaller and show bench"), captain and
  vice marked, and a points-hit note when there is one. `.pitch-fpl` keeps 28rem of the
  screen off the grass, so the XI and the bench share one screen: about 430px wide on a
  1440 desk, beside the mini-leagues, and full width but 392px tall at 390x844. A line
  under the strip totals what the bench left: "did my bench outscore my side" is the
  question a benched hat-trick provokes.

  The split rests on `FplPick.slot` — FPL's own 1–15 ordering, named `slot` and
  not `position` because `position` in this codebase means the letter a league
  files a player under, and this is neither that nor a place on a pitch.
- **Mini-leagues** with your rank in each, beside the round on a desk.
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
layer and the correct home for it — as `FplPick.line`, which FPL puts on the pick
itself. The round's points come from the football layer's `gameweekLive`, summed
per element by `fplPointsByElement` (23 Sep 2026).

`fplLineup` arranges the XI back to front, pure and tested — including three at
the back with no forwards, and a pick FPL gave no line to, who stands in a row of
his own with the raw number for a label rather than disappearing from a fifteen.
`PitchRows` is shared with our own league's pitches, and **so is the ground and
the cell now** (Craig, 5 Sep 2026: *"using the wrong pitch, we use a different
pitch elsewhere"*). This tab passed neither `flat` nor `inColumn`, so it fell
through to `PitchFrame` — the photographed trapezoid nothing else uses — and drew
a `Sticker` of its own beside it.

The copy was justified on the grounds that `PitchPlayer` "takes a Fantrax roster
slot joined to a footballer, and a pick is neither". That stopped being true on
3 Sep, when the disc was changed to take a plain `FootballPlayer` for exactly this
reason. So the sticker is gone and `PitchMarker` draws the picks. The armband is the
one thing the disc has no place for — our league has no captain — and it is drawn
by this tab's own wrapper rather than by a prop with one caller.

**The pitch is bounded by the fold.** `.pitch`'s ratio turns any width into a
height, and this is a pitch with no second column beside it: full-bleed it came
out 1,132 wide and 1,192 tall at 1440, **552px past the fold**, 622 of that empty
grass beyond the far line. (That reading is August's, when the keeper stood at the
foot; the side kicks the other way since 10 Sep 2026 and the empty end is the one
it is attacking.) `--pitch-ratio` on `:root` is the same number the
aspect-ratio uses, so the cap and the shape cannot disagree at a breakpoint, and
`.pitch-fpl` carries this page's own chrome budget. `tools/ui/pitchfit.mjs` walks
`/fpl` now — its not doing so is why the overflow shipped unmeasured.

**The bench stays a list.** Four men in the order they would come on is an
ordering, not a shape, and standing them on grass would claim a formation nobody
picked.

## Known gaps

That is a data change rather than a rendering one, and "keep the tab small"
(Craig, 6 Aug) says it needs a reason beyond symmetry with the other squads.
Recorded here with the shape it would take, so whoever picks it up does not
rediscover why the obvious route is closed.
