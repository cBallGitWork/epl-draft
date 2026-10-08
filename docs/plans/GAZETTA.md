# The Gazetta — the plan

The paper's own roadmap. `docs/plans/ROADMAP.md` is the app's, and it has become a record of
what landed rather than a plan for what is next; this file is the live one for the
paper, and it obeys the same rule: **when an item lands, mark it here in the same
commit.** A plan that moves without its document is a document that lies.

Read `docs/rules/PRODUCT.md` for who this is for, `docs/rules/DESIGN.md` §4 for what a page may look
like, and `docs/ui/gazetta.md` for what every part of the paper already *is*.
Those three are binding and this file never overrules them.

**What the paper is, in one line:** a DRAFT newspaper about ten managers, not a
Premier League paper with a draft section. The real football is the classified
pages at the back.

**The paper files seven weekly kinds (Craig, 1 Oct 2026), to keep the bill down:** the Prem match reports, the
draft report (once, when the gameweek ends), the Bin XI, the Team Sheet (pressers), the predicted elevens, the draft sheets at the deadline and
Lawro. News, the wire, the eleven, the power ranking, the dodgers, tie reports, tie calls and fixture previews no
longer file; the
newsdesk does not queue them. Their writers are still in the tree until the clean-up after GW6.

---

## Where we are — 17 Sep 2026

**Phase 0 is done.** GitHub Actions had refused every job since 11 Sep. The cause
was the Actions **spending limit sitting at $0**, not a failed card. 40 commits
were unpushed and production was serving 12 Sep.

Now: billing raised, main pushed, `Verify` green, captures caught up — and
`ANTHROPIC_API_KEY` set, which turned out to be the bigger of the two.

**The paper had never filed from CI at all.** The repository held **zero Actions
secrets** until 17 Sep, so `write-edition.ts` would have thrown on every firing
it ever reached. The sixteen stories in `data/editions/paper.json` were written
by running `npm run edition` locally on 2 Sep. Fixing the billing did not fix
this; it uncovered it.

**The working agreement is live**, and this document is now worked the way it
describes: no commits on `main`, one branch per item, squash merges. Proven on
the first three PRs — `verify` runs on a feature branch, Vercel raises a preview
per branch, and a squash landing does deploy to production. The one trap found
by doing it: a PR **stacked** on another branch is auto-closed when that branch
is deleted on merge, so branches are cut from `origin/main` rather than from
each other.

**Shipped 16–17 Sep**, all four gates green on each:

| | |
|---|---|
| Prem match reports retired | the kind stays *readable* — `normalizeStory` refuses an unknown kind, so deleting the member would have voided the four filed on 2 Sep (this row said nine; they were cleared 18 Sep). The old brief and voice were deleted 28 Sep |
| The app's nav returns to the paper | `gazette/Index` deleted; +66px of phone budget |
| The masthead is sized against the sheet | desk 72px → **120px**, phone fill 75% → **88%** |
| `Dateline` extracted at three | the furniture class string **declined at fifteen** — see below |
| `(paper)/page.tsx` split | 301 → 272 lines, under the §4 ceiling |
| A correspondent | **Franco Bell**, with the Richardson register named in the prompt; since 30 Sep a staff writer per kind (PLATFORM_NOTES) |
| Articles revalidate at 300s | a story is published by a **deploy**, not a revalidation |
| The Actions bill | **$15.88 → ~$2.51/month** |

**The refusal worth remembering**: the furniture class string
`font-sans text-3xs uppercase tracking-[0.16em]` reads at **fifteen** sites — far
past §1's bar — and was still not extracted, because it appears in three weights
and the weights are not noise: bare is a dateline, bold is a standing head. One
constant would be followed by eight sites and overridden by seven, which is the
DASH failure §4 names. It stays duplicated until the *roles* are split.

---

## What can still stop the paper — one thing, not two

**The sister-repo exports.** Three phases are blocked on files that
`~/ai-carling-premiership` has the data for and does not yet write:
`intel/projections/` and `intel/other-comps/`. **The XI is no longer one of
them**: since 23 Sep `scout-xi.yml` fetches Scout's elevens here every two hours,
so `readXi` finds the round the pressers preview and the predicted-elevens column
can file.

