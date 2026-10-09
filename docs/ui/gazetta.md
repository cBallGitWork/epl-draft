# `/` — the Gazetta

The front page, and the first thing ten people open: the lead, the week's
business, and when lineups lock.

## In reading order

1. **Masthead** — a masthead, not a page header. Every other section of the app
   opens with the crest at the left and the title beside it, because those are
   screens; this is a front page. The name is centred, set as large as a phone
   allows and **allowed to wrap** — two lines at this size is what a broadsheet
   does with a long title, and shrinking it to fit would trade the one piece of
   typography meant to be loud for a tidiness nobody asked for.

   **The name is the paper's, and the league's is the line above it.** It set
   `LEAGUE_NAME` at masthead size until 29 Aug, which is a screen announcing
   which app you are in; a masthead names the publication and puts the publisher
   in small capitals over the top. `PAPER_NAME` in `app/config.ts` is the title.

   Between rules, in ink, with a **dateline** under it: date at the left, season
   at the right, small capitals and letterspaced. That row is the whole
   difference between a masthead and an `<h1>`, and no app has one.

   The date is the **edition's** instant, not the reader's clock: two managers
   opening the same cached edition either side of midnight must not be shown
   two different days.

   **And then the paper starts.** Four rows and nothing else. Two more stood
   here until 3 Sep 2026 and both were cut on Craig's ruling:

   - a **plate** — the crest in a two-pixel ruled box beside `No. {round}` and
     "Free" — which spent a fifth of a phone screen saying what the crest at the
     top of every other tab already says, and set an edition number and a price
     nobody pays as though they were facts a reader wanted. DESIGN §9's
     "crest-in-a-box ships and is not a placeholder" is answered rather than
     contradicted: the deferred masthead photograph is still deferred, and the
     box that was holding its place is gone with it. When a league picture
     exists, it comes back as a picture.
   - a **standing line** under it, reading either "Football is on. The scores
     are moving." or when lineups lock. Both are said by the page already — the
     scoreboard strip appears exactly when football is on, and *Next deadline*
     in the sidebar carries the lock to the minute. A masthead that repeats the
     page pays for itself twice.
2. **The scoreboard**, while the round is running — a hairline band of every
   tie in one horizontally scrolling strip, yours first, the Live tab one tap
   away. See *The scoreboard* below. It replaced the full-height "As it
   stands" splash when journalism took the lead at all times.
3. **The lead** — a full-bleed picture band, then a kicker, a headline set larger
   than anything but the masthead, and a standfirst. See *The lead* below.
4. **The column**, when one has been filed about this round — and then it
   *leads*, taking the picture the desk chose and dropping the desk's own
   headline. It runs as a **splash** (`gazette/Splash`): the byline chip, the
   headline, the deck, the ornament rule, and the dateline with its writer's name,
   ending "read on".
   See *The written column* below.

   **The front page prints headlines and no articles at all**, and this is the
   second reversal of that rule in two days. It printed every filed story in
   full until 2 Sep — a magazine. It then printed the LEAD in full until 3 Sep,
   on the argument that a broadsheet runs its splash whole down column one; true
   of a broadsheet, and wrong about this object, because a whole column pushed
   the second story on the sheet some nineteen hundred pixels down a phone and
   left the two ranks below it as furniture nobody reached. A front page's job
   is to make a reader choose what to read, and it cannot do that while the
   first choice is already being read to him.

   `Written` still prints the article whole, at `/paper/{slug}` — a reader who
   tapped through has already chosen. `Splash` is `Written`'s opening block minus
   the prose plus the link; two components rather than one variant, because what
   they share is `gazette/StoryHead` and its chip, and what differs is whether the
   reader has chosen yet.
