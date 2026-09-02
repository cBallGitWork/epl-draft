# Design — binding

The visual contract. `CODE_RULES.md` and `PRODUCT.md` still override this file;
`docs/ui/` still describes what each page *is*. This says what the app **looks
like**, and why, in terms a change can be checked against.

Every ratio quoted here was computed, not judged. WCAG 2.1 AA is the floor in
both registers and there are no exceptions to it in the tree.

---

## 1. Two registers

The site is two things at once and stopped pretending otherwise on 29 Aug 2026.

| | **The Paper** | **The Desk** |
|---|---|---|
| Where | `/` and `/paper/*`, and everything written | League · Squads · Live · Players · FPL |
| What it is | a newspaper, printed | a management terminal |
| Ground | warm off-white stock | blue-black |
| Type | serif display and prose | one bold humanist sans |
| Colour | ink, rules, and the league's red | CM 99/00's grammar (§3) |

They share a skeleton, and the skeleton is what stops this reading as two
websites: one spacing scale, one set of nav bones, and **Archivo Narrow tabular
numerals for every figure in both registers**. A score is set the same way on
newsprint as on the desk, because a score is the one thing that is the same
object in both places.

**The nav bones are literal.** The six sections are one table
(`shell/sections.ts`) and each register prints it its own way: the Desk stacks
them down a Championship Manager rail (`shell/Rail`), the Paper sets them as a
contents strip in letterspaced small capitals (`gazette/Index`). Same six, same
order, same gate on Live. The rail is **not** on `/` — a 64px navy column beside
a broadsheet is a seam, and it would narrow the container the front page's
two-column layout keys off — which is why the Paper prints its own rather than
going without.

The Paper is the front page's `.paper` scope. The Desk is the root `@theme` —
it has no class of its own, because it is the default and giving the default a
class costs thirty components a class name for nothing.

## 2. The Desk is Championship Manager 99/00

Not "retro-flavoured". The league is ten men in their forties who played it,
and it is the density benchmark: attribute grids, 1–20 ratings, W-D-L strings,
red and green figures, a text-commentary matchday.

