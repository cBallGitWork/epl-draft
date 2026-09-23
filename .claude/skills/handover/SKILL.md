---
name: handover
description: Write the handover the next session will actually act on — gathering the commit range, the gate results, the branch position and the clock FIRST, so every number in it is real. Use at the end of a working session or before a long gap.
argument-hint: "[topic]"
disable-model-invocation: true
---

# Write the handover

`docs/record/HANDOVER.md` at the repo root is read first by whoever comes next, and it is
read newest-first, so the top of it carries the load. The root keeps exactly
one.

**Move the one it replaces to `docs/archive/handovers/<its-date>.md` rather than
overwriting it.** Git keeps the bytes either way, but a handover names hazards,
deliberate absences and open questions that outlive its own state line, and the
next reader who finds "the 29 Aug handover" cited in a commit message or a
PLATFORM_NOTES entry should be able to open it without a `git log`. Archived
first, in the same commit:

```bash
mkdir -p docs/archive/handovers
git mv docs/record/HANDOVER.md docs/archive/handovers/<date-of-the-one-being-replaced>.md
```

## 1. Gather the facts BEFORE writing prose

```bash
git log --oneline -1                                  # where the last one was written
git log --oneline <prev-head>..HEAD | wc -l           # commit count for the header
git rev-list --left-right --count @{u}...HEAD         # ahead/behind — say it in the header
git status --short                                    # what is uncommitted, and whose
.claude/hooks/repo_clock.sh --print                   # days to the swap, capture health, one-offs
```

**Run the gates rather than repeating yesterday's result.** "669 green" is a
claim about this tree now. If they have not been run since a rebase, say exactly
that — the last handover did, and it was the most useful line in it.

## 2. Lead with the finding that reorders the rest

Not with what you built. If something learned late changes how the earlier work
should be read, it goes at the top and says so. Never silently edit a section a
later discovery reversed — say it was reversed, and record the reversal, the way
docs/rules/DESIGN.md does for the paper stock.

## 3. The shape

- **Header:** branch, ahead/behind, tree state, and whether the gates were run
  *on this tree* or before a rebase.
- **The one thing to do first**, in one line, at the top.
- **What was built** — the boring half included, because it is the half that is
  easy to get wrong and easy to redo by accident.
- **What was NOT built and why** — an absence read as an oversight gets rebuilt.
- **Hazards** — parallel sessions, running servers, rewritten hashes, which
  `.env.local` is which.
- **Still Craig's** — numbered, and each one says what it gates. The second
  Fantrax account gates the entire write track; that is worth repeating.

## 4. Facts, then prose

Every number in it is one you just ran. A handover with a stale test count is
worse than one with none, because the next session trusts it.

## 5. Stage narrowly

```bash
git add docs/record/HANDOVER.md docs/archive/handovers/
```

Those paths. Never `-A` — a hook denies it, and another session may be
mid-commit in this tree.
