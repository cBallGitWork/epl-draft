# `/matchday` — the live centre

The tab is called **Live**, and it only exists while a gameweek is running. The
order is the order a manager cares about: your head-to-head first, the real
football under it.

## On the page

1. **`YourMatchup`** — you on the left, whoever it is on the right. Fantrax's
   home and away mean nothing here (there is no ground) and a manager reads his
   own score first. The live number is the biggest thing on the card. Renders
   **nothing at all** when there is nothing to say — not signed in, not drafted —
   so a reader still gets the football with no empty furniture.
2. **`GameweekView`** — the round's fixtures (see [gameweek.md](gameweek.md)).

Between rounds, the football half is replaced by a panel naming the first kickoff
and FPL's deadline, with an explicit note that ours is the commissioner's and
lives on the League tab.

## The gap this page still has

**There is no XI here and no per-player contribution.** On a Saturday at 3pm the
page says you are on 47 points and shows you Arsenal vs Coventry, but never which
of your players did it. Your players exist only on `/squad/[teamId]`. Against
PRODUCT.md's job #1 — "what is my score doing right now" — that is the biggest
outstanding hole in the app.

Two things gate building it, and only one is a clock: the layout states can be
reached with an injected `now`, but live goals, assists and bonus cannot be
faked without inventing football.

## Known gaps

Beyond the above: the head-to-head card and the fixture list are two unrelated
designs stacked.