Studied from the game's own screenshots (myabandonware, `championship-manager-
season-99-00-*`), not from memory of it.

~~**One deliberate departure:** CM drew every screen over a darkened match
photograph… no amount of scrim fixes a ground that changes under the text.~~
**Reversed 31 Aug 2026.** The second half of that was wrong, and it was
checkable: a scrim at opacity α can never composite lighter than
`α × brightest + (1 − α) × bg`, whatever the photograph holds. That is a BOUND,
so it is solved rather than feared — and darkening the picture first buys far
more of it, because the product of the two is what the sum turns on. At
`brightness(0.25)` and `opacity(0.30)` the tightest ink in the palette lands at
4.65:1 with the photograph five times as present as a scrim alone allowed.

**And then the bound was the wrong instrument too** (Craig, 31 Aug: *the
background IS the image*). Five times a scrim is still about seven per cent of a
picture — a dark blue screen with something behind it. The bound was expensive
because it priced ink sitting DIRECTLY on the photograph, and CM never sells
that: every word in the game is on a plate or inside a translucent panel
(`cm9900/24.jpg`, `12.jpg`, `21.jpg`), and the ground shows only between them.
`09.jpg` — cited here for two months as proof the photograph had to go — is a
screen of bare prose over a goalmouth, which is the one thing CM's own tables
never do.

So the desk keeps the rule instead of the bound: **nothing prints text on the
bare ground.** The photograph runs at full strength, darkened to 0.55 and in
colour. `components/football/PhotoGround` carries both; `DESK_GROUND` in core
config is where the picture goes, and until one lands the ground is drawn from
the round's own portraits.

**The rule is measured where the bound could only be stated.** `sweep` cannot
help — the ground is `fixed` at `-z-10`, an ancestor of nothing, so it composites
straight past and reports every route clean whatever is behind it.
`tools/ui/groundfit.mjs` walks every visible text node on the desk routes
at both widths and accumulates background alpha up the real ancestor chain,
naming anything under half. Zero bare, 31 Aug 2026. Moving `SCRIM` or `DARKEN` is
safe for exactly as long as that stays at zero.

**Which way a surface faces is the whole grammar, and it has three answers.**

| | Class | What it is |
|---|---|---|
| **Raised** | `cm-bevel` | something you press — a button, a dropdown, a column head, a way out of a page |
| **Pressed** | `cm-bevel-pressed` | the same thing, held down: the sorted column, the view you are on |
| **Sunken** | `cm-panel` | a well cut into the chrome — a panel, and a text field, which is a panel one line tall |

A blue plate (`cm-tab`, `cm-titlebar`) is the same mechanism in chrome rather
than grey: the title bar every screen opens with, and any strip where you pick
one of a set — the League's three views, the pool's filters. The one you are on
is drawn PRESSED with the accent on its label, so the affordance and the state
are one object rather than two marks.

**The section rail is not one of these**, and this paragraph named it as one for
half a day. Championship Manager draws two different objects and they appear in
the same screenshot: the tab strip under a title bar is a filled plate with a
pressed yellow current tab, and the RAIL is the page's own navy with each entry
in a thin outlined box (`cm9900/12.jpg`, `19.jpg`). `shell/Rail` is outlined, and
marks the current section with the accent on its label AND on its border —
which is what the reference actually shows, measured in the library's own palette
table.

**A plate owns its ink.** Dark ink on the grey plate is 7.52:1 and `--color-ink`
on it is 2.27; on the blue plate ink is 7.0 and `--color-muted` is 3.55 and
fails. So no call site sets `text-*` on either, and a count inside a tab is the
label's own colour — which is how the game printed "Fitness (40)".

## 3. The Desk's palette

Each colour is a **slot with one meaning**. This is CM's actual grammar and it
is more specific than a palette; it is the reason the token names in
`tokens.css` did not change when every value did.

| Slot | Token | Means | On `--bg` |
|---|---|---|---|
| Ground | `--color-bg` `surface` `raised` `line` | depth, never meaning | — |
| Ink | `--color-ink` `muted` `faint` | how loud | 17.0 · 8.6 · 5.7 |
| Yellow | `--color-accent` | **yours · selected · active · primary** | 13.1 |
| Cyan | `--color-info` | **a person** — and secondary emphasis | 11.2 |
| Amber | `--color-mid` | **a figure** | 9.8 |
| Red | `--color-bad` | **a loss, a doubt, a negative** | 5.6 |
| Green | `--color-up` | **a gain** — the other half of the direction pair | 9.9 |
| Live red | `--color-live` | **a match in play**, and nothing else | 5.4 |
| League red | `--color-league` | the league's own mark. Chrome only | 3.2 |
| Deep league red | `--color-league-deep` | the same red as a **ground with text on it** | — |
| Cream | `--color-cream` | ink on a colour plate | — |

`--color-faint` on `--color-raised` is 4.9:1. That is the tightest pair in the
set and it is what fixes where the raised step can sit; move one, re-check both.

**The wells are grey and only the page is navy** (Craig, 31 Aug: *the main table
is still too dark, cm has more of a grey look*). The ramp was hue 265 at chroma
0.046 throughout, so `--surface` rendered `#0f182f` — a navy plate, not a well.
Championship Manager's row ground is `#4c4944`: measured off `cm9900/12.jpg` and
recorded in `docs/ui/reference/README.md` long before anyone read it back.

Hue was free — 265 → 80 at chroma 0.012 shifts every ratio in this table by under
0.05, because luminance barely notices chroma that low. **Lightness was not, and
the bound is CM's own.** At its L 0.407 our `--faint` lands on 2.55:1, `--bad` on
2.66 and `--live` on 2.59; solving for a lift inverts the ladder, since `--faint`
would need L 0.782 against a `--muted` of 0.76. The game could afford a mid-grey
because it ran its unavailable ink at **2.54:1**, which §2 already records us
refusing. So `--surface` sits at the ceiling a 4.5:1 floor allows — `#23201a`,
L 0.245 — and `--faint` lifted 0.63 → 0.65 to pay for it.

