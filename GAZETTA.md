# The Gazetta — the plan

The paper's own roadmap. `ROADMAP.md` is the app's, and it has become a record of
what landed rather than a plan for what is next; this file is the live one for the
paper, and it obeys the same rule: **when an item lands, mark it here in the same
commit.** A plan that moves without its document is a document that lies.

Read `PRODUCT.md` for who this is for, `DESIGN.md` §4 for what a page may look
like, and `docs/ui/gazetta.md` for what every part of the paper already *is*.
Those three are binding and this file never overrules them.

**What the paper is, in one line:** a DRAFT newspaper about ten managers, not a
Premier League paper with a draft section. The real football is the classified
pages at the back.

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
| Prem match reports retired | the kind stays *readable* — `normalizeStory` refuses an unknown kind, so deleting the member would void nine filed stories with a green build |
| The app's nav returns to the paper | `gazette/Index` deleted; +66px of phone budget |
| The masthead is sized against the sheet | desk 72px → **120px**, phone fill 75% → **88%** |
| `Dateline` extracted at three | the furniture class string **declined at fifteen** — see below |
| `(paper)/page.tsx` split | 301 → 272 lines, under the §4 ceiling |
| A correspondent | **Franco Bell**, with the Richardson register named in the prompt |
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
`intel/projections/`, `intel/pressers/`, `intel/other-comps/`, plus the XI
export, which is the wrong round and has been failing `npm run intel-check`
for days.

*`GAZETTA_MODEL` was listed here as the next landmine and is not one.* Checked
17 Sep against the model table: `claude-opus-4-8` is **current and valid**,
$5/$25 per MTok, 1M context. It also stays 4.8 rather than moving to
`claude-opus-5` at the identical price, and the reason is worth keeping: on 4.8
an absent `thinking` parameter means no thinking, while on Opus 5 thinking is ON
by default — and `newsroom.ts` sends no `thinking`, so the free-looking upgrade
would silently think on every column of every firing.

**The league stays as it is until swap day** (Craig, 17 Sep: *"keep the 10 team
rehearsal league for now"*). `vars.FANTRAX_LEAGUE_ID` is left unset
deliberately, not forgotten. Worth knowing before anyone reads that sentence
literally: the **dummy** and **rehearsal** leagues both hold ten teams and, as
captured on 17 Sep, the *same ten names* — `123, test1, test2, test211, test3,
test31…` — so the phrase does not pick one, and in practice it does not need to.
`/swap-day` is the runbook that turns it, and CLAUDE.md records that this exact
dummy/rehearsal conflation was written wrongly in three places for a month.

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

| Day | Edition | Files | State |
|---|---|---|---|
| **Mon** | The Monday Club | `eleven` (Crooks), `power-ranking`, `dodgers` | exists |
| **Tue** | *(open)* | the form table, or Phase 3's `player` | free |
| **Wed** | The Mercato Wire | `wire` — on **detection** of a claim batch, not a calendar | event |
| **Thu** | *(open)* | **Craig's call, deferred** | open |
| **Fri** | The Form Guide | `round-preview`, `predictions` (Lawro), later `presser` + `predicted-xi` | event |
| **Sat** | The Pink 'Un | `tie-call`, `fixture-preview`, the Classified | event |
| **Sun** | The Sunday Edition | `tie-report` as the football stops | event |

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
period DESC → londonDayKey(filedAt) DESC → KIND_WEIGHT DESC → filedAt DESC
```

That is how a newspaper works — today's paper first, and within it the biggest
story is the splash. `KIND_WEIGHT`'s own reasoning survives intact *within* a
day, which is the only place it was ever an argument. **This is independent of
the schedule and improves the paper as it stands today.**

### Crooks and Lawro already exist

Both columns Craig named are already in the tree and already those men:
`ELEVEN` is *"Crooks-shaped"* and `PREDICTIONS` is *"Lawro-shaped"*
(`voice/columns.ts`), and `marking.ts` already scores the previous column's calls.

Between them they cost **one prompt paragraph**: Crooks's *"and finally, a word
about…"* sign-off — a digression about a manager, a referee, a crowd, something
not in the eleven at all. The 3 Sep ruling against per-man captions stands; that
was a diagnosis of the input, not of the format.

**Lawro's guest is blocked** and should not be faked: the real column scores him
against a celebrity guest, which here would mean a manager submitting picks — a
write surface, and `CLAUDE.md`'s auth constraint says that is the hard problem.
What works today is marking Franco Bell against the table, or against the
projections once they land.

---

## Phase 6 — the newsroom crew

The survey came back **nearly empty** for what this paper is: 161 catalogued
subagents with zero journalism agents; the largest journalism skill collection
(63 skills) has no sports, no page layout, no house-style enforcement and no
publication prose. The fantasy packs are all NFL redraft — advice, not narrative.

So commissioning is where the value is, and the discipline problem is §1:
**twenty columnists is exactly the bloat the rules forbid.**

**The rule that says where a thing lives** — into `PLATFORM_NOTES.md` before
anything is built:

- A **voice** *writes*. `scripts/edition/voice/`, bound to a `StoryKind`.
- A **check** *refuses or warns*. `packages/core/src/gazette/`, pure and tested.
- An **agent** *judges*. `.claude/agents/`, read-only, costs nothing on the cron.
- A **skill** is a *ritual a human starts*.

**The corollary is load-bearing: a new persona is a voice only if it FILES.** A
sub-editor that reads the paper back is an agent. A fact-checker is a check.

**Adopt `impeccable`** (Apache 2.0, in `~/worldcup-fantasy`) — 27 reference modes
whose own setup step reads PRODUCT.md and DESIGN.md, both of which exist here.
Vendor it unmodified with its LICENSE and record the exception in
`PLATFORM_NOTES.md` in the same commit; the justification is `tools/ui/`'s, which
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
| **2a** | The Premier League classified, in agate, on page 2, our men marked | — |
| **2b** | Cups and Europe in the classified | export |
| **3a** | Player articles, triggered on an availability **transition** | — |
| **3b** | Projections ranking, labelled `xPts (FPL)` and never beside `FPts` | export |
| **4** | Friday presser + predicted XI | export |
| **5** | The furniture package, the 4:5 picture well, the lead's opening paragraph | — |
| **6** | The crew, above | — |
| **7** | The daily paper, above | Thursday is Craig's |

**Deliberately not planned**: `round-preview`'s legacy `EditionKind` shape (a real
cleanup, but §7 forbids mixing a refactor with a behaviour change — its own
commit); and a captured football calendar, because `periodAlignment.json` is a
frozen test fixture with placeholder kickoffs on 33 of 38 rounds, and the
schedule keys on the **day**, which needs no calendar at all.

---

## Sequencing — one branch each

**Twelve PRs landed 17 Sep**, and steps 1 to 5 of this list are among them.
The working agreement had to exist before the list could be worked: `GAZETTA.md`
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
   **Gated on Craig's Thursday ruling** — a table whose every row says Monday is
   a mechanism with one value, which §1 refuses, so the schedule and at least
   one non-Monday column land together. Nothing below waits for it.
2. **`feat/paper-furniture`** — running head, three rule weights, ruled standing
   heads, foot folio, and the lead's opening paragraph.
3. **`feat/paper-classified`** → **`feat/player-stories`** → **`feat/rolling-tie-reports`**.
4. **Break weeks** — **must land before 9 Nov**, when the league hits its first
   empty week.
5. The export-gated work, as the sister repo delivers.

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
