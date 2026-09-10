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
| Where | `/` and `/paper/*`, and everything written | League · Prem · Live · Players · FPL |
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
(`shell/sections.ts`) and each register prints it its own way: the Desk draws
them as Championship Manager's furniture (`shell/Rail` — a 130px rail down the
side above `lg`, a flat `.cm-foot` strip across the bottom below it; §2's table
has the three objects), the Paper sets them as a contents strip in letterspaced
small capitals (`gazette/Index`). Same six, same order, same gate on Live.

**Neither shape is on `/`.** A navy column beside a broadsheet is a seam, and it
would narrow the container the front page's two-column layout keys off; a blue
strip across the foot of a newspaper is the desk's furniture on the other
register's page. That is why the Paper prints its own rather than going without.

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
naming anything under half.

**"Zero bare, 31 Aug 2026" is struck**: that run was vacuous. The instrument
stopped its walk at `<html>` and therefore counted `<body>`, which `globals.css`
gives an opaque fill, so every text node on every route measured as covered and
the audit could not fail. It was repaired on 4 Sep and reported six routes over —
two of them at its cap. **ONE remains, re-run 10 Sep 2026**: `/matchday/desk` at
the cap, which is the `≥lg` wall and has never had a plate under any of it.
`/squad` was the second at 2 and now measures clean, so the list has shrunk
rather than grown. PLATFORM_NOTES carries the run. Moving `SCRIM` or `DARKEN` is
safe for exactly as long as that one is the whole of the list.

**Which way a surface faces is the whole grammar, and it has three answers.**

| | Class | What it is |
|---|---|---|
| **Raised** | `cm-bevel` | something you press — a button, a dropdown, a column head, a way out of a page |
| **Pressed** | `cm-bevel-pressed` | the same thing, held down: the sorted column, the view you are on |
| **Sunken** | `cm-panel` | a well cut into the chrome — a panel, and a text field, which is a panel one line tall |

**A fourth surface, and it is the one a reader counts down: the INDEX BLOCK.**
`cm-index`, the filled blue chip down the left of every table CM draws, carrying
the rank or the shirt number. It is not raised, pressed or sunken, and it is not
a chip with a look of its own: **the whole COLUMN is one gradient, light at its
head and dark at its foot, and each chip is a slice of it.** Craig, 7 Sep 2026:
*"the blue has a gradient down the page"*, and against a first attempt that
ramped each block separately, *"the gradient is going down the whole list, not a
gradient for each individual piece"*. A per-block ramp gives every chip the same
light top and the same dark base, so a column of them is one shape repeated;
CM's is one shape cut into slices, and where a chip sits on the ramp is itself
information.

`background-attachment: fixed` is what makes many separate elements share one
gradient — it moves the background positioning area from the element to the
viewport — and it is the only way to do it without a call site knowing its own
row number, which is the requirement. Ours was a flat slab until that day, so
ten of them read as one continuous blue bar with a hairline scratched across it.

Two consequences. **The 1px row rule is now the only thing separating two
chips**, which is CM's own answer (`cm9900/24.jpg` separates its blocks with a
single dark line and nothing else). And the ink has to clear its floor against
EVERY point on the ramp rather than against one flat face: measured down
`/league` at 390 on 7 Sep 2026, the ten chips run `rgb(53 84 169)` at 1st to
`rgb(22 46 124)` at 10th, and `--color-ink` on them is 6.4:1 to 11.2:1.

A blue plate (`cm-tab`, `cm-titlebar`) is the same mechanism in chrome rather
than grey: the title bar every screen opens with, and any strip where you pick
one of a set — the League's three views, the pool's filters. The one you are on
is drawn PRESSED with the accent on its label, so the affordance and the state
are one object rather than two marks.

**Navigation is THREE objects, and the game draws all three in one screenshot.**
This paragraph has now been wrong twice in the same way — first calling the rail
a tab strip, then calling the foot row one — and both times because two things
were blue.