`--color-bg` keeps hue 265 and is the only step that does. `cm9900/24.jpg` is a
dark BLUE rail beside a warm grey table area; warming the whole ramp turned the
rail brown, which is a different game.

The live red and the league red are one hue on purpose — the league is what is
live. The live red is the brand red lifted until it carries text, because
`#C8102E` is 3.2:1 on this ground.

**Two consequences that have already caught us out.**

*The league's red carries text only one step down.* `--color-league` is 4.94:1
under cream, which passes and leaves nothing over — and a scoreline needs
something over, because dimming the trailing side is the grammar every scoreline
in the app shares, and a dimmed cream on it is 2.96:1. `--color-league-deep` is
the same hue taken to `oklch(0.45 0.17 22)`, where the pair is 6.8:1 and 4.3:1.
The live strip is what it is for.

*The league's red never says "active".* It is the mark and the live signal, and
a surface that fills its selected item with red is answering a question the tab
bar and the pool's filter chips have already answered with the accent slot. The
section nav under `/league` did exactly that, which is three expressions of one
concept and two of them agreeing.

*The playoff cut line stays red, and the plan's "yellow dashed" is wrong here.*
CM draws its cut line in yellow, and CM is right in CM — but on our standings
table yellow is already spoken for twice on the row a reader is looking for: the
"yours" border and the YOURS chip. A yellow rule across that same table would
be the accent making a second, unrelated claim in the one place it must not.
Dashing it is free and carries the distinction without colour; the colour stays.

**Retired, and why:** the Premier League's brand set (green primary, pink LIVE,
neon cyan) was the football register doing league-register work, and the
football is now one tab of six. It survives only where it is *data* rather than
dress — the fixture-difficulty scale, and club colours, which belong to the
clubs and are not ours to restyle.

## 4. The Paper

`.paper` re-points the same semantic tokens at ink on stock, rather than editing
thirty components. A component asking for `text-muted` wants "quieter than the
body", and that is a different colour on paper than on glass.

**The stock is the reference's**: `#f6ddd2` rosa and `#2a2018` ink. It was a warm
off-white until 29 Aug, on the argument that the pink was another paper's
identity — but that reasoning protects a paper that has an identity of its own,
and the whole brief for this one is *La Gazzetta*. A near-cream that is nearly
the rosa reads as neither.

**Two colours on the sheet, and the second is spent on what is live.** Everything
is ink at an opacity except one print red, `--paper-red: #8f2318` at **7.4:1** —
which `--accent` and `--live` both take, since neither can be supplied by
re-pointing ink. The desk's yellow is 1.3:1 here and its live red 2.6:1, so
neither could have crossed anyway.

It is a deeper, browner red than the league's own `#C8102E`, which is a brand red
for signage and glowed on this stock. The column heads and the masthead's rules
were printed in it until 29 Aug, and eight red heads down a page is what made the
front page read as a themed screen rather than as newsprint; rank on this sheet
is set in scale, not in hue. `paper.css` re-points `--color-league` at the print
red so nothing on the page can reach the brand colour by accident — the crest is
the one exception and `.crest` restores it (§5).

The paper's ink ladder is the same three rungs the desk's is, measured on this
stock: **14.2 · 7.9 · 5.4** against the desk's 17.0 · 8.6 · 5.7. `--faint` was
0.48 until 29 Aug, which is 3.0:1 — under the floor this file says has no
exceptions, while carrying every timestamp and percentage on the front page.

## 5. Colour plates

A paper prints colour pictures on a cream page. Two things here are that: the
**pitch**, which is a photograph rather than prose, and the **crest**, which is a
printed mark whose red and cream are the mark's and not the page's.

