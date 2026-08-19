# `/matchday` — the live centre

The tab is called **Live**, and it only exists while a gameweek is running. The
order is the order a manager cares about: your head-to-head first, the real
football under it.

## On the page

1. **`YourMatchup`** — you on the left, whoever it is on the right. Fantrax's
   home and away mean nothing here (there is no ground) and a manager reads his
   own score first. The live number is the biggest thing on the card. Renders
   **nothing at all** when there is nothing to say — not signed in, not drafted —
   so a reader still gets the football with no empty furniture. Both halves, and
   the link in its header, open the full board ([matchup.md](matchup.md)).
2. **`GameweekView`** — the round's fixtures (see [gameweek.md](gameweek.md)).

Between rounds, the football half is replaced by a panel naming the first kickoff
and FPL's deadline, with an explicit note that ours is the commissioner's and
lives on the League tab.

## The gap this page had

**There was no XI here and no per-player contribution.** On a Saturday at 3pm the
page said you were on 47 points and showed you Arsenal vs Coventry, but never
which of your players did it. That is now one tap away rather than on this page:
`YourMatchup` opens the head-to-head board ([matchup.md](matchup.md)), which
carries both totals and the eleven behind whichever one you are reading.

Whether the board belongs *on* this page rather than behind it is still open. The
argument for is PRODUCT.md's job #1 and one fewer tap; the argument against is
that the live tab also carries the round's real football, and a full pitch plus a
fixture list is a long scroll. `MatchupBoard` is a component, so it is a small
change either way.

Live goals, assists and bonus still cannot be faked without inventing football,
so every state below the layout ones waits on 21 Aug.

## Known gaps

The head-to-head card and the fixture list are two unrelated designs stacked.
