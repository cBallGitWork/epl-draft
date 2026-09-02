# `/prem` — the FA Barclays Premiership

The real competition, on the desk. Five routes: the table, the results, the
fixtures, the team-stats board, and a club page the first two link into.

`../../DESIGN.md` is binding for colour and type and this file defers to it.

## Why the section exists at all

Fantrax says almost nothing about the Premier League. It runs our fantasy
competition and it is authoritative about that; it is not a football site. Until
this section the app had no screen for the real thing — the only place the actual
table had ever been printed was six lines on the back page of the paper
(`app/tables.ts`, `footballRows`).

`/league` and `/prem` are the two layers side by side in the rail, and the
difference between them is epistemic rather than cosmetic:

| | `/league` | `/prem` |
|---|---|---|
| Whose competition | ours, on Fantrax | the Premier League |
| Whose arithmetic | **Fantrax's, quoted** | **ours, computed** |
| Why | three for a win is a commissioner setting | three for a win is a rule of the game |
| Source | `getStandings` | finished fixtures |

That inversion is the whole point. `/league` may never add up a table because a
league that paid two for a win would make it wrong. `/prem` **must** add one up,
because FPL publishes `played`, `win`, `draw`, `loss` and `points` on every club
and every one of them is nought with two rounds finished and signed off
(`football/table.ts` carries the probe). `position` is the one team field that is
not nought — and it sits beside a `played` of nought on all twenty, so whatever
it orders is not a record anybody has played.

## The reference

`docs/ui/reference/cm9900/24.jpg` is a Premier League table screen. It is the
shot this entire register was copied out of, which makes this the most faithful
reproduction in the app and sets most of its decisions:

- **The competition title bar** — a light plate with the title in blue, centred,
  no crest. `PageHeader … competition`. The other bar (`25.jpg`, a filled plate
  in a club's colours) is what `/prem/club/[code]` wears, because a club is
  somebody *in* the competition rather than the competition.
- **A tab strip four wide**, butted edge to edge, the current one drawn with the
  accent on its label and its border.
- **A yellow caption inside the panel**, naming the view.
- **An ordinal index block** down the left — `1st 2nd 3rd`, not bare numbers. A
  column of bare numbers is a list; a column of ordinals is a league.
- **`Pld Won Drn Lst For Ag Pts`**, centred under centred heads. We add `GD`,
  which the game leaves out and which the competition orders on — a table whose
  first tiebreak is invisible cannot be checked by the reader.
- **A dashed rule under the cut**, in yellow.

## The strip

`Table · Results · Fixtures · Team Stats`. Four is the width the reference runs.

There is **no foot row**, and that is a decision. Player Stats belongs there
beside Team Stats, exactly as the game files them, and it is deferred (Craig,
2 Sep 2026: *"leave the player stats bit for now, that's a full section on its
own"*). A foot row of **one** is the stray button under a panel that
`league/SectionNav` already records Craig rejecting. The row comes back with the
second entry in it.

The strip is set at 9px (`TabStrip … labels="word"`), measured: at 11px "Team
Stats" takes two lines in a 76px plate at 390 while its three neighbours take
one. The plates stay level either way — flex stretches them — but a strip with
one label wrapped is not a strip.

## The two cut lines

**Champions League** under 4th in `--color-accent`, **Relegation** above the
bottom three in `--color-bad`. Both dashed, both carrying their name, both drawn
only when the table is in the competition's own order — fourth by goals scored is
not fourth in the league, so a sorted table has no cut in it.

DESIGN §3 refuses yellow for the *draft* table's playoff cut, and the reason does
not carry here. There, the accent is already spoken for twice on the very row a
manager is hunting for: the "yours" border and the YOURS chip. **Nobody owns
Arsenal.** Neither mark exists on this table, so the accent is free and
`24.jpg`'s own dashed yellow rule under 1st is the thing to copy. Relegation
takes the loss slot, whose one meaning is a loss, a doubt, a negative. Both are
labelled, so neither depends on colour to be read.

`PREMIERSHIP_CUTS` in core config holds the two numbers; `relegate` counts **up
from the bottom**, so a division of any size draws the line where it ends.

## What it costs

Nothing. `footballNow()` and `seasonFixtures()` are both `unstable_cache`d and
both already warm on every page view — the layout reads one to decide whether the
Live tab exists, and the league schedule reads the other. The real Premier League
is the same for everybody, which is exactly what makes it cacheable.

## Results and Fixtures

One read, split on `status`. A round **in play appears on neither**: it has not
finished, so it is not a result, and it is being played, so it is not a fixture.
It is on Live, which is the screen for a number that moves.

They deliberately do **not** use `components/football/MatchList`. That component
expands a match into who did what, off the per-player stats a snapshot carries
for its own gameweek — and there is one live feed, not thirty-eight. A row that
opened onto "Nothing to report." over a 3–0 win would be a confident wrong
statement about a match that happened. So `prem/Match` says the one thing the
season's fixture list actually knows, and the richer screen stays with the round
in view.

A fixture FPL has not assigned to a gameweek is left out rather than filed under
nought. One it has not dated reads **TBC** rather than a guessed kickoff.

## Team Stats

A leaderboard, not a spreadsheet: one measure at a time, every club in order, the
figure at the end. Seventeen measures as seventeen columns is what a provider's
own page does and is unreadable under a thumb — `league/team-stats` records the
same ruling off the same shot.

**The category list lives in the app** (`prem/team-stats/categories.ts`), not in
core. `clubStats` and `leagueTable` are the domain and are tested on what a club
has done; *which* of their fields are worth a screen is a product decision that
changes when Craig looks at it rather than when the competition does.
`league/team-stats` reads its categories from core because Fantrax defines those.
Nobody defines these but us.

Every category declares which way is good. Goals conceded and matches without
scoring open smallest-first, because a board that did otherwise would head the
ranking with the worst side in the division. Ties fall back to the table's own
order, so two clubs level on clean sheets do not swap places between refreshes.

## The club page

A stub, and honest about it. It carries the club's identity, its place and its
record, and says in words that the squad, the fixture run and the season are
still to come — a screen that simply stops is one a reader assumes is broken.

Keyed on FPL's **season-stable club code**, never `clubId`: a URL is persisted
the moment somebody shares it, and FPL's per-season ids are recycled
(CODE_RULES §3).

## What is deliberately absent

- **Player Stats.** Deferred, above. The football layer now carries goals,
  assists and clean sheets for it (`SeasonTotals`), and the bound travels with
  them: those three may not appear on a fantasy screen beside a Fantrax figure.
- **A position column anywhere.** FPL's `element_type` is FPL's own fantasy
  classification, not a fact about a footballer, and it is why position left the
  football layer in the first place.
- **FPL's `position` field on a club.** See above — it orders nothing anybody
  has played.
- **Anything about who owns whom.** That is `/league`'s question. No accent edge,
  no YOURS chip, no `yoursInk` on this table: the three marks that say "this one
  is yours" have nothing to say about Arsenal, and spending them here would cost
  a reading aid five other screens depend on.