`.paper :is(.pitch, .crest)` restores the desk's tokens inside them. Anything
that is a plate joins that selector; anything that is page furniture does not.
The failure this prevents is silent and total — re-pointing `--color-cream` at
ink turns eleven name plates invisible and stamps the crest in red on red.

## 6. Type

Four faces, four roles.

| Face | Role | Register |
|---|---|---|
| Fraunces | masthead, display, drop caps | Paper |
| Newsreader | prose, italic decks | Paper |
| Archivo | UI | Desk |
| Archivo Narrow, `tnum` | **every figure** | both |

Fraunces and Newsreader load from `app/paperFonts.ts`, imported only by paper
routes, so the desk pays nothing for them. Georgia is the declared fallback and
is a real transitional serif on every device that will open this. Both carry
`opsz` and `font-optical-sizing: auto` spends it, which is why they were chosen
over a static pair: a masthead and a byline cut from one family should not be
one drawing at two sizes.

**Archivo has one job on the paper too** — the letterspaced small capitals a
newspaper sets its standing heads, kickers, datelines and bylines in. A serif at
nine pixels with 0.16em of tracking is a smudge, and the page needs that size to
be furniture rather than prose. The body serif never sets a capital.

The scale is fixed rem, ratio ~1.15, product UI, no fluid clamps outside the
masthead, and it now runs `--text-3xs` (9px) to `--text-6xl` (45px) with every
step declared. §8 records why 3xs is the last step rather than a floor.

**Every step carries its own line box**, declared beside it in `tokens.css` as
`calc(box / size)`: 9/12 · 11/14 · 12/16 · 14/18 · 16/22 · 18/24 · 21/26 ·
24/28 · 30/34 · 34/38 · 45/46. Until 31 Aug 2026 none of them did, and the two
that are ours alone — `3xs` and `2xs`, which were 168 of the app's 306 type sites
when this was written and 167 of 271 by the evening of the same day
— fell through to Preflight's 1.5, putting an 11px label in a 16.5px line box.
That, and not any `py-`, is why a Championship Manager row kept coming out at
37px where the game drew it at 18. Prose that wants air asks for it at the point
of use; the paper's columns are `leading-relaxed` and its decks `leading-snug`.

**A figure is never letterspaced.** `.numeric` sets `letter-spacing: -0.01em`
precisely so tabular digits line up, and a `tracking-widest` on the same element
is the two rules arguing. Ten sites did it and none do now. The one exception is
the sign-in field, where a code is being transcribed one character at a time and
the space between characters is what a reader checks his typing against.

**And the DESK does not letterspace at all.** Championship Manager's column
heads, tab labels, rail entries and title bars are all set at normal spacing —
checked in `cm9900/12.jpg` and `21.jpg`, not remembered — and 57 sites on the
desk were adding 0.1em to a 9 or 11px small capital. They are gone. This is a
register rule and not a global one: the **paper keeps its 15**, because §6 above
gives Archivo's letterspaced small capitals a real job on newsprint, where a
standing head, a kicker, a dateline and a byline are furniture rather than prose.
Negative tracking is untouched — the eleven `tracking-tight` are condensed, which
is the desk's own register.

**The desk's display type casts a shadow, and only the display type does.**
`cm9900/24.jpg` sets "English Premier Division" in blue on the light competition
plate with a soft grey shadow offset down and right; `25.jpg` does the same in
white on Everton's blue one. `.cm-title` in `desk.css` is that mark, and it is
worn by exactly three things: the title-bar `h1` in both of `PageHeader`'s bars,
and the yellow caption inside a panel. **Not the tab labels, the column heads or
the rail** — they are flat in every shot, and softening them makes the whole
screen soft. Set in `em`, because the same title is 20px under a thumb and 30px
on the desk and a fixed offset is two different marks at the two sizes.

It changes no contrast ratio: WCAG measures a foreground against a background
and a shadow is neither, so `sweep.mjs` reads the same numbers before and after.
It is depth, which is what it shares with the bevel and why it lives in the same
file. **The paper does not get it** — ink on stock casts no shadow, and the
masthead is the other register (§1).

