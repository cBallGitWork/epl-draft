# `/` — the Gazetta

The front page, and the first thing sixteen people open: the lead, the week's
business, who is hurt, and when lineups lock.

## In reading order

1. **Masthead** — a masthead, not a page header. Every other section of the app
   opens with the crest at the left and the title beside it, because those are
   screens; this is a front page. The name is centred, set as large as a phone
   allows and **allowed to wrap** — two lines at this size is what a broadsheet
   does with a long title, and shrinking it to fit would trade the one piece of
   typography meant to be loud for a tidiness nobody asked for.

   Between rules, in the league's red, with a **dateline** under it: date at the
   left, season at the right, small capitals and letterspaced. That row is the
   whole difference between a masthead and an `<h1>`, and no app has one.

   The date is the **edition's** instant, not the reader's clock: two managers
   opening the same cached edition either side of midnight must not be shown
   two different days.

   Under it, the line that changes: "Football is on. The scores are moving."
   while live, otherwise when lineups lock.
2. **As it stands**, while the round is running — your tie at the size the live
   number deserves, every other tie under it at the desk's density. See *The
   live splash* below. It replaces a thin bar that said football was on and made
   you tap to learn anything at all.
3. **The lead** — a full-bleed picture band, then a kicker, a headline set larger
   than anything but the masthead, and a standfirst. Never at the same time as
   the splash. See *The lead* below.
4. **The column**, when one has been filed about this round — and then it
   *leads*, taking the picture the desk chose and dropping the desk's own
   headline. See *The written column* below.
5. **Also this week** — the next two stories as headlines: a kicker and a line,
   no picture, no standfirst. The hierarchy *is* the design — a newspaper's
   second story is recognisable as the second story before you have read a word
   of it, and a page that gave every story a photograph would be a page with no
   lead on it.
6. **Team of the week** — the best XI across the whole league, **on grass**, in
   its shape. Each man is a cut-out with what got him picked under his name
   (`2G · CS`, or minutes if nothing else) and his owner under that. `benched` is
   appended to the owner when a manager left his own best player out — **and only
   when the arrangement it was read from is the one that was fielded**; see *What
   may be said about a bench* below.
7. **The week's business** — trades and claims, grouped so both halves of a trade
   read as one deal. Fantrax's timestamps, shown verbatim with their zone named
   in the heading, because they carry a US Eastern offset.
8. **Doubts** — FPL's injury news across every squad, with chance of playing.
   `no word` when FPL has no opinion, which is not the same as 0%.
9. **Next deadline** — the period boundary, with an explicit note that the
   commissioner's real lock is fifteen minutes before the first fixture and is
   not something Fantrax publishes.

Your own team is marked throughout with the left-edge accent border
(`yoursBorder`) — and the same one, on a different ground. The class it returns
sets a border *colour* plus an explicit left width, so on a ruled row with no
`border` utility it draws the accent bar and nothing else. One treatment, two
grounds, and `mine.ts` stays the only place that knows what "yours" looks like.

## The live splash

**The page refreshes itself.** `/` was the only live-worthy surface in the app
that never mounted `AutoRefresh`: a phone left open on the sofa showed a frozen
scoreline under a pulsing dot for a whole half. It now polls on `pollSeconds`
like every other screen — 30s while the round is under way, 300s otherwise.

**A figure that moved says so.** `Changed` wraps each total and flashes it to the
accent for 700ms when a refresh brings a different number, settling back to
whatever token the figure already carried so a trailing side stays dimmed. Under
`prefers-reduced-motion` it becomes a 400ms crossfade rather than nothing —
PRODUCT.md requires that by name, because this is the one signal whose entire
content is "it changed". The carve-out needs `!important`: the blanket
reduced-motion rule is itself `!important` and would otherwise collapse it.

**Three round questions, and they are not interchangeable.** `live` is a ball in
the air — the dot and the present tense. `partial` is football still to come —
what withholds the lead. `underway` is first kickoff to last whistle — what the
splash asks, because before the first kickoff every total is a legitimate nought
and eight ties reading 0–0 would be reporting a round nobody has played.

