# `/prem` — the FA Barclays Premiership

The real competition, on the desk. Six routes: the table, the results, the
fixtures, the team-stats board, the season's leaders (Data), and a club page the
first two link into.

`../rules/DESIGN.md` is binding for colour and type and this file defers to it.

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
- **Under `lg`, `For`, `Ag` and `Form` stand down** (5 Sep 2026): 408px of table
  in a 346px wrapper was clipping `PTS`, which is the column the table is FOR.
  `GD` stays — it is the competition's own first tiebreak, and the two numbers it
  is made of are the pair a phone can spare. The visibility rides in each
  column's `width` string in `prem/Columns.tsx`, so the heads, the rows and the
  loading skeleton read it from one place.
- **`For` and `Ag` are ink**, not amber: DESIGN §3's slot means a figure standing
  alone beside a name, never a column of a standings table.
- **A dashed rule under the cut**, in yellow.

## The strip

`Table · Results · Fixtures · Team Stats · Data`. The reference runs four; Data
is CM's Player Stats, deferred on 2 Sep 2026 and arrived on 1 Oct as a view of
this section. Until then the Data plate led out to the pool and no tab drew
current on it. There is still **no foot row**: a row of one is the stray button
`league/SectionNav` records Craig rejecting.

The strip is a `word` strip: under a thumb each plate is sized to its label, so
"Team Stats" sits on one line at 11px from 375 up (27 Sep 2026; it wrapped in an
equal 76px share, which is why the strip was 9px until then). Under 375 it drops to 9px.

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

**Nothing, for the four routes this section opened with.** `footballNow()` and
`seasonFixtures()` are both `unstable_cache`d and both already warm on every page
view — the layout reads one to decide whether the Live tab exists, and the league
schedule reads the other. The real Premier League is the same for everybody,
which is exactly what makes it cacheable.

**Two routes have broken that, both deliberately, and this paragraph is now the
only place both are written down.**

The **club page**, 3 Sep 2026: the cost is set out under "Two position columns"
below, where its Elig column reads Fantrax through `leagueInfo`. *This paragraph
said "Nothing" unconditionally for a day after that stopped being true.*

The **match page**, 4 Sep 2026: it names the fantasy squad holding each man on
the scoresheet and counts the managers with somebody in the match, through
`marks()` and `getLeagueSquads`. Same shape of cost — one `leagueCache` entry
shared with `/league` and every squad page, so a reader who has been anywhere
else pays a cache hit and one reached cold makes a request. What buys it is
`docs/rules/PRODUCT.md`'s partisan principle: a goal in the Premier League is also
somebody's afternoon, and a match is the one screen in this section where that
is the question. It is streamed behind `<Suspense>` and `marks()` returns an
empty object on every ordinary failure, so the football renders with no Fantrax
at all.

It costs one thing more the club page does not: **a second cached FPL read**,
`gameweekSheets`, at 26 KB a round. Never `seasonFixtures` fattened — the whole
season's `stats` blocks are 183 KB today and about 1.1 MB by May, and that read
is on the paper's front page.

