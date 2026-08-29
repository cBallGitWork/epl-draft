# `/league/matchups` — this period's head-to-heads

Who each squad plays this period, and what they have scored.

**The score is Fantrax's own.** `getLiveScoringStats` answers without a cookie
and returns typed totals for every team in one call, so this page reports the
competition's real numbers rather than an estimate of them. We compute no
scoring, which was always the doctrine.

## On the page

- A provenance line: "Fantrax's points, under Fantrax's scoring."
- **One card per pairing, and each card is one scoreline row** — name, score,
  `v`, score, name, the same grammar as the board behind it. It was two stacked
  rows, which made a reader compare two numbers in different places on the
  screen, eight times over. Adjacent numbers make close-vs-blowout read straight
  off the margin, with **no invented threshold** deciding what counts as close.
- **The trailing side's number dims**, the leader's stays full ink, and only
  when both sides have a number — a dash dims nobody. Only the *number*: accent
  means "yours" on six screens and would stop meaning it if a name could also
  dim for losing. Never accent for the leader, for the same reason.
- **A labelled second line** for what a scoreline may not carry: each side's
  players still to play, and a green `+n` for clean sheets we can see coming but
  Fantrax has not credited yet — **kept beside their number, never folded into
  it**. A side on a literal zero reads `all played`, but only while football is
  actually on: on a Wednesday everybody has nobody left, and sixteen "all
  played" labels state the obvious.
- **The round's state in the sub-heading** — LIVE dot and word, "Full time", or
  "Final", from `roundFinished` ([matchup.md](matchup.md#what-the-round-is-doing)
  has the ladder). Second occurrence of that reading, so it is copied rather
  than extracted; a third caller earns a shared component.
- Tapping either side opens that pairing's board ([matchup.md](matchup.md)) on
  the name that was tapped. Both sides of a card lead to the same head-to-head;
  each squad is one further tap from there.
- Your own pairing sorts to the top. A neutral list is for broadcasters.
- Refreshes at the live poll rate while football is on, idle otherwise — from
  the shell's single `AutoRefresh`, not one of its own.

## States

Unavailable · undrafted · no schedule · no pairings this period (a bye week).
Each is a distinct `Nothing`, all inside `LeagueShell` so the section nav
survives.

A team with no number gets a dash, never a nought.

## Known gaps

Finished pairings are not sorted below live ones. Deliberately deferred: judge
it against a real Saturday, when there is something to sort.