## 7. Grammar that outranks the look

Restated because a redesign is exactly when these get broken. Their parents are
`docs/ui/conventions.md` and — for the tap rule, which `conventions.md` has never
carried — `PRODUCT.md`'s accessibility section.

- **Absence is `—`, never `0`.** A confident wrong number is worse than a hedged
  right one.
- **Provenance at the point of use.** Every derived figure says whose it is.
  Fantrax's numbers are authoritative; ours are labelled and never sit in a
  column headed `FPts`.
- **Taps are `min-h-11`** — but that is a rule about a THUMB. Above `lg` the
  desk keeps its own proportions: a repeating ROW is 28px (`.cm-row` in
  `desk.css`), a CONTROL 36 (`lg:min-h-9`), a column head 28 with its strip.
  `PRODUCT.md`'s accessibility section is the parent and carries the three
  exceptions; `tools/ui/tapfit.mjs` measures it.
- The lineup gate, the alphabetical gated order, and "no active/reserve leak"
  are product invariants. They are not visual decisions and a redesign does not
  get to renegotiate them.
- Motion: 150–250ms, ease-out. Every animation has a reduced-motion alternative
  that keeps the *information* — the live dot keeps a static presence, a changed
  figure crossfades.

## 8. Deferred, deliberately

Recorded so the next agent does not read the absence as an oversight.

- ~~**`--color-up` / `--color-down`.**~~ **Closed, 29 Aug 2026**, and not the
  way it was written. The league screens arrived and put a *direction* — a form
  letter — in the same red as a *fault*, which is what this bullet was waiting
  for. But only half of it was real: `--color-bad` was already the red and
  already named "a loss, a doubt, a negative", so `--color-down` would have been
  a second token holding one value. **What was actually missing was the green.**
  A palette whose defining characteristic is red-and-green figures had no green
  at all, so a positive was ink in three places and the accent yellow in a
  fourth — and that fourth was a slot violation, the accent meaning "yours,
  selected, active" and nothing else.

  `--color-up` is spent only where which WAY a figure went is the reason for
  printing it: the form run, a result, the ownership trend, a value against a
  draft pick. Never on a number that merely happens to be positive, which is
  most of them, and which is why a ledger of scoring categories stays ink.
- **`--color-link`.** CM's cyan means "a person". Nothing links a person yet;
  the token arrives with the standings table that does. `--color-info` holds the
  value until then.
- ~~**The 6–7px clamp floors on the pitch.**~~ **Closed, 29 Aug 2026.** This was
  the one live exception under the scale: `PitchRows.NAME_SIZE` was a container
  clamp bottoming at 7px inside the plate, and the points, chips and fixture
  under it were three more. All five are now declared steps — `--text-2xs` for
  the name, `--text-xs` for the figure, `--text-3xs` for the fixture and the
  chips — so **`--text-3xs` is a floor on the pitch and not merely the last step
  down**. The rule that got there is *the card shrinks, the type never does*: a
  crowded line gives up card width and truncates the name rather than shrinking
  it, because there is nothing smaller worth saying — FPL publishes
  `squad_number` as null on all 622 of its elements. Recorded rather than deleted
  because the shape of the mistake is worth keeping: a size expressed as a range
  whose ceiling the geometry could never reach is a floor wearing a range's
  clothes.
- **No `--focus` token.** The ring is `--accent`: "this is where you are" and
  "this is what is selected" are one statement, and the accent slot already
  carries it correctly in both registers without the rule knowing which page it
  is on.

## 9. Decided at sign-off, 29 Aug 2026

Craig's answers on the wireframe canvas. Where one contradicts §8 above or the
overhaul plan, this section wins.

~~**The pitch stays the squad screen's default.**~~ **Reversed 31 Aug 2026,
Craig: "maybe the squad page doesn't need a pitch, and we save that for the live
match h2h, gives us more space too since it's eleven."** Recorded here rather
than in a child, because a child cannot amend this section and for two days the
tree said one thing and the binding doc said the other.