| Object | Class | How CM draws it | Ours |
|---|---|---|---|
| **Tab strip** — one of a subject's views | `cm-tab` | filled royal-blue plates, bevelled, current one pressed with a yellow label and border | `shell/TabStrip`, `league/GroupNav`, `players/Board` |
| **Rail** — where you can go from anywhere, on a desk | — | the page's own navy, each entry in a thin outlined box | `shell/Rail` above `lg`, accent on the label AND the border |
| **Foot row** — related screens, across the bottom | `cm-foot` | ONE filled strip, flat, a light edge along the top and a rule between plates, current marked on the label alone | `shell/Rail` below `lg`, `prem/match/[id]/MatchFoot` |

`cm9900/12.jpg` and `19.jpg` carry the strip and the rail together; `24.jpg` and
`cm0102/02.jpg` carry the foot row. **Flat is the foot row's whole distinction**:
six bevelled plates are twelve bevel edges across a 390px phone, and a bevelled
foot row under a bevelled tab strip is two identical objects bracketing a screen
with nothing saying which is the section and which is the view.

**A table on a phone has two shapes, and which one it is is decided by its LAST
column.** A table whose last column is what the table is FOR — `Pts` on a
standings table — shows that column at 390 without a sideways scroll, and drops
whatever it must to do it. A many-measure board — the pool's directory, a stats
board, a match's player stats — keeps every column and scrolls sideways with CM's
own bevelled bar, because there is no last column that matters more than the
rest and hiding any of them is choosing for the reader.

The columns that stand down are named in each table's own `COLUMNS` list, in the
same `width` string that sizes them, so the heads, the rows and the loading
skeleton read one source. **A column the table is ORDERED by is never hidden**:
`display: none` takes the pressed plate, the sort arrow and `aria-sort` out with
it, so a phone arriving on a shared `?sort=` link would show an order with no
visible author and nothing in the accessibility tree to say what it was.

