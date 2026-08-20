# `/players/[fantraxId]` — one player

One profile per tap, never a sweep of the 697 — that is the whole politeness
policy toward Fantrax.

## On the page

1. **The masthead** — his cut-out at 112px on his club's colour, crest top-left,
   shirt number bottom-right, with name, club, position and number beside it.

   The cut-out stands on the club's colour rather than on nothing. Everywhere
   else it stands on grass and needs no ground ([conventions.md](conventions.md)),
   but there is no pitch here and a transparent cut-out over the page background
   is a head floating in the dark. It is the same colour his 32px mark sits on in
   [the pool](players.md), so the two readings of him agree.

   `PlayerImage` gained a `sizes` prop for it: its default is the width he is
   drawn at on a pitch, and handing an 88px asset to a 112px block would be soft
   in exactly the place a reader is looking hardest.

   **A man FPL has never listed gets no masthead and nothing standing in for
   one** — no code means no photograph, no kit and no crest to draw. That is 120
   of the 688, it is a settled answer rather than a gap, and the heading carries
   him alone exactly as it did for everyone before this.
2. **Availability** — FPL's `news`, `status` and `chanceOfPlaying`. Silent for a
   fit player and for one the bridge has not settled; a "no news" panel on seven
   hundred pages is noise. Fantrax has its own injury notes and we ignore them:
   theirs arrive truncated mid-sentence.
3. **Breakdown** — the categories that earned him points, biggest first, with
   costly ones (cards, goals against) sorting to the bottom where they read as
   the deductions they are. Fantrax's own numbers; they sum to the total exactly
   and no scoring of ours is involved.
4. **In this league** / **Fantrax** / **Across every Fantrax league** / **Player**
   — four fact blocks. The third is deliberately headed that way: those
   percentages are every league on Fantrax and they sit two rows below ours.
5. Links to the squad he is in, and back to the pool.

Each block renders nothing when empty — a heading over no rows is a claim that
something is missing.

## States

"No profile for that player", with the tell on screen. A mistyped id and a
Fantrax outage arrive identically, and the page does not pretend to tell them
apart with a 404.

## Known gaps

Still long and undifferentiated below the masthead: four stacked definition
lists, and nothing decides which of them a reader came for.
