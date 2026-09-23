# Product

## Register

product

## Users

Ten friends in a Fantrax Premier League draft league ("Tim Hortons Pro League"),
plus a commissioner who additionally administers it. Experienced fantasy managers —
they know what xG is, they don't need a glossary, and they resent being protected from
their own data.

The defining context is a phone held in one hand while a match plays on a screen in
front of them. Sessions are short and frequent: a thirty-second check at half time, a
longer sit-down on Sunday night, a midweek scan for injury news before the waiver
deadline. Almost never a desktop, almost never unhurried.

The jobs, in order of how often they happen: *what is my score doing right now*, *am I
winning my head-to-head*, *should I start this player*, *what happened this week*.

## Product Purpose

Fantrax runs the league — drafting, scoring, transfers, waivers. It is the source of
truth and we never fight it. This app republishes that league with the things Fantrax
lacks: a live matchday view worth watching, competitions we define ourselves (H2H
groups, cups, points leagues) layered on top of Fantrax's points, a rolling newspaper,
and a per-player intelligence store.

Two data layers, deliberately separate. The **football layer** is the real Premier
League — clubs, players, fixtures, live stats — sourced from FPL's public API. The
**league layer** is our fantasy competition, sourced from Fantrax. They join on player
identity and they are never conflated.

Success is that on a Saturday at 3pm, everyone in the league has this open instead of
Fantrax.

Longer term this is also a rehearsal. The 2027/28 goal is our own draft platform —
a draft/EPL/Football Manager hybrid with real tactics, contract and morale narratives,
and a soft salary cap. The football layer and the whole UI survive that transition
intact; only the league adapter is replaced. Design decisions here should not assume
Fantrax is forever.

## Brand Personality

**Urgent, dense, partisan.**

Two registers held at once. The energy of a broadcast score centre — live numbers,
things visibly moving, the sense that something is happening right now — carrying the
information density of Football Manager. Not one softened by the other: a score centre
that respects how much its audience already knows.

Partisan matters. This is ten named people who talk to each other. The app should
know whose team you are and take a side — your players, your rivals, your humiliation.
Neutrality is for broadcasters, not for a league of mates.

Voice: terse, confident, footballing. Never corporate, never explanatory, never cute
for its own sake.

## Anti-references

- **Betting apps** (DraftKings, bet365). Aggressive greens, odds-boost banners, permanent
  upsell energy, manufactured urgency. Our urgency is real — it comes from a match
  actually being played — and it must never feel sold.
- **Fantrax's own interface.** Dense enterprise tables and dated chrome. Density is the
  goal but Fantrax achieves it by giving up on design; being better to look at is a
  large part of why this exists at all.
- **Generic SaaS dashboards.** Card grids, sidebar navigation, muted grays, hero-metric
  tiles, an icon above every heading. The default AI-app look.

## Design Principles

1. **The live number is the interface.** While a match is running, the score and its
   movement outrank everything on screen. Chrome, navigation and explanation all defer
   to it. Between matches, the hierarchy is allowed to relax.

2. **Density is a form of respect.** These users want the numbers. Do not hide data
   behind progressive disclosure they did not ask for, and do not pad the layout to
   feel calm. Earn density with typographic hierarchy, not with fewer facts.

3. **Two layers, two registers, never muddled.** Premier League colours belong to the
   real world — fixtures, live scores, the pitch. Tim Hortons belongs to our league —
   standings, competitions, the masthead. A screen should always be clear about which
   world it is showing.

4. **Be honest about what we know.** Every figure here is scraped from someone else's
   system and may be stale, provisional or missing. Say so plainly at the point of
   use. A confident wrong number is worse than a hedged right one.

5. **Designed for arm's length, one-handed.** The reference viewing condition is a phone
   at arm's length with a match in peripheral vision. If a number can't be read in a
   glance from there, it is too small, too thin, or too low-contrast.

## The desk is designed first, and the phone is read on

**The reference viewing condition is unchanged** — principle 5 above, a phone at
arm's length with a match in peripheral vision. Every legibility floor, every tap
target and every contrast ratio answers to it.

**The design ORDER changed on 31 Aug 2026** (Craig): the desk layout is drawn
first and the phone is a second design of the same data. Championship Manager is
an 800×600 artefact and a phone-derived layout cannot become one; the desk is
also the superset that holds the whole information architecture. The phone is
never a squeeze of it — per screen, the desk decides what is on it and the phone
decides which of that a thumb gets. `docs/ui/README.md` carries the working rule.

These are two different claims and only the second one moved. A session reading
"phone first" and assuming desk-first is a slip should read this paragraph
instead.

## Accessibility & Inclusion

WCAG 2.1 AA. Body text ≥4.5:1, large text and numerals ≥3:1, visible focus states,
tap targets ≥44px.

**The 44px is ours and not the standard's** — WCAG 2.1 AA has no tap-target
requirement at all — and since 31 Aug 2026 it is a rule about a THUMB rather than
about a screen. Under a thumb everything is 44. Above `lg`, where the pointer is
a mouse and the reference viewing condition above does not apply, the desk keeps
its own proportions instead:

| | Above `lg` | Where |
|---|---|---|
| A repeating **row** of a list | 28px | `.cm-row`, `desk.css` |
| A **control** — button, input, tab, way out | 36px | `lg:min-h-9` |
| A **column head** | 28px, with its strip | see the exception below |

Craig's call, and the phone keeps 44 at every size. One rule rather than a
judgement per component: `.cm-row` says nothing below `lg`, so adding it to a row
cannot change what a phone sees. What it bought is ten teams on one screen
where the game showed a division on one — `/league`'s rows are 29px against
Championship Manager's own 18.

**Three exceptions, all deliberate and all measured.** A **column head** belongs
to the head strip it is cut from and is as wide as its column, so it is a short
wide target rather than a small one; it has been 28px since the tables were built
and no document had measured it until now. An **inline text link inside a
sentence** — "or show all 638" — is prose and never was a control. And **the match
screens' rows are 36px under a thumb** (Craig, 23 Sep 2026: *"the mobile rows are
too big"*, *"too big of a gap between a goal scorer and assister"*): the team
sheet, a club's stats board, Action Zones' shot list and the Overview's scorer and
assister lines on `/prem/match/[id]`.

*It was three until 11 Sep 2026. The third was the **Pitch/List toggle** at
`min-h-9`, and it is gone because the control is: `ViewToggle` became a blue
`.cm-tab` strip that day and `.cm-tab` is 44px under a thumb and 56 above `lg`,
so the one target the app deliberately drew under the floor now clears it
everywhere. The exception is deleted rather than reworded — the whole point of
listing them is that the list is short and every entry is live.*

`tools/ui/tapfit.mjs` measures all of this on every route at both widths and
names the exceptions rather than hiding them. It exists because the four guards
that carried this rule were prose checklists asking "are taps `min-h-11`?", and
a prose checklist cannot measure: the first run found the front page's contents
strip shipping 12px targets on the one screen with no other way out of it.

Two domain-specific hazards to hold to that standard. Club colours are brand values,
not chosen for contrast — several (Fulham, Spurs, Leeds white; Hull amber) fail against
light surfaces, so club colour is never the sole carrier of meaning and never sits
behind text without a contrast-checked ink. Live/finished/upcoming state and form tints
must be legible without hue alone; pair every colour signal with a label, shape or
position.

Full motion by default with a `prefers-reduced-motion` alternative for every animation —
the live view is the one place motion carries meaning (something changed), so its
reduced-motion path must still communicate the change, via a crossfade rather than
nothing.