**The splash is never the lead.** While the round is being played the paper
reports the score and says nothing about what it means. That is the same rule as
before, not a new one — a headline is the one place a provisional claim cannot
go — and `underway` being true implies `partial`, so the two can never both
render.

Not signed in is a neutral desk, not an empty one: the same ties, none promoted.

## The lead

**The lead carries a picture, because a front page without one is a memo.** Which
picture depends on the story, and only one kind honestly has a photograph in it:
a man his own manager left out is a man, and we have his face — the cut-out on
his club's colour with the crest oversized behind him. A result is not a face, so
there the picture is **the scoreline itself**, set as large as a phone allows,
which is what a paper does with a score too. A trade gets the two players' names
at the same size. Nothing is borrowed to fill the band: a portrait of the
winner's best player would be a picture of a story we are not telling.

One band, three fillings, so the four kinds share a rhythm rather than each
arriving as its own layout. It is full-bleed on the same rule the pitch is: the
widest thing on the page is the one that gains from every pixel.

`stories()` in `packages/core/src/gazette/stories.ts` ranks them, and the order
is an editor's argument rather than a measurement — a one-point finish and a
manager benching the week's best keeper are not the same kind of thing, and a
number claiming to convert between them would be an arbitrary weight wearing the
costume of an answer. In order: **a match decided by nothing**, then **a manager
who left the week's best player out**, then **a hammering**, then **a trade**.

Four kinds, four headlines, one shape. Core returns the facts **and every story
it can tell, strongest first** — the page leads on the first and runs the next
two as headlines. Core returns the fact, `Stories.tsx` writes the sentence: the
same split the rest of the paper keeps, and the same words at both sizes, so the
lead and a headline can never disagree about what happened.

The type is `Story` and not `Lead`, and it was `Lead` until the paper ran more
than one of them.

| kind | kicker | reads |
|---|---|---|
| `squeaker` | Down to the wire | the scoreline · *test3 edged test2* · Decided by 1 point. |
| `bench` | Left out | his cut-out · *test4 left Pickford out* · He is in the week's eleven. test4 lost 19–41 to test2. |
| `rout` | No contest | the scoreline · *test2 took test4 apart* · 22 points between them. |
| `trade` | Business | the two players · *123 and test3 have traded* · Adrien Truffert to 123 · Gabriel Magalhaes to test3 |

The standfirst does **not** repeat the scoreline on a result: the picture above it
is the scoreline, and a line that says it again is a caption rather than a
standfirst.

**Both result thresholds are shares of the winning total, never numbers of
points.** The points are a commissioner setting: this league's weeks come out in
the tens and a league paying for every touch would come out in the hundreds, so a
threshold written in points would read every week of one of them as a thriller.

**Most of the week there is no lead, and that is the design.** A paper does not
manufacture a front-page story, so when nothing qualifies nothing prints — and
the next deadline, which the masthead already states, is not a story. Nor is
there one while football is on: the live bar leads then, and a headline is the
one place on the page a provisional claim cannot go.

It is deliberately **not** marked when it is about the reader's own team. The
accent is a reading aid for scanning a list of sixteen and there is nothing here
to scan; a manager knows his own name in a headline.

It is deliberately not a `Column` either, though it borrows that head. A column's
head is a label over a list and the list is the point; here the head is a kicker
and the headline is the point, so the headline has to be the heading.

## What may be said about a bench

`getTeamRosters` is asked for no period and labels its answer with the one
Fantrax considers open — **and Fantrax rolls that label forward well ahead of its
own published boundary.** At 08:29Z on the Friday of period 1, ten and a half
hours before period 1 closed, it was already answering period 2.

