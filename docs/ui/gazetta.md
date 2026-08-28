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
2. **A live bar**, only while football is on — a link straight to `/matchday`,
   with the pulsing live dot.
3. **The lead** — a kicker, a headline set larger than anything but the masthead,
   and a standfirst under it. See *The lead* below.
4. **Team of the week** — the best XI across the whole league, with its shape.
   Each pick shows what got him picked (`2G · CS`, or minutes if nothing else)
   and who owns him. `left him on the bench` is printed when a manager left his
   own best player out — **and only when the arrangement it was read from is the
   one that was fielded**; see *What may be said about a bench* below.
5. **The week's business** — trades and claims, grouped so both halves of a trade
   read as one deal. Fantrax's timestamps, shown verbatim with their zone named
   in the heading, because they carry a US Eastern offset.
6. **Doubts** — FPL's injury news across every squad, with chance of playing.
   `no word` when FPL has no opinion, which is not the same as 0%.
7. **Next deadline** — the period boundary, with an explicit note that the
   commissioner's real lock is fifteen minutes before the first fixture and is
   not something Fantrax publishes.

Your own team is marked throughout with the left-edge accent border
(`yoursBorder`) — and the same one, on a different ground. The class it returns
sets a border *colour* plus an explicit left width, so on a ruled row with no
`border` utility it draws the accent bar and nothing else. One treatment, two
grounds, and `mine.ts` stays the only place that knows what "yours" looks like.

## The lead

`lead()` in `packages/core/src/gazette/lead.ts` picks it, and the running order
is an editor's argument rather than a measurement — a one-point finish and a
manager benching the week's best keeper are not the same kind of thing, and a
number claiming to convert between them would be an arbitrary weight wearing the
costume of an answer. In order: **a match decided by nothing**, then **a manager
who left the week's best player out**, then **a hammering**, then **a trade**.

Four kinds, four headlines, one shape. Core returns the fact, `Lead.tsx` writes
the sentence — the same split the rest of the paper keeps.

| kind | kicker | reads |
|---|---|---|
| `squeaker` | Down to the wire | *test2 edged test4* — 41–40. 1 point in it. |
| `bench` | Left out | *test3 left Pickford out* — he is in the week's eleven. test3 lost 31–45 to 123. |
| `rout` | No contest | *test2 took test4 apart* — 41–19. 22 points between them. |
| `trade` | Business | *123 and test3 have traded* — Adrien Truffert to 123 · Gabriel Magalhaes to test3. |

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

**Nothing leads.** A paper's front page has a lead story and this one has four
columns of equal weight — the best story on it is `left him on the bench`, and
it is printed as a footnote on a row rather than as a headline. Building that
means deciding what the lead *is*, which is a behaviour change and not a visual
one, so it is recorded here rather than smuggled into a restyle.