`/prem` itself — the table, results, fixtures, team stats — still costs no
provider request. **Data does**: its Fantrax points list reads the pool
(`getLeaguePool`, the Data board's own cache entry) and its names link through
`leagueOpinions`, as a club page's do.

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
own page does and is unreadable under a thumb.

*`league/team-stats` used to record the same ruling off the same shot and no
longer does: its foot row had already cut twelve categories to a group of three
or four, and on 11 Sep 2026 it began drawing the whole group at once. This board
has no such row — seventeen measures in one list — so the ruling stands here on
its own arithmetic rather than by agreement with the other board.*

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

**Expected conceded is the squad's FPL xGC over eleven** (1 Oct 2026). FPL credits
every man on the pitch with the side's chances against, so the squad's sum is about
eleven sides' worth: Arsenal printed 44.4 after GW5 where the side's own figure
is 4.04. Data › Teams divides the same way. The three expected figures print to two
places, as FPL publishes them.

## Data — the season's leaders

Craig, 1 Oct 2026: *"simple list like top scorer, top xg, top fantasy ratings etc
in a list, not a link to data section, with a top 50 for each"*. Eight lists,
each the top ten with a `Top 50` plate under it (`?list=…&n=50`): top scorers,
expected goals, match ratings, Fantrax points, assists, expected assists,
clean sheets, saves. On the desk all eight stand four across, and the one asked for
runs to fifty. A phone gets a picker and one list at a time.

- **One figure per list, and a list that is not FPL's says whose it is**: *Match
  ratings* in cyan, the derived slot (the average of his marks
  once he is rated in half as many matches as the most-rated man), and *Fantrax
  points* in its bar (the served league's own, never beside FPL's count of anything).
- **A list ranks on the figure it prints**, so two marks that both read 6.3
  share a place, and a nought earns none.
- A man who has left the division is off every list (`onTheBooks`).

## The club — a spine, not a page

Grown out of the stub on 3 Sep 2026 (Craig: *"the prem team page. similar
structure to the fantasy team page"*). It wears its own colours and carries
tabs, exactly as `/squad/[teamId]` does for a fantasy side — `cm9900/25.jpg` is
the reference for both, and it is a strip over a panel rather than one page.

| Tab | Route | What | Source |
|---|---|---|---|
| Squad | `/prem/club/[code]` | Every man on the books, ordered by our position; no faces, a doubt washes his row (25 Sep 2026) | FPL bootstrap; Fantrax for eligibility |
| Depth | `…/depth` | Who is in line for each shirt: the sister's depth chart on CM's pitch (a plate per place, no kits or faces), three deep for a lone shirt and a pair dealt like a snake (1st and 4th, 2nd and 3rd); a list on a phone; a doubt's name washed | The sister repo's chart, `intel/depth` |
| Pieces | `…/set-pieces` | Who takes the penalties, free kicks and corners | FFScout, via the sister repo |
| Fixtures | `…/fixtures` | The club's season, oldest first | FPL fixtures |
| Stats | `…/stats` | Every player, by one group of measures, sortable: our position in the index tile, no Pos column, each column's standouts in orange and yellow (red for goals conceded), a doubt's row washed (25 Sep 2026) | FPL |

**Match puts the home side first, and the fantasy screen does not.** A fantasy
fixture has no ground, so `squad/[teamId]/next` leads with whoever's page you
are on; a real one does, and a match header that put the away side left would
be printing the fixture backwards. Each side's record is the half that will
actually apply — the home club's home record against the away club's away one —
because a whole-season figure either side compares two numbers neither of which
is about this fixture.

**The Stats comparison is one club, so both columns take one colour**; the Match
comparison is two clubs, so each column takes its own. `Comparison`'s `plate` is
optional for exactly that reason, and `cm9900/22.jpg` is the shape.

**Tactics is not a tab and will not be one.** `25.jpg` has no Tactics tab —
`Tactics · Training · Last Match · 6th in PRM · History` is the FOOT row under
the panel. It arrives there when there is a real XI to draw, and it is the
second entry the foot row has been waiting for since this section shipped.

### A name opens the player page

Every name on a club's tabs links to `/players/[fantraxId]` (Craig, 26 Sep 2026:
*"clicking on a player takes them to their proper player page"*). The club tabs
hold FPL codes, so `poolHref` reads the Fantrax id off `leagueOpinions`, which is
the bridge inverted. A man our league does not list prints unlinked: 51 of the 562
on the books on 26 Sep. `/prem/player/[code]`, the stub footballer page these
names used to open, is gone.

`/prem/match/[id]` has its own file, [match.md](match.md).

**"Every score in the section is a link" was never true.** `prem/Match` — the row on Results and on
Fixtures, which is where a reader lands from the rail — rendered its scoreline as
a bare `<span>` and had done since the section shipped. The only two links that
ever reached the match page were a club's fixture run and a player's match log,
and neither of them is in this section's four tabs. Both round lists link now.

**The match page takes the fixture `id`**, which is not season-stable — and
neither is a fixture. This match exists in this season and nowhere else, so
there is nothing for a stable key to outlive. [match.md](match.md) carries the
rest of it.

### The squad list

Ordered by **the position our league files each man at** (Craig: "needs to be
ordered by fantasy position") — `positionDepth` in the join layer, keeper
through attack, which is the order `cm9900/25.jpg` runs down its slot strip. A
man our league has no opinion about sorts last rather than into goal.

The index block down the left carries **what our Fantrax league fields each man
as** (`PositionTile`, shared with `SquadRows`), and there is no separate Pos
column (Craig, 23 Sep 2026: "Put the Fantrax position into those tiles, and then
remove the position columns"). It replaced the shirt number, which the match
squads and team sheet still carry.

`xMins`, after `Min`, is the sister model's expected minutes in the club's NEXT match week, in cyan beside
FPL's minutes in ink; the head's title names the gameweek. No column when the export does not cover that week.

`Owner` is who holds him in our league, or Fantrax's own letter instead — `WW`
on waivers, `FA` a free agent. A NAME and never a figure, which is what keeps it
clear of `SeasonTotals`' bound: the bound forbids FPL's counts standing beside a
Fantrax FIGURE, and this is a fact about our league rather than a second count
of a Premier League goal.

**Players FPL marks unavailable are dropped, and only that state** (Craig:
"remove UNAV players, they are out of the game"). FPL's `u` is not a knock — it
is a man no longer in the competition, a loan out of the league or a contract
expired. The injured and the suspended stay and are greyed, because a squad list
that omits them cannot be checked against a team sheet.

### The fixture run

`cm9900/24.jpg`'s club fixture list, which names **the opponent once** — a date,
who they played, whether it was home, the competition, the score. It does not
print the club whose page you are on (Craig: "we dont [want] to put the same
team over and over"), which is the whole difference from `prem/Match`: that one
draws both sides because it lists a round rather than a campaign.

The score is the club's own goals first whichever end it was at — a column read
down a season means nothing if half of them are reversed — and it links to the
match page. Full date and kick-off time on every row, in their own columns.

### Two position columns, and why there are two

**Pos** is the real-life position — `GK`, `DC`, `RB`. It prints `—` today: the
football layer carries no position by rule (`football/types.ts`), and the feed
that will fill it is the sister repo's. The column is drawn now so nothing
shifts when it fills, and it stands down under a thumb, where forty pixels of
dashes costs a name the room to be read.

**Elig** is what our Fantrax league is willing to field him as, and it is headed
as Fantrax's because that is what it is. The two are not one column and must
never become one: `MID` against Saka's name would say Arsenal play him in
midfield, when what is true is that *this league* files him there — and which of
his `F,M` actually scores is the roster slot his manager picked, a fact about a
team rather than about a man.

**This is the only place the two layers meet on a Premiership screen**, and it
is a join through the audited bridge, never a name match.

**What it costs is a dependency, not a request.** `leagueInfo` is one
`leagueCache` entry shared with `/league` and every squad page, so a reader who
has been anywhere else in the app pays a cache hit. But the layout does not warm
it — it reads `footballNow` and `offerLive` only — so a club page reached cold
makes a Fantrax request no other `/prem` page makes, and Fantrax being
unreachable now costs a column where it used to cost this section nothing.

Failure-tolerant by construction, for that reason: `leagueInfo` already returns
null when Fantrax refuses, the column empties to dashes, and the squad renders
regardless. `/prem` itself — the table, results, fixtures, team stats — still
costs no provider request, and `prem/(competition)/page.tsx` says so about itself.

### Fixtures is the Premier League only

FPL publishes one competition, so there is no cup or European tie to show and no
honest way to imply one. The page says so under the list. The round block down
the left is already the shape that carries the answer — it prints `GW7` and
would print the competition beside the round — so the limit is the feed's and
not the layout's.

**The named source is the sister repo's `team_match_log.parquet`** (Craig, 3 Sep
2026: *"that's what the team log parquet is for"*). It carries a `competition`
column beside the round, which is exactly the pair the block needs, and it is
the same export that will fill the Pos column — one crossing, not two.

## States

| Screen | State | What it says |
|---|---|---|
| Table, Results, Fixtures, Team Stats | FPL silent | `Nothing`, with the provider's code |
| `/prem/club/[code]` | code is not an integer, or names no club | `notFound()` |
| Squad | FPL lists nobody | `TabEmpty` |
| Squad | Fantrax silent | Elig empties to `—`; the squad still renders |
| Pieces | nobody named for any piece | `TabEmpty`, and the tab greys |
| Fixtures | no match with this club | `TabEmpty`, and the tab greys |
| Stats | FPL lists nobody | `TabEmpty`, and the tab greys |
| `/prem/match/[id]` | id is not an integer, or names no fixture | `notFound()` — its own states are in [match.md](match.md) |
| Any club tab | still loading | its own skeleton — **not** `/prem`'s league table |

Keyed on FPL's **season-stable club code**, never `clubId`: a URL is persisted
the moment somebody shares it, and FPL's per-season ids are recycled
(CODE_RULES §3).

## The route group

`prem/(competition)/` holds the table, results, fixtures and team stats; the
club pages sit outside it. The URLs are unchanged — a group is invisible to the
router — and the reason is `loading.tsx`: Next applies a segment's loading file
to everything beneath it, so a league-table skeleton at `/prem` was streamed in
front of every club page. Measured on 3 Sep 2026 before the move: the wrong
skeleton at byte 7,980 of `/prem/club/3/stats`, the club's own at 8,655. A group
is the only way to scope a loading boundary to the routes it describes.

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
