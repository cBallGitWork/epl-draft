---
name: verify
description: Run the four gates CODE_RULES §7 requires before every commit — test, typecheck, lint, build — and with --push the three that only matter before code leaves the machine. Use before any commit, and before any push.
argument-hint: "[--push]"
---

# The four gates

`CODE_RULES.md` §7 is not advisory and the list is not four *of* the checks, it is
the checks. Run them in this order and in full.

```bash
npm test          # vitest across packages/*
npm run typecheck # core, scripts AND the app — three projects, one script
npm run lint      # ESLint. next build STOPPED running it at Next 16, so it is
                  # its own gate; without this line the rule is one check short
npm run build     # Next production build
```

All four green. No skipped tests, no `eslint-disable` without a reason on the same
line, no `@ts-expect-error` without a linked note.

**Report the test count.** "669 passed" is a fact the next session can compare
against; "tests pass" is not. If the count fell, say which file lost tests before
saying anything else.

**A gate you did not run is not a gate that passed.** If one is skipped — a build
already running, no network — say so in those words rather than reporting three
greens as four.

## `--push`

Before anything leaves the machine, three more. These are about the world, not
the code, which is why they are not in the four:

```bash
npm run smoke        # the running app answers on its real routes
npm run shape-diff   # the provider still returns the shape raw.ts claims
npm run bridge:check # the Fantrax→FPL mapping still covers the pool
```

`smoke` needs the app up (`npm run dev`, or `npm run start` after a build) and
takes `SMOKE_BASE`. `shape-diff` and `bridge:check` read live public endpoints.

Then, and only then:

```bash
git log --oneline -3     # HEAD may have moved; another session commits here too
git push                 # never --force; a hook denies it
```

**Rebase, never merge.** If the push is rejected, `git pull --rebase`. A merge
commit makes `HEAD^..HEAD` mean the other branch, which is what
`apps/companion/vercel.json`'s `ignoreCommand` reads to decide whether to deploy.

## Report

```
test       <n> passed / FAILED (<which>)
typecheck  clean / <n> errors
lint       clean / <n> problems
build      ok / FAILED
[--push]   smoke <ok|fail>  shape-diff <ok|drift>  bridge:check <ok|n unmapped>
```

Never round a skipped or unrun gate up to a pass.
