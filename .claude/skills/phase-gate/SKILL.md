---
name: phase-gate
description: Close a phase properly — the four gates plus the push three, the UI instruments, the front page, a docs-drift pass, docs updated in the same commit, and a narrowly staged commit. Run at the end of every phase, never mid-phase.
argument-hint: "[phase]"
disable-model-invocation: true
---

# Closing a phase

A phase is closed when someone could pull the tree tomorrow and find the docs
true. Everything below exists because one of these steps was skipped and the
skipping was invisible until much later.

## 1. `/verify --push`

Four gates, then smoke, shape-diff and bridge:check. Report the test count.

## 2. `/audit-ui`

Sweep both widths, navfit, dialog. **The SVG bucket is a work list, not a pass** —
if the sweep reports one, shoot those routes and say what you saw.

## 3. The front page, every phase

```bash
node tools/ui/shot.mjs / front-390.png --width 390
node tools/ui/shot.mjs / front-1440.png --width 1440
```

Then **read both PNGs**. The season is live and `/` is what sixteen people open.
It has broken twice from changes that touched nothing on it — a token repointed
under `.paper`, a component that turned out to be shared — and both times the
phase that broke it reported green.

Also render both leagues where the phase touched league data. The canary is the
roster limits: read the squad and bench sizes off both `getLeagueInfo` payloads
(the real league's bench was unsettled before the 3 Oct draft), and the position
totals already differ: real D 6 · M 6 · F 4 · G 3, rehearsal 5 · 5 · 3 · 2.
One league rendering is not two.

## 4. Docs drift

Run the `docs-drift-auditor` agent over `docs/ui/*`, `docs/rules/DESIGN.md` and `CLAUDE.md`.
Every claim it returns STALE is either fixed or explicitly accepted with a reason.

## 5. Docs updated in the SAME commit

Not a follow-up. `docs/record/PLATFORM_NOTES.md` gets the architecture decisions, the
provider quirks, the numbers this phase measured and the exceptions taken — and
`docs/rules/CODE_RULES.md` requires any rule exception to be written there in the same
commit as the code that takes it.

If a doc paragraph is now false, correct it *and say it was corrected*, the way
`CLAUDE.md`'s env-file paragraph does. A silently edited doc teaches the next
reader nothing.

## 6. Stage named paths only

```bash
git log --oneline -3          # HEAD may have moved; another session commits here
git status --short            # know every path before you name any
git add <path> <path> ...     # never -A, never '.' — a hook denies both
git commit
```

House message style: a lower-case `type:` prefix, then a subject that says what
was **wrong**, not what was added. The body explains why, and names the fault the
change closes.

## Report

```
verify     test <n> · typecheck · lint · build · smoke · shape-diff · bridge:check
audit-ui   sweep <result> · navfit <result> · dialog <result> · SVG bucket <handled how>
front page 390 <read: what you saw> · 1440 <read: what you saw>
leagues    real <shape> · rehearsal <shape>
docs       drift <n> stale → <fixed|accepted why> · PLATFORM_NOTES updated <section>
commit     <sha> <subject> · staged <n> named paths
```
