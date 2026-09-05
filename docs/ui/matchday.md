# `/matchday` — the live centre

The tab is called **Live**, and it only exists while a gameweek is running. The
order is the order a manager cares about: your head-to-head first, the real
football under it.

## On the page

1. **`YourMatchup`** — **one scoreline row**: your name at the left edge in
   accent, the two totals meeting either side of the `v`, the trailing number
   dimmed. Fantrax's home and away mean nothing here (there is no ground) and a
   manager reads his own score first. The live number is the biggest thing on
   the page. Beneath it, one labelled line — each side's players still to play,
   the uncredited `+n`, and the round's state between them, because that word
   belongs to neither side.

   It was two stacked halves, which is a different design for the same fact one
   tap from the board that already reads it correctly. All three head-to-head
   surfaces now share one grammar: this, [the list](league-matchups.md) and
   [the board](matchup.md).

   Renders **nothing at all** when there is nothing to say — not signed in, not
   drafted — so a reader still gets the football with no empty furniture. Both
   halves, and the link in its header, open the full board.
2. **`Afternoon`** — your **active** players still to come, grouped by kickoff:
   `Sat 15:00 · Gabriel, Saka` / `Sun 14:00 · Isak`, with a live group showing
   the clock instead of the time. The card above says where you are; this says
   what is left to change it. Reserves are excluded because they do not score,
   and reading your own lineup withholds nothing from anybody — it is yours all
   week. Absent for a signed-out reader, and it renders nothing at all.

   **The day is printed, and "afternoon" is the name rather than the scope.**
   These examples used to be `15:00` and `17:30`, which is what a round looks
   like if you only ever picture a Saturday. GW1 ran Friday night to Monday
   night and the strip read `15:00` above `14:00` — right, because one was
   Saturday and the other Sunday, and unreadable, because it said neither.
3. **`Wire`** — Sky's teleprinter, with the ownership on it. Craig, 5 Sep 2026,
   with a still of Soccer Saturday: *"the wire should mock Gillette Soccer
   Saturday a little like this. Have the minute in brackets rather than the blue
   tab. Wire should also include half and full time."* Sky runs `GOAL   LEEDS 1
   BRISTOL CITY 0   LUKE AYLING (16)`; ours keeps the word and the man, puts the
   minute in brackets after his name, and spends the middle of the row on the
   sentence no score centre in the world prints — the manager who holds him.

   **The minute left CM's blue index block for those brackets.** The block was a
   royal-blue plate down the left of every row restating a number that belongs to
   the name beside it, and it was the loudest object on the panel. A wire is read
   down the names.

   **`HT` and `FT` rows carry the scoreline**, interleaved by wall clock like
   everything else, because `HALF TIME` between the goals is what tells a reader
   the 2-1 he is looking at is not going to move. They are `text-muted` and
   deliberately neither the accent (which means "yours" on this very panel) nor
   `--color-live` (which means a match in PLAY, and these have stopped).

   Both come off the SAME cached round read as the goals — one upstream request
   for ten matches. The full-time score is the fixture's own; **the half-time
   score is derived**, because the Premier League publishes `halfTimeScore` on its
   per-fixture detail read and not on the round one (0 of 10, counted 5 Sep 2026),
   and the alternative is ten more requests on the screen sixteen phones poll
   every thirty seconds. It is counted off the goals already on the wire, by the
   football minute — a goal at `45+3` parses to 45 — with an own goal credited to
   the side its scorer does not play for. `matchday/wireLines.test.ts` is that
   arithmetic.
4. **`GameweekView`** — the round's fixtures (see [gameweek.md](gameweek.md)),
   now with **your players marked and every scorer tagged with the squad holding
   him**. The two halves of the page finally share both grammars: the scoreline,
   and the accent mark that means "yours".

Between rounds, the football half is replaced by a panel naming the first kickoff
and FPL's deadline, with an explicit note that ours is the commissioner's and
lives on the League tab.

## The gap this page had

**There was no XI here and no per-player contribution.** On a Saturday at 3pm the
page said you were on 47 points and showed you Arsenal vs Coventry, but never
which of your players did it. That is now one tap away rather than on this page:
`YourMatchup` opens the head-to-head board ([matchup.md](matchup.md)), which
carries both totals and the eleven behind whichever one you are reading.

**Decided on design argument, to be re-asked with Saturday's answer: the board
stays one tap behind (Option A).** The argument for putting it here is
PRODUCT.md's job #1 and one fewer tap; the argument against is that this tab
also carries the round's real football, and a full pitch plus a fixture list is
a long scroll — while the board's own premise is that it fits a 390×844 phone,
which it cannot do stacked under anything. So `YourMatchup` speaks the board's
grammar and the board keeps its size.

The instrument for re-asking is the league chat on the first live Saturday: do
managers tap through, or do they sit on this page? `MatchupBoard` is a
component, so it is a small change either way.

Live goals, assists and bonus still cannot be faked without inventing football,
so every state below the layout ones waits on 21 Aug.

## Known gaps

- Real scroll length is unmeasured — three panels now, and only a live Saturday
  says whether the afternoon strip earns its place above the football.
- A group of simultaneous kickoffs carries one clock, the highest minute in the
  group. The strip is a glance, not a stopwatch.