What was decided on 29 Aug and is now overturned: the plan and the boards
proposed demoting the pitch to a toggle behind a dense table, and that was
rejected. The reversal goes further than the demotion did — `SquadPitch` is
deleted, not hidden.

The reasoning, so the next reversal has something to argue with. **The gated
board draws FIFTEEN with no arrangement**, because the arrangement is exactly
what the gate withholds, and a pitch is a drawing of a shape: fifteen men in
position lines is a diagram of something nobody picked. Championship Manager's
own squad screen is a table (`cm9900/25.jpg`, and `10.jpg`). The eleven that IS
a shape keeps its pitch — on the head-to-head and on the planner — where there
are four fewer men and room for each.

Two consequences. `/squad/[teamId]` is no longer the reference page for the
pitch; the head-to-head is. And **the 390×844 no-scroll budget is now about the
PITCH clearing the fold, not the page** — the page scrolls by design, because the
season grid is a second panel under the board. `tools/ui/pitchfit.mjs` is what
checks it. `docs/ui/squad.md` and `docs/ui/README.md` are still not retired.

The consequence is the part worth writing down. §8 defers the 6–7px clamp floors
on the player cards as "survivable only once the pitch is demoted". **That escape
hatch is gone, and the type is still too small** — Craig's own verdict on the
pitch view is that it is terrible. So the brief is now the harder one: make a
card carry its name, its fixture-or-score band and its state at a readable size
with all fifteen still on one phone screen. It is a geometry problem, not a
demotion problem, and it does not get solved by shrinking something else.

*Done, later the same day, and §8 records how: the card shrinks and the type
does not. Not by wrapping — balanced rows were offered and rejected, so a
position block is still one line however many are in it.*

**`/players` on a phone keeps sideways scroll, with the name column frozen.**
The scouting table's sixteen columns do not become mobile view presets. This
preserves `docs/ui/players.md`'s "nothing is hidden on a phone" record, which
therefore stands rather than being rewritten. A sticky first column is the cost.

**The live desk splits.** Mobile `/matchday` rows expand in place from data
already on the page; the `≥lg` wall at `/matchday/desk` keeps the no-tap rule
`docs/ui/desk.md` makes binding by name, and links out instead. The rule was
written because the wall is read across a room rather than operated, and that is
still true of the wall and was never true of a phone.

**The masthead photograph is deferred, not chosen.** The crest-in-a-box ships and
is not a placeholder — it is what the paper looks like until someone hands it a
better picture, and the picture it wants is a league one (draft night, a trophy,
ten names on a board) rather than a stock Premier League shot, which would
make the paper look like it is about the Premier League rather than about the
ten of us.

**The splash picture is a drawing, and it prints in the sheet's two colours.**
Separate from the masthead question above and settled differently: the paper's
LEAD may carry one generated picture, drawn in CI beside the prose. Three rules
travel with it.

It is an **editorial cartoon and never a photograph or a likeness** — a drawing
sits on newsprint where a photograph fights it, and generating a face for a real
footballer is the one thing this paper must not do. §9's own doctrine already
says a wrong photograph is worse than none; a wrong photograph of a real person
is worse again.

It is **always printed through `.paper-photo`** (`paper.css`): grayscale toward
the ink, multiplied against the rosa so the stock shows through the midtones,
under a halftone screen. Verified against an FFmpeg colour test pattern — the
most garish input available — which came out in ink and rosa alone. A colour
image dropped raw onto this sheet is the fastest way to make the front page look
like a website again.

It is **deliberately not a colour plate** (§5). A plate — the pitch, a crest —
restores the desk's tokens because it is a colour object printed ON the sheet.
This is the opposite: an image made to print IN the sheet's own colours, so it
must never join that selector.

**And the paper goes out without one whenever anything at all goes wrong.** No
key, a refused call, a bad payload: the prose is already written and validated by
then, and a paper with a headline and no drawing is a paper.
