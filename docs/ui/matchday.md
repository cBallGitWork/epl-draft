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
   `15:00 · Gabriel, Saka` / `17:30 · Isak`, with a live group showing the clock
   instead of the time. The card above says where you are; this says what is
   left to change it. Reserves are excluded because they do not score, and
   reading your own lineup withholds nothing from anybody — it is yours all
   week. Absent for a signed-out reader, and it renders nothing at all.
3. **`GameweekView`** — the round's fixtures (see [gameweek.md](gameweek.md)),
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
