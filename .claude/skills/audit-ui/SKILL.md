---
name: audit-ui
description: Run the deterministic UI instruments — contrast and overflow across every route at both widths, tab-bar fit on the narrowest phones, and a dialog's open/measure/Escape cycle. Use after any visible change touching more than one route, and before closing a phase.
argument-hint: "[--base <url>]"
---

# The three instruments

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

## 2. Navfit — does the tab bar still fit

```bash
node tools/ui/navfit.mjs [320 360 390 430]
```

Two answers per width. **now:** every rendered tab's column against the width its
label needs, plus horizontal overflow. **+1 tab:** the same labels against the
column an extra tab would leave — the Live tab exists only while football is on,
so the bar a session sees on a Tuesday is one column wider than the bar sixteen
phones see on a Saturday.

Any chrome change re-runs this. At 320px a seventh tab clips Gazetta and Players,
which is why `/matchday/desk` is reached from the Live tab and not from a tab of
its own (`docs/ui/desk.md`).

## 3. Dialog — open, measure, Escape

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
