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
2. **A four-plate blue tab strip** — `Lineups · Stats · Fixtures · Table`, each a link
   (`?view=`, Lineups the default; `views.ts`), so a refresh or a shared link keeps
   the tab. One word per label: the strip has to fit 390.
3. **Lineups** — the open side's eleven on the grass and its bench in a strip
   under it (`TeamSheet`, `mode="pitch"`). Both sides at once above `lg`.
   **The one view that belongs to a side**, and the only reason the two halves of
   the scoreline are a control rather than a caption.

   **The list went, and it was a whole tab** (Craig, 11 Sep 2026: *"pitch and
   list dont need to be two screens, come on, should just be Scores for that
   view"*, then *"just pitch i think"*). `SquadRows` keeps its two remaining
   callers on the squad and club boards.
4. **Stats** — three sub-views switched from the **foot row** (`FootFrame` with a `TabStrip`,
   `?of=`): *side A · side B · Fantasy*, opening on Fantasy (Craig, 24 Sep 2026).
   - **Fantasy** — `CategoryBands` in the match page's Fantasy layout: a grey plate
     per category with each side's total at its end, then each side's men meeting at
     a centre rule, "crest Name (pts)", the points green or red. The eleven only.
   - **A side** — `SideStats`, the match page's club board for one manager: his
     colours on the position tiles, each man's club crest, Fantrax's points, then
     what he did in each league category (counts, noughts included), in Fantrax's
     own row order. A figure is green where Fantrax paid him for it and red where it
     docked him (`gainOrLoss`), at his roster slot. No sub notes: the pitch has them.
     Sortable (`?sort=`, `?dir=asc`); the bench below the eleven, dimmed and "not counted".
   - **Minutes played is on neither** (Craig, 1 Oct 2026), found by Fantrax's long
     code (`MINUTES`), so the bands no longer sum to the scoreline. Both read the
     served league's own categories: the real league's (`AT`, `GKP`, `DFP`, `DFP3`) from go-live.
   The Players tab went into this on 24 Sep.
5. **Table** — the league standings, with **both sides of the tie edged in their
   own colours** (`TableTab` → `/league`'s own `Columns` and `TableRow`).

   Craig, 11 Sep 2026: *"goes to a page with just the league table (not the
   league table page itself)"*. What it answers here that `/league` does not is
   what THIS result does to both positions, which is why both rows are marked
   rather than only the reader's.

   **The mark could not be `TableRow`'s `mine`** — that paints `bg-raised`, and a
   tinted band "reads as *these are yours*", which about a rival is a lie. It is
   a `tint` prop, and it rides on the INDEX CELL rather than the row: `yoursEdge`
   hands back a *transparent* border on unmarked rows precisely so one row's
   figures do not step 4px out of the column, and a `<tr>` border does not paint
   through the index cell's own ground at all. `mine` wins where both apply.
6. **Fixtures** — every Premier League match either squad has a man in, in kick-off
   order, each drawn as the Live tab draws a fixture (`ScoreRow`: table places,
   crests, score, live minute or FT, a link to the match). Under each row, the URL's
   side's men from the left and the other side's from the right, with Fantrax's
   points; a reserve is dimmed and uncounted, and a double's period figure prints
   under the later match only (`fixtureMen.ts`). A side whose eleven is not public
   names nobody. It replaced Scores on 24 Sep (Craig: *"scores is pointless"*).
7. **A live player card** (`LivePlayerCard`) over the top, when one is tapped.

## What the round is doing

One word, in one place, and it is the only thing on the board that makes a
promise about the numbers beside it.

| `state` | On screen | When |
|---|---|---|
| `"live"` | LIVE dot + word | `isMatchdayLive` — a match actually in play |
| `"bonus-settling"` | "Full time" | every dated match finished, bonus not yet added |
| `"provisional"` | "Full time" | bonus added, FPL has not signed the round off |
| `"final"` | "Final" | FPL's `data_checked` |
| `null` | nothing | between kickoffs, and any round nobody is playing |

**Two rungs, one word, on purpose.** `bonus-settling` used to add a faint
*bonus settling* under the caption. It named FPL's bonus ladder as the reason the
number beside it was still shifting — and the number beside it is Fantrax's,
under scoring that has no bonus category. Checked against both leagues on 22 Aug:
the rehearsal league scores CS A RC Min PKM GAO AF G OG YC, the real 10 Oct league
a richer set again, and neither has one. The difference between the first two
rungs is FPL's, and this board is not showing FPL's numbers.

That leaves an open question rather than a settled one: if Fantrax's ledger
closes at each whistle — and every played fixture was fully credited by them on
22 Aug while FPL still had all six `finished: false` — then "Final" on a Fantrax
scoreline is earned at the last whistle, not at FPL's sign-off a day later. One
day's observation is not enough to move a promise on.

**The dot used to burn all Saturday.** It was driven by `duringGameweek` — the
window from the first kickoff to the last whistle — which is the right question
for *how often to poll* and the wrong one for *whether a match is on*. Tea-time
between the 12:30 and the 15:00 had nothing in play under a pulsing LIVE dot.
The poll rate still reads `duringGameweek`, because fast between kickoffs is
right; the word reads `isMatchdayLive` and `roundFinished`.

**"Final" is claimed only at `data_checked`.** A manager watching his total move
under the word Final would be right to stop believing the screen, so the two
rungs before it say full time and — while bonus is still landing — say why the
numbers are shifting. `roundFinished` is in the football layer and tested there;
`null` covers both "in play" and "not started", which the board tells apart by
pairing it with `isMatchdayLive` rather than inventing a fourth state.

## The two providers

The scoreline is `getLiveScoringStats` — Fantrax's own totals under Fantrax's own
scoring, which we never recompute.

Everything under a player is **two sources joined**: his fantasy points come from
the same `getLiveScoringStats` payload, priced at his slot — reserves included
since 24 Sep, uncounted — and what he *did* — goals, assists, clean sheet,
minutes — is **FPL's**, joined through the identity bridge.

**The provenance line came off the top of the screen** (Craig, 11 Sep 2026:
*"remove A round already played… row"*). It was 44px of prose over a scoreline
nobody was asking it of. The claim is still owed — these are Fantrax's figures,
and on a round already played the elevens may be the arrangement it stored or may
be today's squads — so it is the Stats board's `Section` aside, where a reader
asking where a number came from is standing. `wasFielded` still tells the two
apart.

*Closed: the points now come from `getLiveScoringStats`, which honours the period.*
**`period` does not price the week, and this paragraph used to say it did.** It
was probed on 19 Aug and `displayedPeriod` does echo, with `periodOppnentTeamIds`
changing to match — so the opponent column moves. Re-probed on 22 Aug with real
numbers in the payload: periods 1, 2 and 3 answer **byte-identical** points, every
category line included, and `SEASON_926_BY_PERIOD` behaves the same way. What the
board prints under each man is season-to-date under a card headed "This period".
Invisible while the season is one gameweek old and wrong from GW2. Recorded in
HANDOVER §4 as the thing to take next.

If Fantrax refuses the points table for a side, that side's players fall back to
their **minutes**, told apart by the apostrophe on them. One table either arrives
or it does not, so a side never mixes the two.

## What a tap answers

`LivePlayerCard` — a second card, distinct from the squad screen's `PlayerCard`,
because they answer different questions on different days. `PlayerCard` is "who
is this, and is he fit", read midweek. This one is read at ten past four, and the
only question is *why* he is on the number he is on.

- **An itemised points table** (`league/Breakdown`), one row per scoring
  category that moved his total, largest contribution first, each carrying the
  count Fantrax states beside the points it paid — gains green and deductions
  red, DESIGN §3's direction pair — and the total under them. Every figure is
  **Fantrax's**, under our league's own scoring, read from the scoreboard's
  own `getLiveScoringStats` payload, and they sum to the total exactly. A
  reserve's card says he is on the bench and not counted. Nothing is computed here — our own engine could only ever
  have approximated the five categories FPL does not publish, and would have had
  to caveat every line.
- Categories that scored him nothing are dropped, and so is games played, which
  in this view renders as 0 because a count of appearances is not a score.
- The category label carries **Fantrax's own definition** behind it (`title`),
  which is where the league's rules are published — what counts as a clean sheet
  is their sentence, not ours.
- **FPL's record under a drop-down** (`league/FplRecords`): shut it is the words
  "Full match stats" and a chevron, open it is his minutes, what he did, bps,
  defensive contribution and the expected family. A different provider answering
  a different question, so it is the panel under ours and never a column in it.
- **Before he kicks off** there is no table: the fixture line under his name says
  when, and an empty breakdown under a live score would read as a score of
  nought.
- The three states of `points` are three different sentences: no table at all is
  Fantrax refusing and says so, a table that does not name him is a dash, and a
  table that gives him a nought is a real nought.

## The points band

The bottom band of a player on the grass, and the loudest thing on the card
after his kit.

- **Once he has played it flips dark** — near-black ground, cream numerals, his
  chips beside them. It used to be a small number on the same cream as his name,
  which made the one figure a manager came for the smallest thing on the screen.
- **Until he plays it is his fixture**, at full FDR colour and full strength.
- **Not-played is said by the kit alone** — dimmed and lightly
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
- ~~The whole board — scoreline, controls, eleven and bench — fits a 390×844
  phone without scrolling.~~ **It does not, and had stopped before anyone
  noticed.** Measured 29 Aug: 899px against 844, and ~902 before the player card
  was rebuilt that day, so the claim was already stale by about the same amount
  and the rebuild is not what broke it. The card is not what is over — a squad
  drawing the identical eleven at `/squad/[teamId]` fits with 53px to spare.
  This board spends 471px on furniture the gated squad page spends 232 on: a page
  header, the section nav, a scoreline and a Pitch/List control, above the same
  pitch. The remaining 55px has to come out of those, and until it does this is a
  board that scrolls.

## Known gaps

- ~~The list does not separate the eleven from the bench.~~ **Closed 5 Sep 2026.**
  It was fed `squadUnarranged`, whose job is to REMOVE the arrangement — the right
  shape for a rival's squad before his period opens, and not what this branch is,
  since a withheld side never reaches it and the pitch beside it had been drawing
  the lineup all along. Both views draw the eleven in its formation lines, then a
  plated `Bench`, then the reserves.
- The two elevens can only be compared by switching halves. Whether that is worth
  fixing on a phone is an open question — the alternative is thirty players.
