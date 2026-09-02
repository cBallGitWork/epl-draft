---
name: refactor
description: The end-of-feature-run refactor pass — two passes over everything since the last refactor commit, counting duplication before extracting it, debloating, de-hardcoding, and hunting bugs in the RENDERED output rather than the source. Use after a run of feature work, before the week's last push.
argument-hint: "[since <ref>]"
---

# The refactor ritual

Feature work leaves sediment: the third copy nobody counted, the pipeline behind
UI that was deleted, the comment that describes a constant's old value. This is
the named pass that clears it. It is **one commit**, behaviour-preserving except
for bugs it finds, which are named as such in the message.

## Scope

Everything since the last refactor commit:

```bash
git log --oneline --grep="^refactor" -1   # the baseline
git diff --stat <baseline>..HEAD          # the ground this pass covers
```

`since <ref>` overrides the baseline when the run being cleaned up starts
somewhere else.

## Pass 1 — count, then extract

CODE_RULES §1 is arithmetic, not judgement. **Grep the exact duplication and
write the number down before deciding anything.**

- **3 or more → extract**, and name the shared thing after what it *means*.
- **Exactly 2 → DECLINE, and record the count in the commit message.** Otherwise
  the next session re-opens the same question and answers it from taste.

The DASH lesson: four constants against forty-seven inline literals. Extracting
a rule that most call sites do not follow makes the codebase *look* centralised
while it is not — worse than the honest duplication, because it hides the
scatter behind a plausible name.

Count before you extract. A count you did not run is an opinion.

## Pass 2 — debloat and de-hardcode

CODE_RULES §2 and §3, applied to the diff of pass 1 as well as the original run:

- **Dead pipelines behind removed UI.** When a screen goes, its reads rarely go
  with it. Follow every export back to a consumer; no consumer means delete.
- **Stale comments that contradict the constant beside them** — the "twenty"
  that had been 50 for a fortnight. A wrong comment is worse than none.
- **Magic numbers to named constants, with the reason on them**, not the value
  restated in words (`VISIBLE_ROWS`, because the panel is measured in rows).
- **Routes and strings written out more than twice** move to the file that
  already declares them (`sections.ts` declares the nav; nothing else may).
- **`unknown` + cast on provider data** — provider payloads are untrusted, so
  they are parsed, not asserted.

## Bug hunt — read the RENDERED output, not the code

The duplicate "Goals against" label was invisible in the source and obvious the
moment the strip was looked at. Source review cannot find what only exists once
the data meets the template.

```bash
npm run dev &                              # or an already-running server
curl -s localhost:3000/<route> | grep ...  # what actually printed
```

Then shoot the changed routes at **390 and 1440** and *look at the images*.
`/shoot` does both. A description of a screen is not a reading of one.

## Two passes minimum

The second pass runs over the diff the first produced. Extractions expose new
duplication and leave imports nothing uses; the first pass cannot see its own
leavings. Stop when a pass finds nothing, not when the list is done.

## Gates

The four from `/verify` — test, typecheck, lint, build — plus the instruments
for anything visible:

```bash
node tools/ui/sweep.mjs      # contrast and overflow, every route, both widths
node tools/ui/tapfit.mjs     # tap floors at the width each has
node tools/ui/groundfit.mjs  # nothing prints on the bare ground — sweep
                             # composites past the `fixed -z-10` photograph and
                             # cannot see this one
node tools/ui/pitchfit.mjs   # only if anything moved near a pitch
node tools/ui/navfit.mjs     # only if the nav changed
```

All green **before** the refactor commit lands. A refactor that needs a
follow-up fix was not a refactor.

## The commit

One commit, prefixed `refactor:`, whose message carries:

- what was extracted, with the count that justified it;
- what was **declined at two**, with that count — this is the part that saves
  the next session;
- any bug fixed along the way, named as a bug rather than folded into the tidy.