*`intel/pressers/` landed 21 Sep with the Team Sheet.*

*`GAZETTA_MODEL` is `claude-opus-5-5` from 1 Oct (Craig).* $4/$20 per MTok, below 4.8's $5/$25. It always
thinks, so the writer sends `effort: "medium"` explicitly and `max_tokens` is 16,000. The helper stays Sonnet 5,
and from 8 Oct writes the puns too; proofs run one match-up with no send-back unless `GAZETTA_FULL=1` (PLATFORM_NOTES).

**The column follows whatever league production serves** (Craig, 17 Sep: *"keep
the 10 team rehearsal league for now"*; 23 Sep: *"We shouldn't be hard coding any
Fantrax league"*). Until 23 Sep the editions job read an unset
`vars.FANTRAX_LEAGUE_ID` and wrote about the dummy league, on the belief that
dummy and rehearsal, which carry the same ten team names, were interchangeable.
They weren't: production serves rehearsal and `normalizePaper` drops other
leagues' stories, so every CI firing filed stories nobody could see. The job now
asks production (`/api/league`), so the column and the site cannot disagree and
the swap needs nothing from CI.

### ~~A live fault~~ — fixed, 17 Sep (#7)

`"bank"` was in `BANNED` and two published headlines used it, because the check
warned and filed anyway. It now sends the column back once — `subedit.ts` — and
files with a louder warning only if the rewrite offends again. The argument for
warning ("would throw away a good story over a surname") had been answered by
`banned.ts` matching whole words; what was left was a warning nobody read.

**The two headlines are still published.** Nothing rewrites a filed story, and
they leave by the ordinary route — `MAX_PAPER_STORIES` is 24 and they are two of
sixteen from 2 Sep.

---

## Phase 7 — the paper comes out every day

Craig: *"i want weekly articles, work on a schedule — each day has its own unique
articles."* **The most valuable thing left.**

**The measurement that proves it.** `data/editions/paper.json` holds 16 stories
and every one was filed on **two days**: six on Wed 2 Sep and ten on Thu 3 Sep —
ten being exactly `GAZETTA_STORY_CAP`. Five days of that week produced nothing.

Three faults, all in the trigger and none in the prose:

- **Nothing in the desk knows what day it is.** `newsdesk()` is a three-boolean
  state machine over one gameweek, and `desk.finished` fires on whichever firing
  first sees the round over.
- **The masthead lied about the day.** `editionName` falls through to "The Monday
  Club" for anything filed Mon–Fri, so a Wednesday filing printed as Monday's.
- **`desk.finished` stays true for 4–5 days of 7** — FPL keeps `is_current` on a
  played round until the next deadline — so the finished branch is re-evaluated
  on all ~110 weekly firings and the covered-key ledger is the only thing
  stopping a re-file. There is no time-based suppression anywhere.

**The week is Sunday-anchored, and that is load-bearing.** A Monday-first week
puts the last whistle on day six, at or after every slot, so the whole week
releases the moment the round ends — a no-op wearing a schedule's clothes.
Sunday=0 puts the whistle on day 0 with nothing slotted there. It is also
`getUTCDay()`'s own numbering, so the index is free.

**London, not UTC**, and the argument is consistency rather than the hour:
`bylines.ts` already stamps the edition name in London, so a desk picking the
slot in UTC would commission the Monday set and print it under "The Sunday
Edition" — two clocks disagreeing inside one filing.

**Only half the week is scheduled, and that is the design.** Friday, Saturday and
Sunday are gated on events that already *are* times — the lock, a kickoff, the
last whistle — and land on the right day without being told. Bolting a weekday
onto them would be a second clock arguing with the first.

**The league's actual week** (Craig, 17 Sep 2026) — the schedule is built on
this and not on a guess about when things happen:

| Day | What the LEAGUE does | Edition | Files |
|---|---|---|---|
| **Sun/Mon** | the round ends, either night | The Monday Club | `eleven` (Crooks), `power-ranking`, `dodgers` |
| **Tue** | **nothing at all** | Bins Out | `bin-xi`, "Top Bins": the best eleven nobody has — SHIPPED 30 Sep, see below |
| **Wed 17:00** | waivers process, free agency opens | The Mercato Wire | `wire`, on **detection** of a claim batch |
| **Thu 16:30** | Thursday's press conferences in | The Team Sheet | `presser`: Thursday's conferences, once the Mac's 16:00 import has merged |
| **Thu 18:00** | the evening before the round | The Form Guide | `predictions`, Lawro's calls on every tie — SHIPPED 24 Sep (the evening before an earlier lock) |
| **Fri 16:00 / 16:30** | predicted elevens out; Friday's pressers in | The Form Guide | `predicted-xi` **16:00**, then `presser` **16:30**: Friday's conferences |
| **Fri night / Sat noon** | deadline closes, gameweek begins | The Pink 'Un | `sheets` at the lock (every side as locked, SHIPPED 26 Sep), `tie-call`, `fixture-preview`, the Classified |
| **Sat/Sun** | matches | The Sunday Edition | `tie-report` as the football stops |

**The Team Sheet is a column per conference day (Craig, 8 Oct 2026).** Thursday's conferences file on Thursday and
Friday's on Friday, each from 16:30 London once the Mac's 16:00 import has merged, until the lock (`TEAM_SHEET` in
`gazette/editorial.ts`). From 7 Oct one Friday column carried both days, on *"team sheet Friday"*; the next evening Craig
wanted Thursday's back, at 16:30. Thursday's cron band opens at 15:00 UTC to reach 16:30 London in either clock.

**Tuesday is the only day with no league event, which is what makes it the right
day for the evergreen piece** — the form table, `player` articles, the
projections ranking. Nothing competes with it there. A day with nothing on it is
not a problem to be filled; it is the slot a feature has been waiting for.

### The cron cannot reach two of these days

Measured against the firing bands in `editions.yml`, in London time:

| Column | Publishes (London) | First cron look | Gap |
|---|---|---|---|
| Wed — the wire | 17:00 | 18:00 | 1h late |
| **Thu — presser round-up** | **15:00** | **07:00 — morning band only** | **cannot file Thursday at all** |
| Fri — presser round-up | 15:00 | 18:00 | 3h late |
| Fri — predicted elevens | 16:00 | 18:00 | 2h late |

**Thursday is the blocker.** `15 6-9 * * 4` is a morning sweep and there is no
Thursday afternoon band, so a 15:00 column would wait until Friday evening — a
Thursday column that cannot publish on Thursday. The schedule work adds the
bands with the columns; neither is any use without the other.

The others are lateness rather than loss: every one of these kinds files on
detection or on a covered-key, so a late firing still files, it just files late.

**The bands, and they must hold under both offsets.** 15:00 London is 14:00 UTC
in summer and 15:00 in winter; 16:00 London is 15:00 and 16:00. So a band
covering the Thursday round-up and Friday's pair starts at **14:00 UTC**:

- **Thursday**: add `0,30 14-17 * * 4` beside the morning sweep.
- **Friday**: widen `0,30 17-23 * * 5` to `0,30 14-23 * * 5`.

**Cost: about 60 extra runs a month, roughly 48p.** Actions bills a whole minute
per run, so the arithmetic is run count — 34 for the Thursday band and 26 for
Friday's three extra hours, against the ~2,314 the repo now fires. Worth stating
because the crons were trimmed the same week and a schedule that quietly undoes
that trim is the kind of thing nobody notices for a month.

**§1 bites here: a table whose every row says Monday is a mechanism with one
value.** The table and at least one non-Monday column land in the same commit,
or neither lands.

### The half the reader actually sees

Even a perfect schedule changes nothing on screen, because `composePaper` sorts
`period → KIND_WEIGHT → filedAt`. `eleven` is weight 40 against `tie-report`'s
90, so Tuesday's fresh column lands eighth and **the reader opens Tuesday's paper
to Sunday's splash.**

Insert the London day before the kind:

```
period DESC → londonDayOf(filedAt) DESC → KIND_WEIGHT DESC → filedAt DESC
```

That is how a newspaper works — today's paper first, and within it the biggest
story is the splash. `KIND_WEIGHT`'s own reasoning survives intact *within* a
day, which is the only place it was ever an argument. **This is independent of
the schedule and improves the paper as it stands today.**

### Crooks and Lawro already exist

Both columns Craig named are already in the tree. `ELEVEN` is *"Crooks-shaped"*
(`voice/columns.ts`). **Lawro is Lawro** — SHIPPED 24 Sep 2026: the predictions
column files on Thursday evening under Mark Lawrenson's own name, in his voice
(`voice/lawro.ts`), with every call and score made by code and his record marked
from the archive. PLATFORM_NOTES carries the decisions.

**Lawro's power rankings** — SHIPPED 5 Oct 2026 (Craig: *"can lawrenson do a season predictions based off the
draft results?"*, then *"just talk like its a power rankings, dont mention playoffs places"*): once, between the
end of the draft and the first lock, the ten squads as drafted, strongest first, a line a side, ordered by code
(`gazette/season/`) with the editor's moves from `data/editions/editor.json`.

Between them they cost **one prompt paragraph**: Crooks's *"and finally, a word
about…"* sign-off — a digression about a manager, a referee, a crowd, something
not in the eleven at all. The 3 Sep ruling against per-man captions stands; that
was a diagnosis of the input, not of the format.

**Lawro's guest is blocked** and should not be faked: the real column scores him
against a celebrity guest, which here would mean a manager submitting picks — a
write surface, and `CLAUDE.md`'s auth constraint says that is the hard problem.
Craig also ruled out the Computer as a guest on 24 Sep: his picks only, and the
numbers stay off the page.

---

## Phase 6 — the newsroom crew

The survey came back **nearly empty** for what this paper is: 161 catalogued
subagents with zero journalism agents; the largest journalism skill collection
(63 skills) has no sports, no page layout, no house-style enforcement and no
publication prose. The fantasy packs are all NFL redraft — advice, not narrative.

So commissioning is where the value is, and the discipline problem is §1:
**twenty columnists is exactly the bloat the rules forbid.**

**The rule that says where a thing lives** — into `docs/record/PLATFORM_NOTES.md` before
anything is built:

- A **voice** *writes*. `scripts/edition/voice/`, bound to a `StoryKind`.
- A **check** *refuses or warns*. `packages/core/src/gazette/`, pure and tested.
- An **agent** *judges*. `.claude/agents/`, read-only, costs nothing on the cron.
- A **skill** is a *ritual a human starts*.

**The corollary is load-bearing: a new persona is a voice only if it FILES.** A
sub-editor that reads the paper back is an agent. A fact-checker is a check.

**Adopt `impeccable`** (Apache 2.0, in `~/worldcup-fantasy`) — 27 reference modes
whose own setup step reads docs/rules/PRODUCT.md and docs/rules/DESIGN.md, both of which exist here.
Vendor it unmodified with its LICENSE and record the exception in
`docs/record/PLATFORM_NOTES.md` in the same commit; the justification is `tools/ui/`'s, which
is that it is an instrument rather than shipped code.

**It is a tool, not a substitute for the direction.** An earlier draft had
`impeccable` *answering* the art direction. It no longer needs to: the direction
was produced on 16 Sep by five independent art directors and four judges, and its
masthead findings are already shipped. What remains for it is the furniture.

**Reject, and record why**: the de-slop skills' *rules* contradict this house
directly — *"no em dashes"*, *"kill every adverb"*, US English. Harvest their
phrase lists into `BANNED`; never take their prompts. **A house style is the
product here, so a foreign one is not a starting point.**

---

## What is left, by phase

| | What | Blocked on |
|---|---|---|
| **1c** | Tie reports that update through the day — the covered-key carries `tieState` | — |
| **1d** | Draft pedigree as a decaying `ledger` thread, re-opened if the drafting manager bins him | — |
| **2a** | The Premier League classified, in agate, our men marked | — |
| **2b** | Cups and Europe in the classified | export |
| **3a** | Player articles, triggered on an availability **transition** | — |
| **3b** | Projections ranking, labelled `xPts (FPL)` and never beside `FPts` | export |
| **4** | ~~Friday presser + predicted XI~~ — both landed | — |
| **5** | The furniture package, the 4:5 picture well, the lead's opening paragraph | — |
| **6** | The crew, above | — |
| **7** | The daily paper, above | Thursday is Craig's |

**Deliberately not planned**: ~~`round-preview`'s legacy `EditionKind` shape~~
(done 24 Sep 2026: the kind went whole, having never filed); and a captured football calendar, because `periodAlignment.json` is a
frozen test fixture with placeholder kickoffs on 33 of 38 rounds, and the
schedule keys on the **day**, which needs no calendar at all. **A foot folio**,
dropped on Craig's word of 30 Sep 2026: a page number is the numbered pages
he cut that day (*"the pages thing doesnt work"*), and the paper has none.

---

## Sequencing — one branch each

**Twelve PRs landed 17 Sep**, and steps 1 to 5 of this list are among them.
The working agreement had to exist before the list could be worked: `docs/plans/GAZETTA.md`
itself (#1), the conventions with thirteen labels and a milestone (#2),
`@claude` on-demand review (#4), the state update (#6), the banned fix (#7), the
two-pass and one-line-comment rules (#8, #9).

- [x] 1. `refactor/edition-clock` (#10)
- [x] 2. `feat/todays-edition-leads` (#11)
- [x] 3. `feat/crooks-signoff` (#12)
- [x] 4. `docs/newsroom-rule` (#13)
- [x] 5. `docs/intel-contracts` (#14)

**What is left, in order. Only the first is gated.**

1. **`feat/publishing-week`** — `schedule.ts`, the newsdesk rewiring, the
   `editionName` cases and Thursday's column **as one commit**, per §1.
   **No longer gated** — Craig gave the league's week on 17 Sep and Thursday's
   column is the press conference, which his own calendar answers rather than a
   preference. It carries the cron bands with it: there is no Thursday afternoon
   firing today, so a 2pm presser column could not publish on a Thursday.
   Blocked instead on `intel/pressers/26-27.json` (§5 of the export contract).
2. **`feat/paper-furniture`** — running head, three rule weights, ruled standing
   heads, and the lead's opening paragraph.
3. **`feat/paper-classified`** → **`feat/player-stories`** → **`feat/rolling-tie-reports`**.
4. **Break weeks** — **must land before 9 Nov**, when the league hits its first
   empty week.
5. The export-gated work, as the sister repo delivers.

### The Line-Ups — 21 Sep 2026

Craig: *"we just take the predicted eleven logic that we use in the repo, and
publish it… put the teams in a list. Use a team logo, group them by match up,
use th eplayers real position here, not fpl position for a list"*. Shipped the
same day, and `docs/ui/gazetta.md` carries what it is.

The one thing it changed about the paper's machinery: **a column can now be
PRINTED rather than written.** `prepare` returns a voice and a brief or a set of
facts, and the printed one skips the writer, the sub-editor and the strangers
check, because there is no prose for any of them to read. That seam is what the
Premier League classified (2a) will use when it lands.

Two things deliberately left, so they are not re-litigated as oversights:

- **The position is the man's, not the slot's.** Szoboszlai prints as `DM` while
  Liverpool play him at right-back. The export carries a general position per
  player and a per-line COUNT per club, and nothing joins a starter to the line
  he is predicted in without guessing. His own position is true; a guessed one
  would not be.
- **The ties are alphabetical by HOME club** (Craig, 21 Sep 2026), which answers
  §*Order the clubs by something* below for this column, though not for the Team
  Sheet. Each tie still carries its own kickoff.

### The Bin XI — 30 Sep 2026

Craig: *"article for tuesday morning, Bin Players of the week — valid formation for the league;
players not on a squad; use mostly fpts but also real life stats too whether its shots, xg etc"*.
A sports editor, a draft-league writer and an engineer reviewed the plan before it was built.

- **The points are Fantrax's, over the period's own days.** `getPlayerStats` answers a date range
  (PLATFORM_NOTES, 30 Sep), free agents included; the stats league answers shots and chances over
  the same days, and FPL gives xG and xA. Joined through the bridge, never by name; a scorer the
  bridge lacks is left out and named in the firing log.
- **A valid formation is read, not listed**: every count between the league's minimum and maximum
  per position summing to its active total (`formations`). No total or no minimums, no side.
- **Mostly points, and real life moves the close calls.** A man ranks on his points plus half of
  what his chances were worth beyond what he scored, priced at the league's own goal and assist
  values (`BIN_XI.luck`). Across GW1–5 it moved 17 of 55 places, all on ties at 2 or 6, and never
  cost more than 2 points; no club put more than 4 men in, so there is no per-club cap.
- **Only starters make the eleven**; a cameo scorer does not.
- **Positive facts only about how he got there**: who had him this gameweek, who dropped him and
  ahead of which gameweek, who drafted him, and once for the side, who went undrafted. Never the
  draft's round, never "unwanted" (the check refuses it), never "never owned".
- **The checks refuse the market** (claim, waivers, Wednesday), a source, a figure or a name the
  brief lacks, and a verdict on neglect; they send back ownership words, roles and length. A column
  that fails twice on a hard fault is not filed, and the next Tuesday firing tries again.

Left deliberately: a midweek round still being played on Tuesday has no Bin XI that week; a man's
waiver status and next fixture are not printed (the wire owns the market, and a fixture is a tip);
the wire does not yet say who was claimed out of Tuesday's eleven.

### The Team Sheets at the lock — 26 Sep 2026

Craig: *"once deadline hits, team sheet reveals for all players, report like a sports journalist
… comment on changes made, any debuts, how many changes from previous week, any surprise
benchings using projections … straight talking, pure factual … group by match up, comment on
any match up narratives like both starting from the same defence, striker vs a keeper"*. The
model is the BBC's pre-match team news: per side, two or three sentences, then the XI and the
substitutes.

Kind `sheets`, one article per round, keyed `sheets:gw{n}`, filed from the lock until the round
finishes (not `!started`: a 12:15 lock and a 12:30 kickoff fall inside one cron's delay).
Headline, deck and the elevens are the desk's; the model writes only each side's paragraph and
each head-to-head's meeting line. Every fact is computed in `gazette/sheets/`: changes against the
previous period's stored rosters, debuts against every earlier period, a man benched or dropped
despite his form (a return last time out, or goals and assists over his last three: Craig, "benched
despite getting a goal/assist last week"; the projections are not read at all), a starter in form
over his last three rounds, a starter with no fixture, Fantrax's own latest story on a
starter, one who might not start for his club, and where the two sheets meet on a real pitch (a forward against a keeper or defence in the
same match, or one club's defence on both sheets), woven into a paragraph with the real fixture and
never a separate line.
Each side's eleven stands on the app's own pitch, with his real fixture stamped in at filing, as
the BBC's graphic does.

Craig, the same day, on the first write: *"Don't quote FPL or %'s, Fantrax has its own player
summary which uses real sentences"*, *"Don't literally say projected or mention predicted elevens"*,
*"Just say unchanged, don't count weeks"*, and *"you're a real sports reporter and your audience is
a real reader"*. So no source is ever named, an unchanged side is only unchanged, and a man FPL
lists unavailable whose Fantrax story predates the listing (Millar's goal for Hull, after his loan)
gets the status in one word rather than the stale story.

Read over the same day by an editor and a UK team-news reporter (subagents). Their chief
finding: the brief carried Fantrax's own sentences, and the writer copied them, credits, tense and
international news included ("not certain to be risked for Portugal", "Rodon faces eight-to-10
weeks"). The brief now carries no provider sentence: a man out or a doubt is a status and one
injury word read off his latest Fantrax report (`flags.injuryIn`), the men out are one fact that
leads the side, and each man carries his club and fixture in words. A pencil corrects a banned
phrase that has one right answer ("sits on" → "is on") before the editor reads.

`sheets/checks.ts` refuses a wrong change count, a debut or an "unchanged" the facts do not give,
a named source or a percentage, and a stranger; it sends back opinion, a count of unchanged rounds,
a repeated opening, a phrase shared between sides, and a phrase from last round's paragraph. A side
whose paragraph fails twice prints the desk's plain line.

Left deliberately:

- **An unread earlier period files nothing.** A missing period would turn a change into a debut,
  so the key stays unspent and the next firing retries.
- **The real league's first round is period 6 with nothing before it**, so it files as "first
  sheets" with no changes and no debuts.
- **No face.** The splash picture is the drawing, as for any lead.

### The Team Sheet, after its first review — 18 Sep 2026

Craig had a newspaper production editor and a top-10k draft manager read the
filed column cold. They found the same three faults independently, and the ones
below are what survived that did not land in the same session.

- [ ] **`feat/team-sheet-fixtures`** — the column names no opponent, no kickoff
  and no clock. The editor's proof that this matters: Alonso's quote says the
  squad is *"coming to Brentford"* and Brentford has its own section four inches
  below it, so **Chelsea v Brentford is on the page twice and never joined up.**

  **Design it on OUR lock, not FPL's.** Craig, 18 Sep: *"its one deadline for
  the whle weekend fyi"* — Fantrax locks the lineup once per period, fifteen
  minutes before the round's FIRST kickoff. So nothing in this column resolves
  before a reader is committed: every "decision Friday" lands after his lock.
  The column's job is therefore to flag RISK before the lock, never to tell him
  when to check back. A per-fixture deadline is classic FPL's shape and would be
  the wrong model imported wholesale.

- [ ] **`feat/team-sheet-replacements`** — *"Every OUT is a promotion for
  somebody, and the promoted man is the claim. None are named."* Jaissle says
  his midfield "will be a young one" and the column does not say whose. This
  needs a depth chart we do not hold; deriving it from minutes would be a guess
  printed as a fact, which is the exact failure this column spent a day fixing.
  Blocked on an export, or on a designed answer.

- [ ] **Mark free agents POSITIVELY.** Unowned is currently the ABSENCE of a
  bracket, and a name the bridge failed to match renders identically — one of
  those states means "claim him" and the other means there is a bug. Also carry
  his POSITION: Fantrax pays the slot, so a free agent is unusable without it.

- [ ] **Importance is FPL's season numbers today, and should not stay that way.**
  `assemble.faceOf` ranks the day's men on goal involvements, influence and
  minutes to choose the picture and the lead. Craig's better signal, 18 Sep:
  *"use draft position/fpl scoring mix ... (or fantrax most owened by %"*. Both
  need an export we do not have.

- [ ] **Order the clubs by something.** Source order serves nobody — it is the
  order Fantasy Football Scout happened to publish in. Craig's call on 18 Sep was
  to keep the club-by-club shape for now.

**Settled in the same session, recorded so they are not re-litigated:** the
headline stays *"Thursday Pressers"* — the editor called it *"a column slug, not
a headline"* and wanted the day's news in it, and Craig had already ruled for a
static day headline a reader recognises every week. `Back` became `FIT` because
it collided with "back" the injury three lines away.

---

## Verification

Four gates on every branch before it leaves:

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

Beyond them, and none of these is optional:

- **`GAZETTA_STORY_CAP=2 DRY_RUN=1 npm run edition`** — prints assignments and
  briefs, writes nothing, spends no key. For Phase 7, run it **seven times with
  the clock stubbed to each weekday**, then to a break week, and read the
  assignments back.
- **`newsdesk.test.ts` needs no edits**: its fixture is a Monday in both UTC and
  London, so the Monday set still releases in order. *Add* a Sunday-evening case
  that files the tie-reports and **none** of the Monday set.
- **A new `schedule.test.ts`**, with two rows that carry the design:
  `2026-09-13T23:30Z` is UTC Sunday and London Monday → releases Monday's three,
  which pins the timezone decision; `2026-11-15T23:30Z` is Sunday both ways →
  releases nothing, which proves it is the zone and not the hour.
- **`/shoot` at 390 and 1440, and LOOK at the images.** After the `composePaper`
  change the question on that image is whether *today's* story is at the top, and
  prose cannot answer it.
- **`tools/ui/sweep.mjs`** (78 route/width combinations) and **`tapfit.mjs`** for
  anything visible; **`register-warden`** on every visible diff;
  **`docs-drift-auditor`** before closing a phase.
- **`npm run intel-check`** must go green before Phase 4 ships.