So between rounds the arrangement on hand can be next week's plan, and `left him
on the bench` becomes a statement about a side nobody fielded. `Edition.fielded`
is the check — Fantrax's own label against the period the round in view is scored
in — and when it is false **every claim about who was STARTED is withheld**, both
from the lead and from the eleven's rows. What the players did is football and
stands either way, which is why the eleven itself still prints.

The obvious repair — ask for the period we mean — is real and not yet taken.
Fantrax does keep a past period's own squad, settled 28 Aug, so the history is
there for the asking. What is not settled is the instant a period stops tracking
the live one, and the lineup gate is the wrong place to be approximately right;
`squads.ts` carries the argument.

## The written column

**Facts are live and prose is published, and the split is the whole design.**
Everything else on this page is computed from data that updates every thirty
seconds. The column is written twice a week by Claude from a facts-only brief,
committed to the repo as `data/editions/latest.json`, and baked into the build.
A column that regenerated every thirty seconds would not be a column, and a
sentence about a score that has since moved is worse than no sentence.

Two kinds. A **preview** files once lineups lock and before a ball is kicked; it
calls each tie, and `markPreview` counts those calls against the results so the
next edition can tell him what he got. A pundit nobody marks is a pundit who
never has to be right. A **report** files once the football stops.

**It leads when it exists AND the football has stopped, and then the desk's
headline is dropped.** Both would be about the same match — a fact-headline and a
written one, stacked, saying the same thing twice. The picture stays, because the
story is the same story and the desk is what chose the photograph for it.

The "and the football has stopped" is not a detail. A preview files at the
Friday lock and `partial` stays true until the last whistle, so left unqualified
this rule made the preview the LEAD all Saturday — the one place on the page a
provisional claim may not go, per the rule three sections above. And the writer
is told "nobody has kicked a ball", so it said exactly that, under moving
scores. The page reads `!underway`.

**When there is no column the paper is facts-only and says nothing about it.** A
paper does not apologise for the column it has not got. That is the state for
most of every week, because the newest edition on disk is last week's until the
next one is filed — `editionMatches` is what stops last week's opinions running
under today's dateline.

The filing time prints. Every other figure on the page is thirty seconds old and
this could be three days old and still be the current edition; a reader is
entitled to know which he is reading.

Team names are joined from ids the writer returns, never from names he types: a
name typed by a model goes stale the day somebody renames their team, and
renaming your team is the first thing sixteen people do.

## The eleven is a team, not a table

It was eleven rows on hairlines — the same faceless line eleven times, the
biggest block on the page, and the reason the whole paper read as a list. A team
of the week is a *team*: it has a shape, and the shape is most of why you print
it.

It stands on `components/league/PitchRows`, which already drew the three other
elevens in the app (a rival's XI, a rival's squad, your own lineup), so the
front page costs nothing it was not already shipping. The cell is its own, not
`PitchPlayer`: that one takes a `RosteredPlayer` and prints his fixture and his
Fantrax points, and neither is what this section is about. The round is over, and
the two things worth knowing are what he did and whose he was.

**The lines come from core, not from a second sort here.** `TeamOfTheWeek.lines`
is the same men as `picks` in a second order — one is how they rank, the other is
where they stand — and `shape` is counted off the lines, so the formation printed
and the formation drawn cannot come apart. `picks` stays in score order because
the lead reads the first man his manager left out, and that only means anything
if the list is ranked.

## The columns

The three columns are `components/gazette/`, under `Column` rather than the
app's shared `shell/Section`. That difference is the point: a newspaper is ink
and rules on a page, and a stack of rounded, bordered, elevated boxes is a
settings screen no matter what is printed in it. Same information, hairlines
between items, heads in cream on a red rule.

`shell/Section` is unchanged and still right on the four screens that use it.

## States

**Sections with nothing to say do not appear.** An edition padded out with "no
transactions this week" is a worse paper than a shorter one. When there is
nothing at all, one of three `Nothing` panels renders, and which one matters:

- `unavailable` — Fantrax is not answering. The league is fine.
- `undrafted` — no teams yet. **Our real league is in this state until 10 Oct.**
- `quiet` — a drafted league with a genuinely quiet week.

Collapsing those three would tell a drafted league it has not drafted.

## Data

`edition()` assembles it from the gazette builders in
`packages/core/src/gazette/`. All pure — they are handed a snapshot and an
instant, never a clock.

## Known gaps

~~**Nothing leads.**~~ Closed 28 Aug — the lead is documented above, and the
running order that decides it is in `gazette/stories.ts`. It was recorded here
rather than smuggled into a restyle precisely because deciding what the lead *is*
was a behaviour change; it then got one.
