# What's needed — 2/3 Sep 2026, the Premiership day

Replaces the 29 Aug handover. State: `main`, **72 commits ahead of `origin/main`,
NOT pushed**, nothing behind. Working tree **clean**. `npm test` (880 across 89
files) · `typecheck` · `lint` · `build` (27 routes) were all run **on this tree,
just now** — not before a rebase, not yesterday.

Seventy-three commits since 2 Sep, from two sessions in one tree. One built the
paper out into a real newspaper with pages; the other built `/prem`, the section
for the actual Premier League. Neither has left the machine.

---

## 1. Push. This is now the third handover opening on it.

The 27 Aug handover opened on unpushed work. The 29 Aug one opened on it again,
at **24 commits**. It is **72** now, and `origin/main` has none of the paper's
pages, none of the Premiership section, and none of four bug fixes — two of which
are live faults on routes that already shipped.

Production is serving code from before 29 Aug while five days of work looks done.

**Rebase, never merge** — `vercel.json` reads `git diff HEAD^ HEAD`, so a merge
commit shows it an empty diff and it skips the build.

---

## 2. The finding that reorders the rest: two live bugs were on shipped routes

Neither was looked for. Both were found by writing new code beside old code, and
both are in `origin/main` right now:

- **`/league?sort=toString` was a 500 anybody could type.** `isSortKey` guarded
  with `value in COLUMN`, and `in` walks the prototype chain — `toString`,
  `constructor`, `valueOf` and `__proto__` all passed it, and `COLUMN[key].of`
  was then `undefined` when `sortRows` called it. `Object.hasOwn` now, both order
  modules, with the four names in the test (`f706189`).
- **Typecheck was red on `main` for part of the day.** `f62a1f3` correctly made
  `RosterLimits.maxActivePlayers` nullable and left two callers without the
  decision the type's own docblock demands. `teamOfTheWeek` now names nobody
  without a stated XI size — the position caps sum to fourteen, so both eleven
  and fourteen are inventions — and `LineupPlanner`'s empty-places notice does
  not appear (`f7c9dea`).

**What this says about the tree**: a guard copied between two modules carried its
bug with it, and a nullability change landed without its callers. Both are the
kind of thing only a second reader finds. The `/prem` review that would have
looked for more of them **did not finish** — see §7.

---

## 3. What was built — `/prem`, the FA Barclays Premiership

Five routes, from `docs/ui/reference/cm9900/24.jpg`, which is itself a Premier
League table screen. `docs/ui/prem.md` is the page-level doc.

| Route | What it is |
|---|---|
| `/prem` | The table, sortable, with both cut lines |
| `/prem/results` | Finished rounds, newest first |
| `/prem/fixtures` | Rounds to come, soonest first |
| `/prem/team-stats` | The twenty ranked by one of seventeen measures |
| `/prem/club/[code]` | A club stub, so the table's names are real links |

**It is the inverse of `/league`, and that is the point.** `/league` quotes
Fantrax's arithmetic and may never compute a table, because three-for-a-win is a
commissioner setting. `/prem` must compute one, because three-for-a-win is a rule
of the competition — and because FPL publishes `played`/`win`/`draw`/`loss`/
`points` on every club as nought with two rounds signed off.

**Rail label is `Prem`, route `/prem`.** "Premiership" wraps in a 64px rail;
`navfit` confirms `Prem` fits at 320 and that a sixth section still fits the
frame. The bar carries the full name.

Measured, not judged: `sweep` clears AA at 390 and 1440 with no sideways page
scroll; `tapfit` passes with nine recorded exceptions — the sortable column
heads, the class `/league` records eight of. **Both instruments carry their own
route lists**, so a new section is invisible to them until added; `/prem` is in
both now.

### The shared half, which is the half easy to redo by accident

- **`components/shell/TabStrip`** came out at the third copy — `SectionNav`,
  `TeamTabs`, `PremNav`. `GroupNav` deliberately did NOT join: it wraps, it is
  drawn shorter, and it lists stat groups rather than routes, so folding it in
  costs two props for a second shape. Do not "finish the job" by absorbing it.
- The two strips **disagree about label type** — 11px on the section, 9px on the
  team — and that disagreement is carried across as a named `labels` prop rather
  than reconciled, because a refactor and a visual change may not land in one
  commit. It still wants settling.
- `PageHeader`, `Caption`, `TableHeads`, `Nothing` and both cached football reads
  were reused unchanged. The section costs **no provider request**.

### `.cm-title` — the shadow, repo-wide

`cm9900/24.jpg` sets its title in a soft shadow offset down-right. Worn by
exactly three things: the `h1` in both of `PageHeader`'s bars, and the panel
caption. **Not** the tab labels, column heads or rail — flat in every reference
shot. Set in `em` so it scales between 20px and 30px. DESIGN §6 records it.

### The football layer gained three counts, with a bound

`SeasonTotals` now carries `goals`, `assists`, `cleanSheets` (651/651 on FPL's
bootstrap, probed 2 Sep). The rule that kept them out is unchanged — it forbids
the two providers' counts of one fact **side by side**, and `/prem` carries no
Fantrax number at all.