**And the first two columns carry no head at all** (Craig, 10 Sep 2026: *"the
rank (blue tabs) does not need a column header (hashtag) / remove team / repeat
this for all tables the same"*). A column of `1st 2nd 3rd` in a blue block says
what it is, and so does a column of names with a crest on each; the `#` and the
`Team` were labelling the only two columns in the table that label themselves.
`cm9900/24.jpg` heads neither and starts its strip at the first figure — the
strip is a ruler over the FIGURES. The cells stay, because they hold the columns
open, and so does the word: `TableHeads.MUTE` takes it to `sr-only` rather than
deleting it, because an empty `<th scope="col">` announces every cell under it
with no header, and on a sortable placing that same word is the accessible name
of a link. **Ten tables and one loading skeleton, one rule**, counted 10 Sep
2026 — `/league`, `/prem`, both Team Stats boards, the club squad list, the club
and squad stat boards, the season grid, a match's player stats and the pool. A
plate drawn empty on a stat board is this decision, not an oversight.

Settled 5 Sep 2026, and §9's `/players` decision is the same rule read the other
way — the pool is the board that scrolls.

**And a foot row is set in mixed case at `xs`, not 9px bold capitals.** CM's own
runs at around 13px mixed case regular. Nothing in the game is set at 9px bold
caps, and ours put the smallest type in the app on the object a thumb lands on
most. 13px does not fit six plates at 320 and 12px does; `tools/ui/navfit.mjs`
holds that line.

**Six plates is the bar's ceiling, and the sixth is now a DOOR.** Craig, 5 Sep
2026: *"if we tap a section, it could bring up more options."* The ceiling was
measured and is not negotiable — six plates at 320 are 53px each against a
widest label of 44 (`Gazetta`, exactly), and a seventh gives 45px against a 36px
budget, so `Gazetta` and `League` would both clip. That arithmetic is why the
pool was taken OFF the bar on 5 Sep rather than added to it, and it would have
demanded a rename of two existing sections every time the app grew.

So the last plate is `More`, and everything past the fifth section lives behind
it: a full-width drawer on the floor, drawn by `shell/Modal` at
`anchor="bottom"`. The bar keeps exactly six plates for ever and the ceiling
stops being a limit on how many sections the app may have.

Three things about it are rules rather than choices. **It is a plate, not a new
object** — same width, same type, same `.cm-foot` ink, and it takes
`aria-current` when you are standing in one of the sections behind it, because a
bar that marks where you are must not go blank the moment you walk through the
door. **It opens on the floor**, because it is opened by a thumb from the bar
and a menu that appears at the far end of the screen from the control that
opened it makes a reader look twice for what they just asked for. And **the desk
rail does not use it at all**: it runs down the side of a 1440 screen with room
for a dozen entries, and a disclosure on a surface where everything already fits
is chrome hiding things for no reason.

`navfit` was measuring anchors only and reported "5 sections" on a six-plate bar
— then offered room for a seventh that was already spent. It counts the door now.

**A plate owns its ink.** Dark ink on the grey plate is 7.52:1 and `--color-ink`
on it is 2.27; on the blue plate ink is 7.0 and `--color-muted` is 3.55 and
fails. So no call site sets `text-*` on either, and a count inside a tab is the
label's own colour — which is how the game printed "Fitness (40)".

**A screen has a SUBJECT and a VIEW, and they are two boxes.** The plated bar
names what the screen is ABOUT — a competition, a club, a manager, a footballer.
There is no third, smaller bar for a subject with no colour of its own: the
subject is the biggest object on a CM screen whatever it is, and a footballer
does not get a 30px strip where the division he plays in gets 64. Retired 5 Sep
2026, with the league crest that rode in it — it is the LEAGUE's mark, and on the
FPL tab or a Premier League player's page it says the wrong thing.
The yellow caption under the tab strip names which of that subject's views you
are looking at. `cm9900/24.jpg` heads the bar `English Premier Division` and
captions the panel `League Table`; `25.jpg` heads it `Everton` and captions the
panel below it. Every screen in the library carries both, and none of them mixes
the two.

**The one exception is CM's own news screen, and it is granted.** Its bar reads
`Mike Paul News` — subject and view in one line, with no caption — and it is the
single screen in the library that does.

The app refused the exception on 5 Sep 2026, on the argument that a rule holding
on nine screens and not the tenth is not a rule, and heading the bar with the
league instead. Craig reversed it the same evening (*"needs 'Draft team name
news' not pro league"*), and the reference is right: the news IS the manager's —
his signings, his doubts, his round — and a bar reading the competition made it
the league's noticeboard rather than his post. So `/news` heads the bar
`123 News` and draws no caption, because "News" under a bar that already ends in
the word is the two boxes saying one thing twice. A reader with no team gets the
plain word, which is also what the loading frame shows.

**And a caption is never a literal at a call site.** `app/titles.ts` holds them
all, keyed on the section a shell already knows it is, so `LeagueShell` and
`PremShell` look their own up and a page passes no title at all. Counted before
extracting: `League Table` was written at 7 sites, `Matchups` and `Results` at 6,
`Schedule`, `Team Stats` and `Fixtures` at 5 — every screen writing its own name
two or three times over, across the page, its loading skeleton and each
early-return branch. One of those going stale is a screen that renames itself
while it loads.

### Icons — inline SVG, beside a word, never instead of one

**The desk had none until 10 Sep 2026, and that was a position rather than an
omission.** Championship Manager 99/00 draws no icons anywhere: every mark in the
game is a word, a figure, or a coloured block. `shell/Rail` records the app's own
version of that — introducing an icon set for two marks is a whole visual
language for a small gain — and the app answered "what happened to this man" with
letters instead (`Chips`' `G`, `A`, `YC`).

They arrive for one job: the seven events that change a match, on the Match
Report (Craig, 10 Sep 2026: *"maybe we add icons too where appropiate"*). The
rules are what keep them from becoming a set:

- **Inline monochrome SVG, and never emoji.** An emoji carries its own colour and
  the reader's operating system's house style, which hands a palette where every
  colour is a slot to Apple and Google. A glyph takes `currentColor`, so it wears
  whatever tone its row already had and adds no colour of its own.
- **Beside the word, never instead of it.** A glyph alone is a rebus. The word is
  also what a screen reader gets: the icon is `aria-hidden`, because the two
  together would say "goal goal".
- **Sized in `em`**, so a glyph matches the type it sits in without a second
  scale to keep in step.
- **Only where the event IS the fact.** A report is mostly corners and blocked
  shots; the seven that change a match are the seven that get one, and everything
  else stays prose. An icon on every row is a wall with pictures in it.

A card is the exception that proves the first rule: `TeamSheet` draws a booking
as a small filled rectangle rather than as a glyph, because CM draws exactly that
(`cm9900/16.jpg`) and a coloured block in an existing slot needs no icon set at
all. Where the reference already has a mark, the reference wins.

## 3. The Desk's palette

Each colour is a **slot with one meaning**. This is CM's actual grammar and it
is more specific than a palette; it is the reason the token names in
`tokens.css` did not change when every value did.

| Slot | Token | Means | On `--bg` |
|---|---|---|---|
| Ground | `--color-bg` `surface` `raised` `line` | depth, never meaning | — |
| Ink | `--color-ink` `muted` `faint` | how loud | 17.0 · 8.6 · 5.7 |
| Yellow | `--color-accent` | **yours · selected · active · primary** | 13.1 |
| Cyan | `--color-info` | **a derived reading** — ours rather than recorded | 11.2 |
| Amber | `--color-mid` | **a figure standing alone beside a name** — never a column of a standings table | 9.8 |
| Red | `--color-bad` | **a loss, a doubt, a negative** | 5.6 |
| Green | `--color-up` | **a gain** — the other half of the direction pair | 9.9 |
| Live red | `--color-live` | **a match in play**, and nothing else | 5.4 |
| League red | `--color-league` | the league's own mark. Chrome only | 3.2 |
| Deep league red | `--color-league-deep` | the same red as a **ground with text on it** | — |
| Hot | `--color-hot` | **a figure at the top of its column** — the GREEN of the direction pair, as a ground, and only on a board of many measures | ink 10.3 |
| Cold | `--color-cold` | the same at the WRONG end of a column, where high is the bad end — the same pair's red | ink 11.3 |
| Cream | `--color-cream` | ink on a colour plate | — |
| Quiet on a plate | `--color-faint-plate` | the same **quiet** as `--color-faint`, on the blue plate that will not carry it | — |

**Cyan said "a person" until 3 Sep 2026, and that was a misread of the
reference.** `docs/ui/reference/README.md` recorded a "person link" in cyan and
cited two shots for it; the shots say the opposite, and the correction is now at
the head of that table. A name in Championship Manager is WHITE — grey when the
man is unavailable — and the cyan is the column beside it: the rating in
`16.jpg`, the Position and training schedule in `12.jpg`, the condition in
`21.jpg`. One cyan name per screen is the selected row, which is a state.

So the slot is **a reading we DERIVED**, against white for a fact somebody
recorded. That is a distinction this app already has to make and makes in words
— §7's provenance rule says our figures are labelled and never sit in a column
headed `FPts` — and it now has a colour for it. Seven sites inked a player's
name cyan and none do; the slot is deliberately near-empty until a derived
figure claims it, which is better than it meaning two things.

**Amber narrowed on 5 Sep 2026** (Craig), and the wording is the whole change:
*a figure standing alone beside a name — a fact, a ledger line, a board's value —
never a column of a standings table, where every figure is ink and only yours
takes the accent.* It had been carrying For and Ag on `/league` and `/prem`, on
the reasoning that fantasy points and goals are a different KIND of number from a
win count. They are, and the table already says so by giving them their own
columns; what the colour was doing was tinting two columns of a table in which
every other figure is white. `cm9900/24.jpg` is white throughout with yellow for
your own club, and two hues in one row is where a reader starts looking for a
meaning that is not there.

**The narrowing is a negative clause and deliberately not a positive one.** The
first draft of this paragraph ended "where amber still belongs is where it is the
ONLY figure on the line", which reads well and is contradicted by six shipped
surfaces — the club squad table, two stat boards, a match log, the attribute grid
and the season grid all set several amber measures on a line. Those are boards of
measures rather than standings tables, and whether the slot should reach them is
a separate question from the one Craig answered. Counted 5 Sep 2026 by
`register-warden`; listed in PLATFORM_NOTES as open. What §3 says today is only
what the tree does: **never a column of a standings table.**

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

*A dimmed thing on a blue plate takes `--color-faint-plate`, not `--color-faint`.*
`--color-faint` is 5.30:1 on the page ground and **2.35:1 on `--color-chrome`**,
and nothing had ever checked it there because nothing had ever greyed a TAB.
`/prem/match/[id]` greys its Players plate before a ball is kicked;
`tools/ui/sweep.mjs` read 2.36:1 at both widths on 4 Sep 2026. The replacement is
4.77:1 measured off the rendered pixels, against `--color-ink`'s 6.97 on the same
ground — so it still reads as the dimmer of the two, which is the whole job.
`.cm-tab.cm-out` in `desk.css` is where it lands, and the club and squad strips
have carried the same latent failure since they were built.

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

**Hot and cold are the first GROUNDS that carry meaning, and the clause above
them still stands.** "Depth, never meaning" is a rule about the `bg → surface →
raised → line` ladder — one hue at chroma 0.012, the whole of it inside 1.71:1,
and its job is to say how deep a thing is cut into the page. These are not rungs
on it, any more than `--color-face` or `--color-chrome` are.

**They are the DIRECTION PAIR at a ground lightness**, which is what makes them
cost no new hue. `--color-up` is a gain and `--color-bad` is a loss, as ink;
these are those two, filled. So the mark needs no learning — nobody has ever
misread green — and the slot is an extension of a pair the app already has
rather than a sixth colour family.

*They shipped brown for an hour*, taken from the reference's own hue, and Craig
threw it out the moment he saw it: *"can we use more fun CM colours than brown
though?"*. He was right twice — brown is nobody's slot in this file, and the
answer was already in the table above it.

They exist because of Opta's season-stats grid, which Craig put beside our pool
board on 10 Sep 2026 (*"it organises the data much better than us"*). That grid
shades **every** numeric cell on a continuous brown-to-purple ramp, and a
continuous ramp is the one thing this section cannot have: a hue sliding through
a range is a colour saying twenty things where every other colour here says one.
Craig's ruling kept the idea and dropped the ramp — *"magnitude ramp, but maybe
just highlight the really good values? we also can use better colours for us
too"* — so what shipped is a **threshold and not a scale**. A cell is lit or it
is not; there is no second strength, so there is nothing to misread.

**What earns a mark is arithmetic and lives in `players/standout.ts`**, not here:
the highest figures in a column, taken whole values at a time, for as long as
that stays inside a sixth of the men who have a figure at all. A column whose top
value is common — `GP` three rounds in, `Min` in August, `YC` at any time — lights
nothing, which is the true answer rather than a guarded one. That is also why the
slot is confined to **a board of many measures** and is not available to a
standings table: §3's amber clause already settles that a standings column is ink
throughout, and a threshold that lit two of ten league rows would be the accent's
"yours" claim with a second author.

**A lit cell takes the loud ink, and that is a derived rule rather than a
taste.** `--color-faint` is 3.3:1 on `--color-hot`, so a marked figure keeping
the quiet ink of an ordinary one would be the least legible thing on the board in
the one place the board is pointing at. `--color-ink` is 10.27:1 there and 11.34
on `--color-cold`. Against `--color-surface` the two grounds sit at 1.45:1 and
1.31:1 — a real step, and inside the range the depth ramp already occupies, so a
lit cell reads as part of the table rather than as a sticker laid on it.

**And the board carrying them is OPAQUE, which no other table is** (Craig, same
day: *"also it needs to be opaque too"*). `.cm-panel` is deliberately 88% and its
own docblock defends it well — CM's panels let the match photograph read faintly
through, and at 88% the picture contributes about four parts in 255. That holds
for a ten-row standings table set in `text-base`. It does not hold for
twenty-four columns of `text-2xs` over a photograph with a white crowd and a red
hoarding in it, which is 12% of something bright rather than 12% of the mean. The
tell was on screen before it was named: the frozen name column has carried an
opaque fill since it was frozen, so the board rendered with one solid column and
twenty-three translucent ones.

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

**Rank set in scale means the sheet needs ranks to set.** The front page runs
three under the masthead, and all three are headlines: the **splash**, two
**shoulders** side by side beneath it with their decks, and the rest as
**briefs** — a thumbnail, standing head, headline, folio number, nothing else.

**Every rank carries a picture, and the size is the hierarchy.** A band over the
splash, a card on each shoulder, a 56px thumbnail on a brief. *This reverses "a
page that gave every story a photograph would be a page with no lead on it",
which was recorded doctrine until 3 Sep 2026* — true only while every photograph
is the same size, and falsified by the reference Craig handed over, a news site's
front page on a phone, which pictures the hero, both sub-heads and every list
item and still reads as three ranks. **They print through the ink**
(`.paper-face`), band and all: a saturated club colour under every headline,
once per story down the page, is the themed screen this section spends a
paragraph on, and one band over one splash could afford what a picture at every
rank cannot. **No article
prints on the front page at all.** The splash ran whole there until 3 Sep 2026,
which is what a broadsheet does and the wrong answer on a phone: a full column
put the second story on the sheet some nineteen hundred pixels down, so the two
ranks below it were furniture nobody reached, and a front page that reads you
the first story has stopped asking you to choose. The articles are on pages 2
and 3 and at `/paper/{slug}`, a tap away. Two columns for the shoulders at every width including a
phone's, because splash / two seconds / briefs is what a broadsheet does above
the fold and what a news site does on a 390px screen, and a reader has to be able
to rank the top three before reading a word of any of them. The tail was one flat
column of eight identically-set teasers until 3 Sep 2026, which spends the
scale ladder on the lead alone and leaves the second story indistinguishable from
the eighth. `docs/ui/gazetta.md` carries the reading order.

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
24/28 · 30/34 · 34/38 · 45/46.

**The three smallest steps are one pixel bigger from `lg`** — 10/13 · 12/15 ·
13/17 — and that is the one place in this scale with a breakpoint. Craig, 5 Sep
2026: *"on desktop, the fonts on rows are quite small and hard to read at
times."* The density table below relaxes a repeating ROW from 44px to 28 above
`lg`, on CM's own proportions, and nothing in that argument said the TYPE inside
the row had to come down with it: the row got denser and the label stayed at the
phone's 11px, which on a 1440 screen at arm's length is a smaller angular size
than the same label under a thumb. CM's own row is 18px of a 600px canvas and its
type fills most of it. The ladder keeps its order and every box stays on the 2px
grid, so no height in the table below moves — the heights are `min-h-*`, not
content. Until 31 Aug 2026 none of them did, and the two
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

**The desk's display type casts a shadow — and so does a row's NAME.**
`cm9900/24.jpg` sets "English Premier Division" in blue on the light competition
plate with a soft grey shadow offset down and right; `25.jpg` does the same in
white on Everton's blue one. `.cm-title` in `desk.css` is that mark, and it is
worn by exactly three things: the title-bar `h1` in both of `PageHeader`'s bars,
and the yellow caption inside a panel. **Not the tab labels, the column heads or
the rail** — they are flat in every shot, and softening them makes the whole
screen soft. Set in `em`, because the same title is 20px under a thumb and 30px
on the desk and a fixed offset is two different marks at the two sizes.

*This paragraph read "and ONLY the display type does" until 7 Sep 2026, and it
was a misread of the same shots.* Craig sent the crop that settles it (*"Font is
bolder and stands out more, and has a slight shadow"*), and both references
agree once you enlarge them: `cm9900/24.jpg` at the `1st` / `2nd` / `3rd` column
carries a dark fringe below and right of every glyph, and `cm0102/07.jpg` does
the same down a squad list.

**What takes it is the INDEX BLOCK's text, not the row's name.** That
distinction cost an hour: the first attempt put the shadow, a weight and a size
step on `ROW_NAME`, and Craig's correction was *"i mean the text in the blue
box"* — his original message says "the league placing", which is the ordinal in
the chip. The row name is unchanged and stays `sm`/`lg:base` bold.

So `.cm-index` in `desk.css` owns its text the way `.cm-bevel` owns its ink:
**size, weight 800, and a shadow at a third of `.cm-title`'s offset**, on the
class, so all twenty blue blocks in the app take it without a call site knowing.
They had been writing that text four sizes and three weights between them, and
they now set layout and nothing else.

The size was left at the call sites for an hour, behind a `PLACING` recipe, on
the argument that a chip holding a date is not a placing. Craig overruled it
(*"i think we can have the same for now and il find the correct exceptions"*),
and he is right about which way the default should fall: **one size everywhere
makes an exception an ADDITION** — a `text-3xs` written after the class, which a
reader can grep and a screen can be checked against — where twenty disagreeing
sites cannot be told from twenty decisions. `sm` under a thumb and `base` on the
desk, which is `24.jpg`'s own proportion: the placing fills most of the chip
there, and ours ran at `text-2xs` in a 45px row.

800 is a weight `layout.tsx` did not load and now does, for this alone. It is
the one place on the desk heavier than 700, and the reference is why: CM sets
the placing heavier than the club name beside it, which is the opposite of the
ratio inside a row.

Like `.cm-title` it is kept off the paper by not being worn there — the `(paper)`
routes reach `gazette/*` and two shell components, and nothing there draws an
index block. Ink on stock casts no shadow, and if one ever crosses, that is the
rule to write.

### Density — how tall a thing is, and what size it is set in

§3 gives every colour a slot with one meaning, and that table is why the token
names survived when every value changed. **Size and density had no such table**,
and the cost was measurable: five sizes for "a number in a table", one file using
three at once; the `cm-index` block drawn at three sizes with four alignments;
five tab-label recipes where the component's own docblock says there should be
two. Named against a ladder, those become disagreements. Unnamed, they were just
what each file happened to say.

The ladder is CM's, taken through PRODUCT.md's tap floor. Every row names the
recipe in `app/desk.ts` that implements it, so a doc and its code cannot drift
apart silently.

| Role | Phone | Desk | Type step | Recipe |
|---|---|---|---|---|
| Plated title bar | 64 | 96 | `xl`–`3xl`, `.cm-title` | `PageHeader` |
| The caption under it | 28 | 40 | `sm`–`lg`, `.cm-title` | `shell/Caption` |
| A row that needs two lines | 56 | 28 | `sm` | `.cm-row` + `min-h-14` |
| **A control** — button, select, input, a dialog's way out | **44** | **36** | `sm` | `BUTTON` `SELECT` `SUBMIT` |
| **A tab** — one plate of a strip | **44** | **56** | `2xs`–`sm` | `.cm-tab` + `TAB` |
| A foot-row plate | 44 | 56 | `xs` mixed case | `.cm-foot` |
| **A row of a list** | **44** | **28** | `sm`/`lg:base` name in the CHROME face, `sm` figures at both widths | `.cm-row` + `ROW_LINK` + `ROW_NAME` + `FIGURE` |
| One stated fact in a stack | 44 | 44 | `2xs` label, `sm` value | `FACT` |
| A column head over a table | 28 | 28 | `2xs` | `PLATE` (`h-7`) |
| A column head over a stats board | 24 | 24 | `2xs` | `HEAD_PLATE` (`h-6`) |
| A figure in a row | — | — | `sm`, `.numeric` | `ROW_FIGURE`, worn by `FIGURE` (centred) and `BOARD_FIGURE` (right) |
| A label that is furniture | — | — | `2xs` bold caps | `LABEL` |

**One recorded exception, and what earns one.** `prem/match/[id]/TeamSheet` sets
its names and figures a step above the row default — `base`/`lg:text-lg` against
`sm`/`lg:base` — on Craig's call of 10 Sep 2026 (*"the player text could be much
bigger on this screen too like CM… data much bigger too"*). The argument is that
`cm9900/16.jpg` is a screen whose ONLY content is twenty-two names and their
figures, so the game gives them room a many-column board cannot; every other list
on the desk shares its width with four or more measures. A screen wanting this
exception has to be able to say the same thing about itself, and `ROW_NAME` stays
where it is — six boards wear it and none has the room.

**Three of these are rules and the rest are consequences.** 44 is PRODUCT.md's
tap floor and is not negotiable under a thumb; 36 is a control on the desk; 28 is
a repeating row on the desk, which is `.cm-row` and is the number that makes a
division fit on a screen. `desk.css` carries the long argument for the pair and
`tools/ui/tapfit.mjs` measures it.

**A row relaxes and a control never does — and a TAB is the exception to both.**
A button and a select stay at their floor at every width — they are aimed at rather than read, and a mouse
misses them as easily as a thumb does. That distinction is the whole reason this
is a table of roles and not a table of pixels.

The tab GROWS instead, to 56 — `desk.css` carries the argument and it is the one
that undid a day's work: "every plate on the desk was drawn to the FLOOR the tap
rule sets rather than to a size, and chrome the size of the minimum is why Craig
kept saying the screens do not look like the game." CM is dense in its rows and
chunky in its chrome. This row said 36 until 6 Sep 2026, against a stylesheet that
has said 3.5rem since 31 Aug.

**The last two rows deliberately state no height.** A figure and a label are set
inside a row and take the row's; giving either its own height is what produced
the 37px Championship Manager row §6 opens with.

**A figure takes a step and a label does not** (Craig, 10 Sep 2026: *"The
numbers in the rows for each column are still too small on desktop"*). **Still**
is the word that made this a rule rather than a nudge: the three smallest STEPS
had already gone up a pixel on 5 Sep, which moved the figures from 11px to 12 and
left the ratio exactly where it was. The placing block and the name are both
`base` on a desk, so a row read 16 · 16 · **12** — and the twelve is the part of
a standings table the table is for. The step is the figure's own (`ROW_FIGURE`)
rather than another pixel on `--text-2xs`, which is 141 of the app's type sites
and mostly labels, and labels never complained.

**And it is one step for both widths, not a `lg:` pair.** This shipped as
`2xs`/`lg:sm` on the reasoning that the phone was never the complaint and its
44px row has the room anyway; Craig answered the first half within the hour —
*"numbers in rows are good on desktop, still small/hard to read to mobile"* — and
the second half was the argument FOR fixing it rather than against. A 44px row
carrying an 11px figure is a row with 33px of nothing in it, and 11px of
`.numeric` is 11px of a CONDENSED face at the smallest size on the screen, beside
a name already set at `sm`. Measured after: a `/league` row at 390 is 44.5px with
every figure in it at 14px, and the table still does not scroll sideways.

*The head-plate pair — 28 over a table, 24 over a stats board — is a
disagreement, not a rule. Both are now named, which is what makes settling it a
single edit rather than fifteen.*

## 7. Grammar that outranks the look

Restated because a redesign is exactly when these get broken. Their parents are
`docs/ui/conventions.md` and — for the tap rule, which `conventions.md` has never
carried — `PRODUCT.md`'s accessibility section.

- **Absence is `—`, never `0`.** A confident wrong number is worse than a hedged
  right one.
- **Provenance at the point of use.** Every derived figure says whose it is.
  Fantrax's numbers are authoritative; ours are labelled and never sit in a
  column headed `FPts`.

  **Amended 4 Sep 2026 (Craig).** The rule is about a FIGURE that could be
  mistaken for somebody else's, not about every block carrying a byline. Three
  provenance lines came off the player screen on his instruction — the attribute
  grid's "Ours, derived" and its "Rated 1&ndash;20 against every player in the
  division…" paragraph, and the seasons table's "FPL's own" — because a screen
  whose every panel is captioned with its source reads as a spreadsheet's
  footnotes rather than as Championship Manager. What stays is the part that
  prevents a misreading: `FPts` is Fantrax's word alone, FPL's points are headed
  as FPL's wherever they could be taken for ours, and each attribute row still
  carries what it was derived from in its `title`.
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

*Still the answer for `/players`, and 5 Sep 2026 gave it a general rule that says
why — see §2's table geometry below. The frozen name column has not been built;
the sideways scroll has, with CM's own bar on it.*

**The live desk splits.** Mobile `/matchday` rows expand in place from data
already on the page; the `≥lg` wall at `/matchday/desk` keeps the no-tap rule
`docs/ui/desk.md` makes binding by name, and links out instead. The rule was
written because the wall is read across a room rather than operated, and that is
still true of the wall and was never true of a phone.

**The masthead photograph is deferred, not chosen.** The picture it wants is a
league one (draft night, a trophy, ten names on a board) rather than a stock
Premier League shot, which would make the paper look like it is about the
Premier League rather than about the ten of us.

*The crest-in-a-box that held its place was cut on 3 Sep 2026, Craig: "No. 2 /
Free / Lineups lock Fri 19:45 — remove this. remove."* The deferral above stands;
what went is the frame, plus the edition number, the price and the standing
service line beside it — a fifth of a phone screen restating the crest every
other tab already carries and a lock the sidebar already gives to the minute.
**The absence is now the honest state**: the masthead is publisher, title and
dateline, and when a league picture exists it arrives as a picture rather than
as a box that has been waiting for one.

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
