# `/league/matchups/[teamId]` — one head-to-head, at full size

The Saturday screen. The scoreline, and the eleven behind whichever half of it
you are looking at.

The team in the URL is the side the board **opens on**, so tapping a name
anywhere in the app arrives on that name's team. Which side Fantrax calls home
is not used for anything: there is no ground.

## On the page

1. **One scoreline row** — `123 · 59.1 · v · 63.2 · test3`, read the way a score
   is said out loud. Names at the outside edges, both numbers meeting in the
   middle either side of the `v`. Each half is the control that opens that
   side's team below; the open half is raised and carries a foot bar. Your own
   name reads in accent, the standard "this is yours" mark. **One number per
   side and nothing beside it** — see the constraint below.
2. **Pitch / List**, with a **LIVE** dot opposite while football is on.
3. **The open side's team** (`TeamSheet`) — the eleven on the grass and the
   bench in a strip under it, or the same squad as rows (`SquadRows`, shared
   with the squad board). Every player is a button.
4. **A live player card** (`LivePlayerCard`) over the top, when one is tapped.

## The two providers

The scoreline is `getLiveScoringStats` — Fantrax's own totals under Fantrax's own
scoring, which we never recompute.

Everything under a player is **two sources joined**: his fantasy points for this
period come from `getTeamRosterInfo`, which is public and **honours `period`**
(probed live 19 Aug: `displayedPeriod` echoes, and `periodOppnentTeamIds` changes
with it), so the board prices the week on screen rather than whatever week
Fantrax is currently pointing at. What he *did* — goals, assists, clean sheet,
minutes — is **FPL's**, joined through the identity bridge.

If Fantrax refuses the points table for a side, that side's players fall back to
their **minutes**, told apart by the apostrophe on them. One table either arrives
or it does not, so a side never mixes the two.

## What a tap answers

`LivePlayerCard` — a second card, distinct from the squad screen's `PlayerCard`,
because they answer different questions on different days. `PlayerCard` is "who
is this, and is he fit", read midweek. This one is read at ten past four, and the
only question is *why* he is on the number he is on.

- **An itemised points table**, one row per scoring category that moved his
  total, largest contribution first, deductions in red at the bottom, and the
  total under them. Every figure is **Fantrax's**, under our league's own
  scoring, read from the same `getTeamRosterInfo` call the pitch already made:
  the FPTS view renders each category as the points it contributed and they sum
  to the total exactly. Nothing is computed here — our own engine could only ever
  have approximated the five categories FPL does not publish, and would have had
  to caveat every line.
- Categories that scored him nothing are dropped, and so is games played, which
  in this view renders as 0 because a count of appearances is not a score.
- The category label carries **Fantrax's own definition** behind it (`title`),
  which is where the league's rules are published — what counts as a clean sheet
  is their sentence, not ours.
- **A separate line for FPL's record** — his minutes, goals, clean sheet — and it
  says FPL, because that is a different provider answering a different question.
- **Before he kicks off** there is no table: the fixture panel says when, and an
  empty breakdown under a live score would read as a score of nought.
- The three states of `points` are three different sentences: no table at all is
  Fantrax refusing and says so, a table that does not name him is a dash, and a
  table that gives him a nought is a real nought.

## The points band

The bottom band of a player on the grass, and the loudest thing on the card
after his face.

- **Once he has played it flips dark** — near-black ground, cream numerals, his
  chips beside them. It used to be a small number on the same cream as his name,
  which made the one figure a manager came for the smallest thing on the screen.
- **Until he plays it is his fixture**, at full FDR colour and full strength.
- **Not-played is said by the photograph alone** — dimmed and lightly
  desaturated. The whole card used to dim, which took the fixture colour and the
  name with it: the two things a waiting player still needs.
- Both states are the same fixed height, because a line whose cards stand at
  different heights stops reading as a line.

## Who is still to play

Nowhere as a number. Everyone who has not kicked off is **drawn back**, and his
strip carries his fixture instead of a score. That names them rather than
counting them, which is the question a manager is actually asking at 4pm.

## States

- **Both sides open** — the live case, and the ordinary one once a period starts.
- **One side gated** — the ordinary case all week. A rival's eleven is not public
  until his period opens, so his half shows one sentence and a link to his squad
  page (which explains the reason properly). Your own is never gated.
- **No pairing** — a bye, or a schedule that has not reached its first
  head-to-head. A `Nothing` panel inside the league shell.
- **Scoreboard refused** — both totals read as dashes. The elevens are unaffected.
- **No such team** — 404. Fantrax silent, or no schedule at all — back to
  `/league/matchups`, which describes both.

## Constraints

- **Accent means "your team" and nothing else.** The leader is deliberately not
  accent-tinted; whoever is ahead reads at full strength and the side behind is
  dimmed. A second meaning for accent breaks a reading aid five other screens
  depend on.
- **One number per side.** Pending clean sheets used to ride beside the total as
  a green `+n`. It is gone from here: a scoreline is the one place a reader
  expects a single figure, and a second one next to it — ours, provisional, in a
  colour that means something else on this very screen — asked him to do
  arithmetic Fantrax will do for him within the hour. `pendingByTeam` stays and
  the matchups list and `/matchday` still show it, where a card has room to
  label it.
- **A dash is not a nought.** A side Fantrax has no total for gets a dash, and
  nobody is "behind" while a total is missing.
- The whole board — scoreline, controls, eleven and bench — fits a 390×844 phone
  without scrolling. Keep it that way.

## Known gaps

- The list does not separate the eleven from the bench; it groups by position and
  answers "who has he got". The pitch is where the arrangement lives.
- Nothing distinguishes a finished head-to-head from one still being played,
  beyond the LIVE dot.
- The two elevens can only be compared by switching halves. Whether that is worth
  fixing on a phone is an open question — the alternative is thirty players.