**The bound is in the docblock and a reviewer must enforce it: these may not
appear on a fantasy screen beside a Fantrax figure.** Verified by grep on 2 Sep
that nothing reads them outside core; `StatBoard`'s "Underlying (FPL)" view
enumerates an explicit ten-key list that excludes all three. A `season.goals` in
the league register is a defect.

---

## 4. What was NOT built, so it is not rebuilt by accident

- **`/prem/player-stats`.** Craig, 2 Sep: *"leave the player stats bit for now,
  that's a full section on its own."* The football layer already carries what it
  needs. **There is no foot row** because of it — Player Stats belongs there
  beside Team Stats, and a foot row of one is the stray button Craig rejected on
  1 Sep. The row comes back with the second entry.
- **The club page is a stub on purpose** and says so on screen. Identity, place,
  record. The squad, fixture run and season are named as still to come — a screen
  that simply stops is one a reader assumes is broken.
- **No position column anywhere in `/prem`.** FPL's `element_type` is FPL's own
  fantasy classification and is why position left the football layer.
- **FPL's `teams[].position` is not carried into the domain.** It is the one team
  field that is *not* nought — distinct on all twenty — but it sits beside a
  `played` of nought on every club, so it orders nothing anybody has played.
  `football/table.ts` used to claim it was nought; corrected, both there and in
  PLATFORM_NOTES.

---

## 5. Hazards

1. **Two sessions share this tree, and one hard-reset it mid-run.** A `git reset
   --hard` plus a stash swept a finished, verified commit out from under the
   other session; it was recovered by blob hash from `stash@{0}` and re-committed.
   Nothing was lost, but it cost an hour. **Commit scoped and early**, stage named
   paths, and never `git add -A` (a hook denies it anyway).
2. **A dev server is running on :3000** (pid was 71317) and a headless Chrome on
   **CDP 9261** belongs to the *other* session. Do not assume either is yours.
3. **`shot.mjs` cannot capture against Chrome 152 headless** when a second client
   drives the same browser: it sets the viewport *before* navigating and
   `Page.captureScreenshot` then never returns. Enabling `Page`, navigating,
   settling, and overriding metrics **last** works. The instrument was left
   unchanged — the failure was not reproduced on a single-client browser — but it
   is recorded in PLATFORM_NOTES.
4. **`notFound()` answers HTTP 200 app-wide.** `/gw/999` and
   `/players/nosuchplayer` do it too, so it predates `/prem`. A genuinely unknown
   route (`/nosuchroute`) correctly 404s. **Worth settling before 10 Oct** — a
   soft 404 is a page link checkers and crawlers believe.
5. **Capture is OVERDUE on `dummy` and `rehearsal`** as of 3 Sep. League state is
   not being recorded and **this history cannot be backfilled**. `npm run
   capture:status` is the check; pull before running `capture`, because it counts
   directories and cannot tell "the cron stopped" from "this tree never pulled".
6. Two `.env.local` files and they are not interchangeable —
   `apps/companion/.env.local` for the app, the repo-root one for `edition`.

---

## 6. The one thing to do first

**Push.** Then set a capture running before more history is lost.

---

## 7. Left running, and resumable

The adversarial review of `/prem` — five dimensions (correctness, layer split,
DESIGN register, CODE_RULES, docs-truth) each fanning out to independent
refuters — **was stopped before it finished** when the session was called. Two
findings it was written to look for were fixed by hand first (`next/image` handed
an empty `src`; a `Record` interface shadowing TypeScript's own), but its verdict
is unknown.

Resume it:

```
# the script lives under the session that wrote it, so find it rather than retype it:
find ~/.claude/projects/-Users-craigball-epl-draft-1 -name 'prem-section-review-*.js'

# then:
Workflow({ scriptPath: "<that path>", resumeFromRunId: "wf_67b70438-6d9" })
```

Completed agents replay from cache. If the run has aged out, the script is still
a good starting point — it names the specific traps worth re-checking.

---

## 8. Still Craig's

1. **Create a second Fantrax account owning one rehearsal team.** Unchanged, and
   still the critical path for the lineup write: without it every `adminMode`
   probe is a self-write and proves nothing. **This gates the entire write
   track.**
2. **Choose a masthead photograph.** The crest-in-a-box ships until then and is
   not a placeholder.
3. **The 10 Oct league swap — 37 days out.** `FANTRAX_LEAGUE_ID` to
   `ayyoh3n2mr326v2o`, *and* the separate environment in
   `.github/workflows/editions.yml`, which inherits nothing from Vercel. Miss the
   second and CI keeps filing a column about the rehearsal league.
4. **Whether `/prem/player-stats` is the next section**, and whether Team Stats
   then moves down into the foot row where the game files it.

---

## 9. Before every commit, still

```bash
npm test          # 880 across 89 files, all green on this tree
npm run typecheck
npm run lint
npm run build
```

Plus an eyeball at 390×844 and at ≥lg. `node tools/ui/navfit.mjs` after any
chrome change, `sweep` and `tapfit` after any visible one — and remember both
carry their own route lists, so a new route is unmeasured until it is added to
them.
