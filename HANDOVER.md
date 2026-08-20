# What's needed — 20 Aug 2026

Replaces the 19 Aug handover, whose own header said to delete it once lanes B
and C were done. They are. This one is **tracked**, because the previous one was
not and nothing outside one laptop knew what it said.

State: `main`, 35 commits ahead of `7944cf8`, working tree clean.
481 tests · typecheck · lint · build, green on every commit. **Nothing pushed.**

---

## 1. Blocked on Craig — and one of them blocks a design, not a task

### The `adminMode` probe has no control (ROADMAP §2)

The roadmap said the rehearsal league's four teams "belong to nobody". They
belong to **you**: `myTeamIds` returns all four and every team reports
`commissioner=true`. So a write there would succeed because the caller owns the
team, and would say nothing about writing one he does not.

That is a false positive, and it is the expensive kind — it would green-light
the cookie flow, member sign-in and the whole write surface on a premise nobody
had tested. The probe stopped before the mutating half for that reason, not out
of squeamishness about four disposable teams.

**What unblocks it: a second Fantrax account holding one rehearsal team.**
`replaceOwner.go` and `COMMISH_TEAM_PERMISSIONS` are both in the commissioner
hub. Then the probe has a control and its answer means something.

Established read-only, so it is not re-derived: the cookie authenticates and
carries commissioner rights; `adminMode: "true"` is accepted and echoed by
`getTeamRosterInfo` for any team; the hub publishes **`COMMISH_TEAM_ADMIN`**.
That is strong evidence the capability exists. A link key is not a probe.

**Everything downstream waits on this** — the member write surface, and the
write half of the player-notes store (§7), which is the same auth question
wearing a different hat.

### The playoff is real, and it is not a placeholder (found 20 Aug)

`shape-diff` found that Fantrax publishes the real league's playoff:

```json
{"lastRegularSeasonPeriod":34,"numPlayoffTeams":4,"firstPlayoffPeriod":35,"used":true}
```

The rehearsal league answers `used: false`, which is why nobody had seen it.
`league/competitions.ts` currently declares a **placeholder final in gameweek 38
between the top two**. The real thing is periods 35–38 between the top four, and
it is data rather than a decision waiting on you.

**Your call:** read it from `getLeagueInfo` and delete that half of
`PLACEHOLDER_ROUNDS`, or leave it until the cup is settled too. The cup is still
genuinely ours to invent; the playoff never was.

### Three review rows, still yours

`data/mappings/review/proposals.json` — `Fred Heath`, `Enzo Kana Biyik`,
`Lucas Pitt`. Only a person may write `unmappedBy: "manual"`. Unchanged since
19 Aug and deliberately not touched.

### Two one-line checks

- **The Vercel lever needs one look.** `apps/companion/vercel.json` skips a build
  whose commit touches nothing outside `data/snapshots`. Verified against real
  commits locally; only a real deploy proves it fires. Watch the next capture
  commit.
- **Rename the league in Fantrax.** It is still "Tim Hortons Pro League 24/25"
  and `/league/schedule` prints it verbatim, so on 10 Oct it reads 24/25 under a
  26/27 masthead. A setting, not code.

---

## 2. Waiting on football, not on anybody

- **21 Aug — GW1.** Everything in the live tranche is written and **unwitnessed**:
  the Final ladder's real timing, marker density across ten fixtures, whether
  `remainingEventPercent` hits literal zero at full time, whether Fantrax's
  totals move in-play at all. PLATFORM_NOTES holds the observation list.
- **28 Aug — period 1 ends.** Re-ask whether `?period=N` serves history. A screen
  now depends on the answer: the head-to-head board hedges on it in prose.
- **After the GW1 weekend** — judge the deferred design questions: does the
  trailing dim read at arm's length across eight cards; should finished pairings
  sort below live ones; do managers tap through to the board (which re-asks the
  Option A decision with data instead of argument).

---

## 3. What the preview is for

`scratchpad/preview/` — a fetch shim loaded with `node --require` before Next
boots, faking a live Saturday so the live-state tranche can be seen a day early.
`./run.sh {live|settling|provisional|final}`, `./run.sh stop`.

It runs from an isolated copy with a cold cache so it cannot poison the real
app's. It has already caught one real bug on its first day — `/squad/[teamId]`
lost its Pitch/List control the moment a period opened, which was invisible
because no period had ever opened.

**It is scratch and it lies on purpose.** Delete it when real football makes it
pointless. Its README lists what it cannot fake — chiefly that the rehearsal
league has four teams, so eight desk rows and sixteen scorelines are still
unseen.

---

## 4. The refactor is done, and the triggers are clear

Every item parked in the 19 Aug handover has landed:

| Parked | Now |
|---|---|
| `contribution` over four "what did he do" renderings | `chipsFor` takes the countable events structurally; the fixture list's third, drifted copy is gone |
| `leagueCache()` over nine `unstable_cache` wrappers | eleven of them, one helper — the key **cannot** omit the league id |
| `readerTeamId()` over six hand-discriminations | one, in `squads.ts` |
| split `app/page.tsx`, the over-ceiling test files | done; `selectors.ts` split into `round.ts` too |

**No file in the tree is over 300 lines.** No dead exported surface. No league
id or provider URL outside `config.ts` except the one in CI, which is the
environment half of §3 and named once.

Standing triggers worth knowing before the next change:

- The desk's rows are a **copy** of `PairingCard`'s grammar, second occurrence,
  diverged deliberately. A third earns the shared component.
- `RoundWord`, `ViewToggle`, `chipsFor`, `leagueCache`, `readerTeamId`,
  `roundState`, `pollSeconds` are all rule-of-3 landings from this session. Each
  one's file says what it is for; none is a wrapper.

---

## 5. Loose ends I did not take

- **`probe3.mjs` in the repo root** is orphaned scratch from an earlier session,
  superseded by `scratchpad/admin-probe.mjs` and by §1's recorded findings. It is
  untracked, so deleting it is unrecoverable — left for you.
- **`npm run bridge` not re-run.** `npm run bridge:check` says the mapping
  already covers every rostered player, and a regeneration rewrites
  `review/proposals.json` wholesale — the file holding your three rows. Churning
  a file with a person's pending decisions in it, to fix nothing, is the wrong
  trade. The gate is what will say when a re-run is actually needed.
- **`/fpl` has no pitch.** The roadmap said `PitchFrame` was free there; it is
  not. A pitch needs positional lines and the football layer deliberately carries
  no position — `element_type` is FPL's fantasy classification, which is why it
  was removed. An FPL pitch needs that carried by `fpl-entry`. Shape recorded in
  `docs/ui/fpl.md`; "keep the tab small" says it needs a reason beyond symmetry.
- **The Gazetta has no lead.** Four columns of equal weight, and the best story
  on the page — `left him on the bench` — is a footnote on a row. Deciding what
  the lead *is* is a behaviour change and was kept out of a restyle.
- **`/league` and `/squad` have no badges or records.** Both need a read those
  pages do not make.

---

## 6. Before every commit, still

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

And the ones a test cannot tell you:

```bash
npm run smoke        # every view, against whichever league it is pointed at
npm run shape-diff   # does the real league answer in the shape we built for
npm run bridge:check # is anybody's actual squad missing a footballer
```

All three are in CI now, on every push. The first two are also numbered steps in
the 10 Oct runbook, and `shape-diff` is the 11:00 one.

**Pushing is deploying.** `main` → Vercel production, no gate. The commit author
email is a deploy credential — it is set repo-locally, but a new worktree does
not inherit it.
