# `/players/compare` — two men, side by side

Scout's second view. Craig, 6 Sep 2026: *"we need the player comparison tool too
— I attached the scout page a while back. Would need tables and probably a pitch
(which would plot the end points such as heat map/shot map etc)"*. The reference
is Fantasy Football Scout's Player Maps.

**Two profile reads and never more.** `subject()` is one live, uncached
`getPlayerProfile` each, and Fantrax throttles that endpoint at about
twenty-seven calls — `player.md` states the policy as "one profile per tap, never
a sweep of the 697". Two per view is inside it; a board of them never would be,
which is why comparison is a ROUTE you arrive at with two ids rather than a
column on the directory.

## On the page

1. **The bar**, split, each half on that man's club colour. `MatchBar`'s shape
   rather than `PlateShell`'s, which holds one plate and whose docblock
   pre-refuses a config object for a second. Copied rather than extracted: two is
   a coincidence (CODE_RULES §1), and the third occurrence is what will say what
   varies.
2. **The pitch** — where each of them plays.
3. **The attributes**, mirrored: figure · label · figure.
4. **Change either man**, which sends you back to the board as a picker, and
   **swap sides**, which answers the one thing a mirrored table cannot — which
   side you are reading.

## The pitch

**Points only, colour-coded, with a key** (Craig, 6 Sep 2026: *"points only, no
names / colour code with a key for the two different players"*). Names rode on
the turf for one build and collided the moment two roles were close.

- **Each man gets his own HALF, attacking his own goal.** The reference's caption
  is the instruction — "compare two players in opposing directions, with each
  standalone map normalised from defence on the left to attack on the right" —
  and its picture puts one man's marks at the left goal and the other's at the
  right. Overlaying them mirrored was the first build and it was unreadable: a
  defender mirrored onto the far end lands exactly where the other man's
  attacking midfielder stands. Halving the axis cannot collide.
- **His club's colour, and a shape as well.** The bar above is already each man
  on his club's plate, so the key confirms what the reader has just been told
  rather than teaching a new code. Two clubs can be near-identical reds, so the
  first man is a circle and the second a diamond — PRODUCT.md's rule that a
  colour signal is always paired with a label, shape or position.
- **Not `.pitch`.** That class is the squad and head-to-head pitch's frame and
  `pitch.css` gives it a PORTRAIT aspect ratio, so a landscape map inside it sat
  in a portrait box with 284px of dead grass under it, measured. It was borrowed
  for colour tokens that turn out to be global.

### One point each, and why there are not more

**FPL publishes no location at all**, the Premier League's own feed is per-team,
and the sister repo's SofaScore events are staged and **not exported**. So the
pitch plots the one locational fact we hold: the sister repo's weighted role,
which is already the cyan line on the player screen.

A scatter of invented points would look exactly like a real one, which is the
confident wrong answer PRODUCT.md's fourth principle exists to forbid.

**The map filter Craig asked for is therefore not built** — *"filter for the
different stats (shots/recoveries etc)"* — because a control offering maps with
nothing behind them is worse than no control. `docs/providers/intel-export.md`
was widened from `shots` to `events` with a `kind` for exactly this, and the
picker is to be built from the kinds the file actually carries rather than from a
list of its own: a kind the exporter stops emitting then removes itself from the
control, and a new one appears without an app change.

## The attributes

**Rows align by NAME, never by index.** A keeper's grid drops the seven measures
about scoring and creating in open play and an outfielder's drops Handling and
Reflexes (`football/attributes.ts`), so zipping two arrays position by position
would print a keeper's Reflexes against a striker's Finishing under whichever
label came first. A measure only one of them has is still a row with a dash
opposite — a real answer about a keeper beside a forward, where dropping it would
silently shorten the grid.

**The better of the two is the LOUDER**, which is `player.md`'s rule for the
single grid carried over unchanged: a step down in loudness rather than a second
hue. `--color-mid` for the better, ink for a tie, `--color-muted` for the weaker.
Red is refused there and refused here — `--color-bad` means *a loss, a doubt, a
negative*, and a player is not a fault for being the weaker of two.

A missing rating is quieter still and is **not** a loss: he has not played the
ninety minutes the rate needs, which is a different statement from being worse
at it.

## States

- **Nothing chosen yet** — an ordinary state, not an error. The way in is a
  player's own screen, so it says which two taps get you here.
- **Fantrax refused for one of them.** A profile is one live read each and
  nothing is cached for it, so there is no older answer to show instead.
- **A man the bridge has never settled** has no football half: no portrait, no
  attributes, and the grid draws whatever the other man has with dashes opposite.

## Known gaps

- **The map filter**, above — blocked on the export, contract written.
- **No season row and no fixture run.** The screen compares what the men ARE;
  what they have DONE is the Data tab on each of their own pages, and a total in
  two places is a reader checking whether they agree.
