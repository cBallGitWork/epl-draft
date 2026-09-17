## What

## Why

<!-- The fault this closes. Link the doc rather than restating its argument. -->

Closes #

## Gates

- [ ] `npm test && npm run typecheck && npm run lint && npm run build`
- [ ] shot at 390 and 1440, and **looked at**, if anything visible changed
- [ ] docs updated in this commit — not a follow-up
- [ ] staged by named path, never `git add -A`

## Refactor — both passes

On this branch, before it opened. Not a follow-up branch. Nothing found is a fine
answer; say so rather than leaving a box blank.

- [ ] **Pass 1 — counted, not judged.** Extracted at three, or the count declined
      at two:
- [ ] **Pass 2 — over what pass 1 left.** Orphaned imports, a binding whose last
      consumer went, a comment that outlived the thing it described, a read
      behind removed UI. The first pass cannot see its own leavings:

---

**Squash merge.** Vercel's `ignoreCommand` reads `HEAD^..HEAD`, so a rebase merge
leaves Vercel looking at the tip alone — a branch ending on a docs or `data/`
commit lands correctly and then silently never deploys. That has happened twice
here, at nine commits and at seventy-nine.
