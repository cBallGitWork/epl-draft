# `/league/matchups` — this period's head-to-heads

Who each squad plays this period, and what they have scored.

**The score is Fantrax's own.** `getLiveScoringStats` answers without a cookie
and returns typed totals for every team in one call, so this page reports the
competition's real numbers rather than an estimate of them. We compute no
scoring, which was always the doctrine.

## On the page

- A provenance line: "Fantrax's points, under Fantrax's scoring."
- One card per pairing, home over away, each side showing points, players still
  to play, and a green `+n` for clean sheets we can see coming but Fantrax has
  not credited yet — **kept beside their number, never folded into it**.
- Tapping either side opens that pairing's board ([matchup.md](matchup.md)) on
  the name that was tapped. Both sides of a card lead to the same head-to-head;
  each squad is one further tap from there.
- Your own pairing sorts to the top. A neutral list is for broadcasters.
- `AutoRefresh` at the live poll rate while football is on, idle otherwise.

## States

Unavailable · undrafted · no schedule · no pairings this period (a bye week).
Each is a distinct `Nothing`, all inside `LeagueShell` so the section nav
survives.

A team with no number gets a dash, never a nought.

## Known gaps

Sixteen near-identical cards. Nothing distinguishes a close match from a
blowout, or a finished one from one still playing — the board behind each card
now does both, but the list itself still does not.
