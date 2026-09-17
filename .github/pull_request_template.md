## What

## Why

<!-- The fault this closes. Link the doc rather than restating its argument. -->

Closes #

## Gates

- [ ] `npm test && npm run typecheck && npm run lint && npm run build`
- [ ] shot at 390 and 1440, and **looked at**, if anything visible changed
- [ ] docs updated in this commit — not a follow-up
- [ ] staged by named path, never `git add -A`

---

**Squash merge.** Vercel's `ignoreCommand` reads `HEAD^..HEAD`, so a rebase merge
leaves Vercel looking at the tip alone — a branch ending on a docs or `data/`
commit lands correctly and then silently never deploys. That has happened twice
here, at nine commits and at seventy-nine.
