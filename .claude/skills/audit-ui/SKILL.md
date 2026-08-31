---
name: audit-ui
description: Run the deterministic UI instruments — contrast and overflow across every route at both widths, tap targets against the floor each width actually has, section-rail fit on the narrowest phones, whether a pitch still clears the fold, and a dialog's open/measure/Escape cycle. Use after any visible change touching more than one route, and before closing a phase.
argument-hint: "[--base <url>]"
---

# The five instruments

Deterministic checks that a screenshot cannot make. They need the app up and
headless Chrome on 9261 — see `/shoot` steps 1 and 2 for both.

## 1. Sweep — contrast and overflow

```bash
node tools/ui/sweep.mjs [--base http://localhost:3000]
```

Nine routes × 390 and 1440. Per page: any text failing WCAG AA against the ground
it is *actually painted on* (backgrounds composited up the real ancestor chain,
oklch recovered by painting over white and black), and whether the document
scrolls sideways. Exits non-zero on either.

**The SVG bucket is a work list, not a pass.** Text on an SVG ground — the pitch
draws its own — is reported as `(n on SVG ground — not auditable here, check by
hand)` because no ancestor walk can see that ground. A run that is otherwise
clean but carries a bucket is **not** a clean run: shoot those routes and read
the colours off the image. Calling the bucket a pass is how the pitch's name
plates would go invisible unnoticed.

## 2. Navfit — does the section rail still fit

```bash
node tools/ui/navfit.mjs [320 360 390 430]
```

Three answers per width, because the rail replaced the tab bar on 31 Aug 2026 and
the fit question turned ninety degrees with it. **labels:** every rendered plate
against the width its own label needs. **height:** the plates' run against the
screen, now and with one more section — the Live section exists only while
football is on, so the rail a session sees on a Tuesday is one plate shorter than
the rail sixteen phones see on a Saturday, and a rail taller than the viewport
hides a section behind furniture nobody knows to drag. **rail / page:** what the
rail leaves the content column, which the bar never took.

Any chrome change re-runs this. A seventh section is a height question now rather
than a width one, but `/matchday/desk` is still reached from the Live section and
not from one of its own (`docs/ui/desk.md`).

## 3. Tapfit — is every target as big as its width requires

```bash
node tools/ui/tapfit.mjs
```

Nine routes × 390 and 1440, against the floor each width actually has: 44px under
a thumb, and above `lg` 28 for a repeating row, 36 for a control (PRODUCT.md's
accessibility section). Three exceptions are recorded and read out on every run
rather than filtered away — a column head, the Pitch/List toggle, and an
inline text link inside a sentence, the last detected structurally so a rewritten
sentence cannot go stale. The toggle is the Pitch/List one — the head-to-head
board's and the locked squad's, not the squad board's, which lost its pitch on
31 Aug.

**Run it after anything that adds a link.** The rule used to be carried by four
prose checklists asking "are taps `min-h-11`?", and a prose checklist cannot
measure: this instrument's first run found the front page's contents strip
shipping 12px targets on the one screen with no other way out of it.

## 4. Pitchfit — does the grass still clear the fold

```bash
node tools/ui/pitchfit.mjs
```

Every squad the served league has, at 390 · 768 · 1024 · 1440, on both budgets —
the gated view spends `--pitch-page` and an XI with a bench spends
`.pitch-with-bench`. **The invariant is that the PITCH clears the fold, not that
the page does**: the page scrolls on a phone by design, because the season grid
is a second panel under the board.

**Run it after anything that adds a band above a pitch.** `docs/ui/squad.md` has
asked for this measurement since 29 Aug and it was taken by hand every time,
which is why three numbers written into `pitch.css` were stale inside a day.

## 5. Dialog — open, measure, Escape

```bash
node tools/ui/dialog.mjs <route> [--selector '.pitch button'] [--width 390]
```

The one piece of furniture a screenshot cannot check: absent from the page until
something is tapped, and the failure that matters — it opens and will not close —
leaves no trace in a still image. Prints the width; what counts as too wide is a
DESIGN.md judgement, not this tool's.

A route with a pitch is needed: `/league/matchups/<teamId>` works anonymously.

## Report

```
sweep    <n> AA failures · <n> H-SCROLL · SVG bucket on <routes>  → checked by hand: <what you saw>
navfit   <widths> all fit / CLIPS <which>   +1 tab: <fits|would clip which>
dialog   <route> open <n>px · Escape closes  / FAILED <how>
```

A non-zero exit is a finding, not an error to work around. And an instrument that
was not run does not get reported as clean.