5. **The shoulders and the briefs** — everything else filed, at two ranks under
   the splash rather than one. `HEADLINES_SHOWN` caps the whole tail at eight so
   a busy round does not turn the front page into an index of itself.

   **News (bylined The Wire) and the bin are gone** (Craig, 1 Oct 2026: *"remove 'the
   wire' and news"*). The desk stopped filing both that day and their kinds were
   deleted on 9 Oct with the other retired columns; `normalizeStory` refuses a
   filed one, so it prints nowhere.

   The splash's own picture is `gazette/Drawing` when CI drew one and
   `gazette/Face` otherwise; it was `Splash.tsx` until 3 Sep 2026, which is the
   wrong word for a photograph — a paper's splash is its top story, and that
   name is now on the component that prints one.

   **On a desk the three ranks are one grid of equal cards** (Craig, 5 Oct 2026,
   with BBC Sport's desktop front page: *"copy this so the thumbnails dont
   stretch"*). From 28rem of the stories' own width (`@container/stories`) the
   lead spans two columns, picture over headline; from 42rem the grid is three
   wide, the lead takes two rows as well, the shoulders run down the third column
   beside it and the briefs follow as cards: picture, standing head, headline,
   dateline. 1280 and 1440 both get three: the sheet is capped at 72rem, so the
   stories measure 774 and 776px. The wrappers below are `display: contents`
   there, so phone and desk are one markup.

   **The two shoulders** (`SHOULDER_STORIES`, `gazette/Teaser`) run side by side
   directly under the lead, each with its standing head, headline, deck and
   dateline. Two columns on a phone too: the splash / two
   seconds / briefs shape is what a broadsheet does above the fold and what a
   news site does on a 390px screen, and it is the same problem solved twice —
   a reader has to be able to rank the top three stories before reading a word.
   The grid flows by column (`grid-flow-col auto-cols-fr`) rather than being
   fixed at two, because a round that filed only two stories has ONE shoulder
   and a lone half-width column with dead paper beside it is worse than a wide
   one.

   **The briefs** (`gazette/Brief`) take the rest: on a phone a row of
   thumbnail, standing head and headline, with no deck and no dateline —
   dropping them is what keeps the third rank visibly third. On a desk each is a
   card and carries its dateline, the grid's meta line.

   **Every rank carries a picture, all in one frame** — `.paper-frame`, 16:9,
   cropped and never scaled to fit: full-bleed over the splash on a phone, the
   card's width on a shoulder, a 96px thumbnail in a brief's row (`gazette/Face`,
   `ColumnistPhoto`, `Drawing`). A cut-out is sized off the frame's height, so his
   head stays in it at any width. *This reverses "a page that gave every story a photograph
   would be a page with no lead on it", which stood here until 3 Sep 2026.* That
   is true only while every photograph is the same size, and the reference Craig
   handed over — a news site's front page on a phone — pictures the hero, both
   sub-heads and every list item, and reads as three ranks anyway.

   **The man is chosen by the desk, never by the writer.** `faces.faceOf` takes
   him off the facts the brief was built from — the draft report's lead
   match-up's key man, the Team Sheet's biggest name in the day's news, the
   Line-Ups' starter the league holds and the round's pressers named, one declared
   fit again first (Craig, 9 Oct 2026) — and the Bin XI's desk picks its own, so the picture cannot contradict the prose and a
   model cannot name its way into the photograph. Null for a kind with no man in
   it, which is ordinary: Lawro's power rankings are about ten managers.
   It is stamped into `PublishedStory.face` at file time, and `PlayerImage`'s
   four rungs (this season's photograph, large then small, his club's kit, his
   initials) mean a man with no picture never borrows a wrong one.

   **The twin shoulders carry pictures together or not at all.** One card with a
   band and one without starts their headlines at different heights, and a pair
   of seconds that do not line up reads as a fault rather than as a rank.

   *This reverses what this list said until 3 Sep 2026.* The tail was a single
   flat column of up to eight `Teaser`s, all set identically, so the second
   story on the sheet and the eighth were the same size and the page had one
   rank on it under the lead. With the splash now a headline too, the three are
   three sizes of the same object, which is what makes the ranking legible.

   **Each opens its article**, on a `<Link>`: the article prints whole at
   `/paper/{slug}`, under `Folio` — THE GAZETTA, a link back to the front page
   (`← THE GAZETTA` on a phone), and the date. Then the article's own head:
   kicker, headline, deck, dateline; a pictured man prints under that head on a
   phone and in a column beside it on a desk.

   **One name per story, one name per level** (Craig, 9 Oct 2026: *"clean up the
   ui"*). A Team Sheet printed "Team news" as a page title, "The Team Sheet" as its
   kicker and again in its dateline, over the headline "Friday Pressers". The
   kicker is now `kickers.kickerOf`, the column's name else the edition's, at
   every rank; the folio prints no title; a dateline is the writer and the
   filing time, never the edition's name.

   *The paper had numbered pages from 2 Sep to 30 Sep 2026*: a strip of ink
   chips (`Pages`), "turn to page 2" on every dateline, a page number on every
   brief and folio, and two section pages, `/paper/reports` and
   `/paper/columns`. Craig cut them on 30 Sep (*"the pages thing doesnt
   work"*). Nothing became unreachable: the section pages printed only stories
   the front page already headlines, since `HEADLINES_SHOWN` is the whole paper.
6. **Also this week** — the next two DESK stories as headlines: a kicker and a line,
   no picture, no standfirst. The hierarchy *is* the design — a newspaper's
   second story is recognisable as the second story before you have read a word
   of it, and a page that gave every story a photograph would be a page with no
   lead on it.
7. **Team of the week** — the best XI across the whole league, **in the rail**,
   grouped into its lines and ranked by Fantrax's points for the period. One man
   per row: his name and owner at the left, his points at the right, a dash where
   Fantrax has not priced him (Craig, 1 Oct 2026: *"just put points"*). `benched` is
   appended to the owner when a manager left his own best player out — **and only
   when the arrangement it was read from is the one that was fielded**; see *What
   may be said about a bench* below.

   **A team sheet and not an annotated one.** The selector's column used to file
   a caption per man and this section printed them under each row; both were cut
   on 3 Sep 2026, Craig: *"the descriptiosn are the same 'STAT + quippy bit',
   pure ai shite."* He is right and it was structural rather than a bad run —
   one sentence per man, eleven at a time, written from a name, a slot and a stat
   line, has nowhere to go but the stat and a flourish. The eleven column
   survives as a column: the case for the side, where a pundit's
   argument is something a pundit can actually write.
8. **The three tables**, in the sidebar as a back page carries them: **Top
   scorers** (Fantrax's published season points — the player's own season, not
   what he earned his owner; headed with no source since Craig, 1 Oct 2026: *"just
   call it top scorers, and remove 'Fantrax FPts' header"*), the draft league (Fantrax's arithmetic,
   verbatim) and the Premier League (computed from finished fixtures, because
   FPL's own table is a dead field — three for a win is the competition's fixed
   rule and the football layer is where fixed rules may be constants).

   Rank · name · played · goal difference or owner · points, on hairlines, in
   the tabular face; a column no row carries is not printed, so the scorers chart
   has no played column and the draft table is rank, name and points alone
   (Craig, 1 Oct 2026: *"remove the WLT and gp, just points and names fine"*).
   None of the three is a link or a tap target — the sortable, tappable
   versions are on the League and Players tabs, where a manager goes to USE
   them, and these are the printed copies.
9. **The week's business** — trades and claims, grouped so both halves of a trade
   read as one deal. Fantrax's US Eastern timestamps are printed in London time
   (`fantraxTime`), with no zone in the heading (Craig, 2 Oct 2026: *"Times need
   to be local time"*).
10. **Next deadline** — the period boundary, with an explicit note that the
   commissioner's real lock is fifteen minutes before the first fixture and is
   not something Fantrax publishes.

Your own team is marked in the accent: your tie on the scoreboard, your men in
the eleven, your row in the draft table.

*The Doubts column, FPL's injury news across every squad, was cut on 1 Oct 2026*
(Craig pasted it and said remove it). The Mail tab's doubt letters still read
the same notes.

## The scoreboard

**Journalism leads at all times, and this section records the reversal by
name.** Until 31 Aug the splash here was "As it stands" — your tie enormous,
every tie under it, and the written column suppressed from the Friday lock to
the last whistle, on the rule that a headline is the one place a provisional
claim cannot go. That rule was about the PAGE, and it moved to the PIPELINE:
the writer decides what is safe to file, and every column carries its filed
instant, so a Friday preview printed under Saturday's moving scores is a dated
opinion rather than a claim about now. What remains on the page is the narrow
version: the desk's own manufactured stories (`stories()`) still wait for
`partial` to clear, because a fact-headline carries no dateline and would claim
the week.

The scores themselves became `Scoreboard.tsx`: a hairline band under the
contents strip, every tie as a stacked pair in one horizontally scrolling,
snap-pointed row, yours first with the accent on your name. Each cell is a
`min-h-11` link — yours to your matchup board, the rest to the Live tab, which
owns watching. The scrollbar is hidden; the cut-off ninth cell is what says
"more". The recorded fallback, if the scroller fails tapfit or the eye at 390:
a stack of one-line rows at desk density.

**While a ball is in the air, your tie is promoted to a scoreline banner above
the strip**, set the way a Saturday football paper sets the match it exists
for: the two names stacked in the display face, a dotted leader running out to
each figure, the figures at `text-4xl`, and a line beneath naming who is still
to come. It is *The Pink*'s banner — `WEST HAM ......... 2` — and the leader is
a dotted border on a growing span rather than a run of full stops, so it takes
exactly the room left at any name length and can never wrap.

The names are `paper-display` (Fraunces) and never `font-display`: Archivo
Narrow is the FIGURE face in both registers (DESIGN §6), and a name set in it
is a name wearing a number's clothes. The first cut
shrank it to 12px under a 34px headline, and the register warden called it:
docs/rules/PRODUCT.md's first principle says the live number outranks everything on
screen while a match runs, and it outranks the look. Between kickoffs the
row folds back into the strip — that is the principle's own relaxation
clause. The promotion is also what keeps `LiveStrip`'s stand-down on `/`
honest: the front page answers the question in full again while live.

**The page refreshes itself**, from the shell rather than from here — the
layout mounts the one `AutoRefresh`, which counts down the layout's `liveIn`:
30s while the round is under way, 300s otherwise, and a wake-up at kickoff.

**A figure that moved says so.** `Changed` wraps each total and flashes it to the
accent for 700ms when a refresh brings a different number, settling back to
whatever token the figure already carried so a trailing side stays dimmed. Under
`prefers-reduced-motion` it becomes a 400ms crossfade rather than nothing —
docs/rules/PRODUCT.md requires that by name, because this is the one signal whose entire
content is "it changed". The carve-out needs `!important`: the blanket
reduced-motion rule is itself `!important` and would otherwise collapse it.

**Three round questions, and they are not interchangeable.** `live` is a ball in
the air — the dot and the present tense. `partial` is football still to come —
what withholds the desk's own stories. `underway` is first kickoff to last
whistle — what the scoreboard asks, because before the first kickoff every total
is a legitimate nought and a strip reading 0–0 across eight ties would be
reporting a round nobody has played.

Not signed in is a neutral strip, not an empty one: the same ties, none promoted.

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
two as headlines. Core returns the fact and `sentences.ts` writes the sentence:
the same split the rest of the paper keeps, and the same words at both sizes, so
the lead and a headline can never disagree about what happened. `Picture.tsx`
chooses the photograph and `Stories.tsx` decides how loudly it is set — three
files, because the file that did all three had reached the ceiling.

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
accent is a reading aid for scanning a list of ten and there is nothing here
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
seconds. The column is written in CI by Claude from a facts-only brief, filed
as a story into `data/editions/paper.json` — the rolling paper — and baked
into the build.
A column that regenerated every thirty seconds would not be a column, and a
sentence about a score that has since moved is worse than no sentence.

**Lawro's predictions** file on Thursday evening and call every tie of the round
ahead, under Mark Lawrenson's name. Code makes each call and score;
`predictionRecord` marks every column he has filed against Fantrax's settled
results, the next one opens by owning last week, and his season heads his ties.
A pundit nobody marks is a pundit who never has to be right.

The page is laid out the way the BBC ran him. The headline is the desk's,
"Lawro's Predictions: GW6", with no chip or kicker saying it again. Under the
dateline sits his banner: name, billing, and a square crop of his photograph on
the right. Each tie is a bold heading, then his words with the first man they
name pictured beside them (`Face` at its `tie` rank, a 6rem square floated so the prose wraps), then
"Lawro's prediction".

**Derbies** (Craig, 8 Oct 2026): fifteen meetings carry names the managers gave them, by team id in
`data/leagues/derbies.json` (`derbyOf`). The page prints the name in small caps over the tie's
heading here and after "Full time" on a draft report's match-up, off the stored team ids, so a
column never depends on the writer naming it. Each brief also states it (`derbyBrief`), and the
checks pass over its words as they pass over a side's name: "Battle of York" is not hype. A derby
may hold more than two teams (the Milan Derby is any two of Ohi, Dome and Algie), and a pair with a
name of its own outranks the group's.

**Lawro's power rankings** (`season-rankings`) file once, between the end of the draft and the season's first
lock, under the desk's headline "Lawro's Power Rankings" and the same banner. His short opening comes first, then
the ten squads through `Ranks`: the number, the side and his line. The weekly power ranking's movement mark went
with that column on 9 Oct 2026.

**The round-report was deleted on 3 Sep 2026.** It was the preview's twin — one
article filed once the football stopped, about the whole round — and Craig's
ruling killed it: *"the back page is a league summary, dont do that, not the
whole league in 1 article"*. Its own prompt was the cause rather than the model:
*"Then SPREAD ACROSS THE LEAGUE: name several different managers, not one. A
paper about a whole league that only mentions two managers has failed."* It was
obeying.

*Retired 1 Oct and deleted 9 Oct 2026, with the eleven, the rankings and the dodgers below; the match and draft
reports cover a round now.* What reported a finished round was a **`tie-report` per tie** — a kind that had
a weight, a supersession row, a kicker and a page since it was declared, and that
nothing had ever assigned. Five ties, five stories, each about the two managers
in it and told to name no others. It is handed both totals, the margin, and each
side's scorers priced at **the slot each man was filed in** (`briefs/tieReport.ts`),
because Fantrax scores the slot and not the player. The front page's three ranks
are what sort them; the eleven, the rankings and the dodgers still carry the
league-wide read, which is where a league-wide read belongs.

**The draft report** (`draft-report`, a Saturday one and one at the end of the
gameweek) sets each match-up as a newspaper match report is set (Craig, 30 Sep
2026): the score with each side's goals and their minutes under it, the assists,
the clean sheets (a keeper's or a defender's only) and the score by day ending on
the substitutions' step when they changed it; then the story, with its own sepia
photograph set into the text (never the article's cover again), and the line-ups
as a report prints them, each side's bench under its eleven (`lineupText`,
`benchText`), after the story on a phone and beside it on a desk. No form strip:
Craig had it removed. A derby's name follows "Full time" (see Derbies, above).

**The two sketches were deleted on 3 Sep 2026** — the press room and the studio,
Craig: *"this is rubbish, ditch."* They were the paper's only invented-quote
columns and the only exception to HOUSE's "NEVER INVENT A QUOTE OR A REACTION";
the doctrine was that a sketch announced as a sketch may put words in a
manager's mouth. The exception is gone with the columns that needed it, so
nothing in this paper invents a quote now — which is the plainer rule and the
one HOUSE already states without an asterisk. Gone with them:
`StoryExtras.quotes`, `Quotes.tsx`, both briefs, both voices, the personas
table and the two studio names.

The whole-league `round-preview` went on 24 Sep 2026, having never filed: the
same objection applied to it, and `predictions` already calls every tie.

**It leads whenever it exists, and then the desk's headline is dropped.** Both
would be about the same match — a fact-headline and a written one, stacked,
saying the same thing twice. The picture stays, because the story is the same
story and the desk is what chose the photograph for it.

**On the front page it leads as a HEADLINE.** The prose is at `/paper/{slug}`,
one tap away, and `Splash` prints the block that gets you there. Reversed 3 Sep
2026 — see item 4 of the reading order for the argument, which is about how far
down a phone the second story ends up.

Until 31 Aug this rule read "and the football has stopped" (`!underway`),
because a preview filed at the Friday lock would otherwise lead all Saturday
saying "nobody has kicked a ball" under moving scores. *The scoreboard* section
records where that safety went: the pipeline decides what is safe to file, and
the filed instant prints on the column, so a dated Friday opinion under
Saturday's strip is honest in a way an undated one was not.

**When nothing has been filed the paper is facts-only and says nothing about
it.** A paper does not apologise for the column it has not got — the state our
own league is in until 10 Oct.

Two mechanisms replaced the old one-column-a-round gate, and neither is
`editionMatches` (which went with `latest.json` on 31 Aug). `normalizePaper`
in `app/paper.ts` drops every story filed about another league, which is what
keeps rehearsal prose off the real front page. `composePaper` then drops what
has expired and retires what a later story superseded, and orders the rest
newest filed first (Craig, 9 Oct 2026: *"always lead with the most recent
article"*); a story's kind only breaks a tie between stories filed at one
instant. So what leads is the latest filing, and an old opinion still standing is
one nothing has answered yet, printed under its own filed date.

**The one exception is the Line-Ups, which lead until the lock** (Craig, 9 Oct
2026: *"Predicted line up becomes the headline article until deadline"*). The
newsdesk stamps the round's lock on the assignment and the filing carries it as
`leadsUntil`; until then they lead whatever files after them, and from the lock
the paper is newest first again. A story filed without one orders by filing.

The filing time prints. Every other figure on the page is thirty seconds old and
this could be three days old and still be the current edition; a reader is
entitled to know which he is reading.

Team names are joined from ids the writer returns, never from names he types: a
name typed by a model goes stale the day somebody renames their team, and
renaming your team is the first thing ten people do.

## The eleven has a shape, and the shape is not a picture

It has been both things. Eleven rows on hairlines read as a table — the same
faceless line eleven times — so on 29 Aug it became a pitch, on the argument
that a team of the week is a *team* and the shape is most of why you print it.
The shape was worth having; the size it came in was not. A pitch is the largest
object a page can carry, and at a phone's width the grass ran most of a screen
on its own: the front page had become a picture of a team with a newspaper
wrapped round it. Craig's call, same day.

**The lines stay, the grass goes.** It is a rail column grouped by line, with a
small-capital position label over each group. The head no longer prints the
formation (Craig, 1 Oct 2026: *"dont have formation in text"*); the lines show it. That
also puts it where it belongs in the reading order: the eleven is the one block
in the rail anybody reads for pleasure, so it leads the rail and the tables,
the business and the deadline follow.

**The lines come from core, not from a second sort here.** `TeamOfTheWeek.lines`
is the same men as `picks` in a second order — one is how they rank, the other is
where they stand. `picks` stays in points order because
the lead reads the first man his manager left out, and that only means anything
if the list is ranked.

## The predicted elevens are printed, not written

Added 21 Sep 2026. `predicted-xi` files on a Friday, an hour behind the press
conferences, and it is the paper's first column with **no voice, no brief and no
model call**. `dispatch.prepare` returns a commission that is either a voice and
a brief or a set of facts, and the firing loop takes the printed one straight to
`file`: there is no prose, so there is nothing to sub-edit and no name to check
against a brief.

The argument is the one that deleted the eleven's captions on 3 Sep. Every word
of this column is a name, a position or a count, and a writer handed two hundred
and twenty footballers can only mis-transcribe them.

**`Lineups` prints a tie at a time**, alphabetically by HOME club, both elevens
under one ruled section with the kickoff over them. Crest, club, formation, then
the eleven in the source's own order — keeper first, the shape read out after
him, never regrouped.

**Side by side at every width, including a phone** (Craig, 21 Sep 2026). They
stacked below `sm` for one afternoon, and stacked they read as a list of twenty
clubs rather than ten matches. The position gutter and the type step down at
phone width instead, which is what buys the second column.

**The position is the FOOTBALLER's, and that is the whole point of the layer
split.** `RCB`, `DM`, `AM`, off the squads export, and a dash where that export
had only FPL's `element_type` to go on — a fantasy classification is not a fact
about a man. It is his general position and not his position in *this* eleven:
Liverpool play Szoboszlai at right-back and he prints as `DM`, which is true
about him and not about the team sheet.

**A man somebody holds is marked; a free agent is not.** The reverse of the Team
Sheet's rule, and for a reason the Team Sheet does not have: a bracket on every
one of two hundred and twenty names is noise, and the question this list answers
is which of them are already owned. The mark is `yoursInk`, so the reader's own
men are in the sheet's one print red.

**A tie prints both elevens or neither.** `predictedLineups` refuses rather than
repairs: a side `xiFault` rejects, or one naming a man the snapshot cannot, is
dropped and takes its fixture with it. The body says how many of the gameweek's
matches survived, so an absence is stated and never silent.

**Under the team-news writer's byline**, like the rest of team news (Craig, 30 Sep
2026: "yes bylines"). It had none from 21 Sep, when the house name over a listing
the desk printed from an export read as a claim somebody wrote it.

## The sheets at the lock are written a side at a time

Added 26 Sep 2026. `sheets` files once the round's lineups lock: every manager's side as Fantrax
holds it, grouped by the week's head-to-heads, in the BBC's team-news shape. `Sheets` prints a
head-to-head under `Home v Away`, then for each side its paragraph, `{TEAM} XI · 3-4-3`, the eleven
on the pitch, and **`Substitutes:`**. Where the two sides meet on the pitch is woven into a paragraph
(Craig, 26 Sep 2026), never a line of its own.

**The pitch is the app's own** (`PitchRows` + `PitchMarker`, as the Prem club eleven draws it), a
colour plate under DESIGN §5, keeper at the top, lines by Fantrax slot. Under each name, his real
match as it stood when the article filed ("v EVE (H)"), stamped into the cargo so an old sheet
never shows next week's fixture. It replaces the text XI line: one eleven, drawn once.

**The names are printed and the paragraph is written.** The eleven and the bench come off the
roster in slot order, by the shirt name FPL gives; the model never sees them as something to copy.

**Stacked on a phone, side by side from `@3xl`.** The reverse of `Lineups`' rule, for a reason it
does not have: each side here is a paragraph, and two paragraphs at 390px are two 170px columns of
prose. The `v` heading keeps it one match. At a desk one paragraph across the sheet was a
1,100px line, so the sides split there.

**The reader's own side is in `yoursInk`**, in the heading and on its XI label, and nowhere else.

## The Bin XI is picked by the desk and argued by the column

Added 30 Sep 2026. `bin-xi` files on Tuesday morning: the best eleven nobody in the league has, from
the gameweek just played, titled "Top Bins" (Craig, 30 Sep 2026) in the edition "Bins Out". `BinXi`
prints `THE BIN XI · 5-4-1 · 81 PTS`, the eleven on the app's pitch with each man's Fantrax points
under his name, then **`Bench:`** and a `Key stats` list. Stacked on a phone; from `@3xl` the pitch
sits beside the bench and the stats, where alone it filled the 1,120px sheet.

**Everything but the prose is the desk's.** The side, the points, the bench and the key stats are
cargo stamped at filing, because Wednesday's waivers change who is in the bin. The standfirst is the
desk's too: what the piece is and the one comparison, the eleven's total against the league's sides.
xG and xA print as figures in the key stats and never in the column (Craig, 28 Sep 2026).

**The bench is the hard-luck men**, the ones whose chances were worth most against what they
scored, as many as the league has reserves. It is where the real-life numbers show on the page.

## The columns

The three columns are `components/gazette/`, under `Column` rather than the
app's shared `shell/Section`. That difference is the point: a newspaper is ink
and rules on a page, and a stack of rounded, bordered, elevated boxes is a
settings screen no matter what is printed in it. Same information, hairlines
between items, heads in ink small capitals on an ink rule.

**Two colours, and the second one is spent on what is live.** The heads were the
league's red over a red rule until 29 Aug, on the argument that ink heads would
compete with the masthead for the darkest mark on the sheet. A masthead outweighs
a 10px label by size and weight rather than by hue, and eight red heads down a
page is what made the front page read as a themed screen. The sheet now prints
ink at an opacity and one print red — the LIVE mark, "yours", and the crest,
which is a printed mark rather than page furniture and keeps the brand red the
rest of the page may not reach for. `paper.css` re-points `--color-league` at the
print red for exactly that reason, and `.crest` restores it.

`shell/Section` is unchanged and still right on the four screens that use it.

## The sheet's class strings

Named at the third site, as the desk's are in `desk.ts`; ink is the caller's wherever two inks are in use, since an
appended second ink loses on stylesheet order.

| Name | File | What it is | Sites (9 Oct 2026) |
|---|---|---|---|
| `RULE` | `gazette/rules.ts` | a faint rule's colour, `--paper-rule`; the caller names the side | 10 |
| `HAIRLINES` | `gazette/rules.ts` | the faint hairline between a list's rows: `divide-y` alone rules them in each row's own ink | 7 |
| `STANDING_CAPS` | `gazette/heads.ts` | `3xs` semibold tracked capitals, no ink: a standing head, the masthead's and folio's dateline rows | 5 (and `(paper)/not-found` writes it out) |
| `STANDING_HEAD` | `gazette/heads.ts` | `STANDING_CAPS` in muted ink: a label over a list, a panel or a line of figures | 15 |
| `KICKER_CAPS` | `gazette/heads.ts` | the same capitals in bold, no ink: a card's standing head | 3 |
| `QUIET_CAPS` | `gazette/heads.ts` | the same at the body's weight in faint ink: a dateline, who is left to play | 3 |
| `CAPTION_CAPS` | `gazette/heads.ts` | a caption's capitals, `2xs` and `tracking-widest`, no weight and no ink | 8 (3 inked by the caller) |
| `CAPTION` | `gazette/heads.ts` | `CAPTION_CAPS` in muted ink: a kickoff, a club's fixture, a quote's credit, the line over a side's eleven | 5 |
| `SUBHEAD` | `gazette/heads.ts` | an article's section head, a club or a tie, in the display serif at `xl`: never tracked capitals | 3 |

## States

**Sections with nothing to say do not appear.** An edition padded out with "no
transactions this week" is a worse paper than a shorter one. When there is
nothing at all, one of three silences renders (`gazette/Silence`), set as the
sheet sets a story: the provider's tell as a standing head, then a headline and
its deck in the paper's faces, never the desk's `shell/Nothing` (8 Oct 2026).
Which one matters:

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


## The paper's routes

Added 2 Sep 2026, when the writer filed its first columns; the numbered section
pages went on 30 Sep 2026 (see the reading order, item 5).

| Route | What |
|---|---|
| `/` | The front page. |
| `/paper/{slug}` | Any one story, printed whole. `storyHref` in `components/gazette/paperPages.ts` builds the link. |
| `/paper` | Redirects to `/` — a prefix is not a page. |
| `/paper/reports`, `/paper/columns` | Redirect to `/`: the section pages, cut on 30 Sep 2026. |

**No strip on the sheet; the app's navigation beside it.** The app's six
sections were printed here once — `gazette/Index`, in the paper's register —
because the rail stood down on `/` and a front page with no way out is a dead
end. Craig reversed that on 16 Sep 2026 (*"blue bar on side, should show the
regular menu options like the other pages, dont have it on paper"*): the rail,
down the side or along the foot, is on the paper like every other route, so `Index` was the
same list twice in two registers and is deleted. The paper's own numbered strip
(`Pages`) followed on 30 Sep.

**The dateline is one component across three ranks.** `Splash`, `Teaser` and
`Written` each set the same letterspaced small capitals, opened with the same
`{edition} · ` prefix and printed the same `Filed {time}`; counted at three on
16 Sep 2026, which is the rule-of-2/3 bar met rather than felt, and extracted to
`gazette/Dateline`. Two things are the caller's: the wrapper element, because a
splash's dateline is a block and a teaser's is the last line inside a
`TurnLink`, and a `<p>` inside a `<span>` is markup a browser fixes by
unnesting; and the turn-line, which `Written` declines because it IS the
article, so "read on" there would point at the page you are on.

The class string is named by weight, not once, because the weights are not noise: one constant over all three
would be followed by some sites and overridden by the rest, the DASH failure CODE_RULES §4 names. The three weights
of `font-sans text-3xs uppercase tracking-[0.16em]` are `STANDING_CAPS`, `KICKER_CAPS` and `QUIET_CAPS` in
`gazette/heads.ts`, counted in the table under "The sheet's class strings" (9 Oct 2026).

**The display block is one component across three renderers** (8 Oct 2026). `Splash`, the desk's own lead
(`Stories`) and `Written` each set the same headline, standfirst and 24px rule under the same inverted chip;
`gazette/StoryHead` draws the three, and the front page's silences under their tell (`Silence`), and exports the
chip as `KICKER`. Two things are the caller's: the chip's paragraph, because the lead's follows its picture and takes
a margin the others do not, and the headline's step at width (`rank`, the front page's or an article's). The paper's
own 404 sets an `h1` a step tighter, unbalanced, and keeps its standfirst and rule written out: two of each.

**The page turn** is `document.startViewTransition`, driven by `TurnLink` — the
paper's only client component. Not React's `<ViewTransition>`, which ships only
in the experimental channel and is absent from the React this app pins. 200ms
and `--ease-out-quart`, per DESIGN §7. A browser without the API navigates
normally; `prefers-reduced-motion` is declined in `TurnLink` and cut again by
the blanket rule in `globals.css`, and no carve-out is owed because a turn
carries no information beyond "you navigated".

**Known gap:** an article page reads `paper.json`, which keeps the most recent
stories. Nothing has ever fallen off it; when one does, that slug 404s into the
paper's own "Not in this edition" until an archive reader exists. Deliberate —
the app makes no runtime filesystem reads, and adding one for a case that has
not happened is machinery for nothing.
