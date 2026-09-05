# Conventions — tokens, components, and what must not move

**`../../DESIGN.md` is binding for colour and type and this file defers to it.**
What is here is the mechanics — which file holds what, and the traps.

Everything visual is in `apps/companion/app/tokens.css` (the desk's tokens),
`apps/companion/app/paper.css` (the paper's register, which re-points them at ink
on stock), `apps/companion/app/globals.css` (everything else) and
`apps/companion/app/components/` (markup). Tailwind v4, no config file: the
theme *is* the `@theme` block in `tokens.css`. Both stylesheets were split out of
`globals.css` as it crossed the 300-line ceiling, and `paper.css` is imported
after `tokens.css` because it answers it.

## Two registers, never muddled

The desk (League · Squads · Live · Players · FPL) is Championship Manager 99/00;
the paper (`/`) is ink on stock. **DESIGN.md §1–§5 is the contract**; the short
version is that every colour is a *slot with one meaning*, and the slot is why
the token names survived the change of every value.

| Slot | Tokens | Means |
|---|---|---|
| **Surfaces** | `bg`, `surface`, `raised`, `line` | depth, never meaning |
| **Ink** | `ink`, `muted`, `faint` | how loud |
| **Accent** | `accent` | yours · selected · active · primary |
| **Person** | `info` | a person, and secondary emphasis |
| **Figures** | `mid`, `bad` | a figure; a loss, doubt or negative |
| **Live** | `live` | a match in play, and nothing else |
| **League** | `league`, `cream` | the league's own mark. Chrome only, never "active" |
| **Pitch** | `pitch-turf`, `pitch-mow`, `pitch-line` | the grass, darker than the cut-outs so cards lift off it |
| **FDR** | `fdr-1` … `fdr-5` | FPL's difficulty, rebuilt at our lightness. Data, not dress |

Colour appears almost exclusively as **state**. Surfaces stay neutral.

Retired with their last reader, and not to be reintroduced without one:
`pl-purple`, `league-dark`, `good`. The Premier League's green, cyan and pink
left the chrome with them — the football is one tab of six, and its palette
survives only where it is data (the FDR scale, club colours).

**A plate is not the page.** `.paper :is(.pitch, .crest)` restores the desk's
tokens inside anything that is a colour picture printed on the cream page. Get
this wrong and eleven name plates go invisible, because `--color-cream` is
deliberately ink under `.paper`.

### Tailwind v4 trap, already paid for once

A theme variable is only emitted if its name appears **literally** in scanned
source. `` `var(--color-fdr-${n})` `` compiles to five variables that are never
emitted and five chips with no colour. `FixtureChip` writes the five names out in
a `Record` for exactly this reason — do not "tidy" it back into interpolation.

## Type

Four faces, four roles. Archivo carries the desk's UI; **Archivo Narrow
(`.numeric`) carries every figure in both registers** and is the shared spine —
tabular, so digits do not jitter as they tick, which is the single most important
typographic decision in a live view. Fraunces sets the paper's masthead, display
and drop caps; Newsreader its prose and italic decks. The two serifs are declared
in `app/paperFonts.ts` and imported **only by paper routes**, so the desk pays
nothing for them.

Fixed rem scale, ratio ~1.15, `--text-3xs` … `--text-6xl`. `--text-3xs` is 9px
and is now a **real floor on the pitch**: the one thing that used to sit under it
was the player card's container clamp, and that closed on 29 Aug (DESIGN.md §8).
No fluid clamps except inside the masthead.

## Shared components

| Component | Job |
|---|---|
| `shell/PageHeader` | How a section opens: crest, title, one sub-line. |
| `shell/Nothing` | A page that cannot show what it exists to show, saying why — with the provider's own error code on screen. |
| `shell/Section` | A headed block with a rule under it. |
| `shell/ButtonLink` | The one way out of a page, drawn as CM's own button (`cm-bevel`). `BUTTON` exports the plate for everything that presses but is not a link — the two dialogs' foot pairs, the search's submit, the error page's way back, the planner's external anchor. Ten sites had written the bordered box out by hand. |
| `shell/Rail` | The app's sections, in the TWO shapes Championship Manager draws them: a 130px outlined rail down the side above `lg`, and a flat `.cm-foot` strip across the bottom below it. Not one shape at two widths — a rail runs out of height and a foot row runs out of width per plate, and `navfit.mjs` asks each its own question. Stands down on `/`. The Live section only exists while football is on, and its plate carries your score under its label (`shell/LiveCount`). Carries CM's back and forward **steppers** above the rail plates (`cm9900/24.jpg`) — desk only, because a phone has the browser's own gesture and the foot row has no room for two more. They are ink rather than the accent: an arrow is not "yours, selected or active". Forward is never greyed, since only the Navigation API could say whether there is anywhere forward and a control greyed by a guess is worse than one that is simply live. |
| `shell/sections` | The six sections as data, and which one a path is in. The rail and the paper's index both print it. |
| `gazette/Index` | The same six in the paper's register — letterspaced small capitals between two hairlines — because the rail is not on the front page and a front page with no way out is a dead end. |
| `shell/LeagueCrest` | Our crest. `mark` (no type, legible to ~24px) and `full`. |
| `shell/AutoRefresh` | The app's **single** client poller, mounted by the layout. `POLL.live` during football, `POLL.idle` otherwise. Eight pages each mounted their own until 29 Aug, sized from whatever snapshot each happened to hold — so a page with no football read of its own simply froze. |
| `core/inbox/when` | When an inbox item happened, and WHICH KIND of "when". Two sources date themselves differently — Fantrax's offsetless `"Wed Sep 2, 2026, 6:11AM"` and our ISO deadline — and one untagged string carrying both sorted the 12 Sep deadline under 2 Sep deals and drew a US stamp beside a British date. `fantraxDay`/`fantraxMoment` RE-SPELL their parts (`Sep 2` → `2 Sept`, and the zone named: `6:11 AM ET`); nothing converts them, because a converted transaction can move a day. `whenKey` puts both into Fantrax's own calendar for ordering only. |
| `shell/liveTie` | Whether there is a live tie of the reader's, as one question with six guards. The layout starts it ONCE, un-awaited, and hands the promise to both wearers — so the desk's strip and the phone's plate are one Fantrax read, and neither blocks the shell. |
| `shell/LiveNow` · `shell/LiveStrip` | Your tie in the chrome while a ball is in the air, **on the desk**. Stands down on `/` and `/matchday`, which print the same tie larger, and below `lg` everywhere — 44px across the top of a phone for a number the foot row can carry in room it already has. |
| `shell/LiveCount` | The same tie as a figure under the Live plate's label, below `lg`. CM's own idiom — its fitness tab reads `Fitness (40)`. No trailing dim: the strip is a scoreline comparing two sides, this is a count. |
| `shell/Skeleton` | The loading block. Paints `currentColor` at low alpha, so it self-skins in whichever register it lands in — one primitive, no variants. |
| `shell/SkeletonRows` | The app's standard card stack at a given height, for a `loading.tsx` that has to draw its route's real frame rather than a spinner. |
| `league/TableHeads` | Championship Manager's bevelled head strip, and the only place its mechanics live: the row, the cell, the plate, the bare name cell that starts it, and `SortHead` — the plate as a LINK, drawn pressed when the table is ordered by it. Three tables sort through it (`/league`, `/prem`, Team Stats); the column LISTS stay with their tables, because different columns mean genuinely different widths. |
| `league/PitchFrame` | Hoardings + goal + turf. Full-bleed. |
| `league/PitchRows` | Players in their lines on a `PitchFrame`. **Owns card width, the name's size, and the shrink-not-wrap policy** — all three pitches go through it. |
| `league/PitchTurf` | The grass in perspective, as an inline SVG. |
| `league/LineupPitch` | Your own XI plus the bench, one target per player: tap to pick, tap again for the rest. |
| `league/MoveDialog` | Everywhere one player can go, over the pitch. |
| `league/TeamSheet` | A live XI plus bench, or the same squad as rows, every player opening `LivePlayerCard`. Both boards that show a lineup that counts draw it. |
| `league/PitchPlayer` | One player on the pitch: cut-out, name plate, points band. |
| `league/BoardBar` | The strip above a board: the Pitch/List control at the LEFT and whatever the board has to say opposite it. Three boards had grown their own copy and two of the three agreed about which side the toggle went. |
| `league/Pending` | Points Fantrax has not credited yet — a clean sheet is settled at the final whistle and FPL has been paying it since the hour mark. Four screens print it; before this they were four spellings of one rule, two of which could reach a `+0`. |
| `league/SeasonGrid` | Championship Manager's attribute grid — the squad's season as one bevelled panel per scoring group, thirteen keeper columns and eleven outfield, every figure Fantrax's own. The **second panel** on `/squad/[teamId]`, and it costs one cache hit: `squadSeason` already reads this table to price the board. |
| `league/PlayerImage` | The cut-out itself, with its fallbacks. Client-only, and has to be — see below. |
| `football/FixtureChip` | Opponent + (H)/(A), coloured by FPL's difficulty. **Never wraps** — the band under a sticker is a fixed 20px with `overflow-hidden`, so a second line is guillotined rather than spilled. |
| `football/PlayerPortrait` | 32px headshot on club colour, for list rows. |
| `shell/TabStrip` | The blue tab strip under a title bar. Five strips use it — the League section, the Premiership section, a fantasy team's five views, a club's four, a player's five. (It read "three" until 4 Sep 2026 and had been undercounting `PremNav` since 2 Sep.) `dim` greys a tab that has nothing behind it for THIS subject and keeps it in place, which is CM's answer for an empty view (`cm0102/07.jpg`). |
| `shell/Caption` | The yellow centred caption inside a panel. The bar above names the subject; this names the view. Every screen in the reference carries both. |
| `shell/Section` | A headed block with a rule under it, **on a plate**. The plate is the section's and not each caller's (Craig, 4 Sep 2026: "use the transparent ish panels in other pages and make sure that's now a universal shared property") — four callers had begun wrapping their own children in `PANEL` and the heading was outside it every time, so every headed block in the app printed its title and its provenance onto the photograph. Invisible until `groundfit.mjs` was repaired the same day. It also makes the desk more like the reference: `desk.css` already says a CM screen is "several bevelled PANELS, each opening with its own title bar". |
| `shell/PlateShell` | The frame a screen about a SUBJECT wears: his colour on the bar, his tabs, the caption, and `--cm-index` re-pointed so every table inside is drawn in his colours. Extracted at the third plated subject — a fantasy team, a club, a player — which is where `prem/club/[code]/Shell` said in writing it would be. The tab strip is passed as a NODE, not as a list and a base href: a config object would make it a nav framework three callers configure, and each caller's tab file is where its own docblock lives. |
| `shell/Modal` | A native `<dialog>` over the page. Not a hand-rolled overlay — the element already does focus, Escape and the backdrop. |
| `shell/Changed` | A figure that has just moved, briefly marked. The live desk's only animation. |
| `league/TableCells` | The other half: `IndexCell`, the ordinal in CM's index block (`24.jpg` runs `1st 2nd 3rd` down the left of every table it draws), and `ROW_LINK`, the class a board's name cell links with. Both arrived at three occurrences and not before. |
| `league/TeamBadge` | A fantasy manager's own badge, with its initial and its dashed placeholder. The club-side equivalent is deliberately NOT extracted — see the note under this table. |
| `league/TabEmpty` | The empty state INSIDE a shell: one muted line in a panel. Not `shell/Nothing`, which is a whole-page state and takes a provider code. |
| `league/GroupNav` | The stat groups under a board. Deliberately not `TabStrip`: it wraps, it is drawn shorter, and it lists groups rather than routes. |
| `league/ScoreFigure` | A score, at the one size and weight every board sets it. |
| `league/RoundWord` | "Gameweek 7" and its short forms, spelled once so four screens cannot disagree. |
| `league/Chips` | The little state chips on a player — captain, bench, the rest. |
| `league/ViewToggle` | Pitch or list, as one control. |
| `league/SquadRows` · `league/SquadBoard` | A squad as rows, and the gated board around it. |
| `league/MatchupBoard` | The head-to-head, both XIs and the running totals. |
| `league/LineupPlanner` · `league/MoveSheet` | Picking an XI, and everywhere one player can go. |
| `league/PlayerCard` · `league/LivePlayerCard` | One player, tapped open — settled and live. |
| `league/PitchDisc` · `league/CmGround` | A marker on the grass, and the ground it stands on. |
| `football/StateBox` | The box beside a name saying why he is not playing. Silent for a fit player: a box reading "fit" on every row makes the one worth seeing harder to find. **It must survive a greyed row** — the whole point of it is to say why the row is grey. |
| `football/MatchList` · `football/GameweekView` | The round in view, each fixture a native `<details>` that expands into who did what. |
| `football/PhotoGround` | The darkened match photograph behind the desk. Fixed, `-z-10`. |
| `gazette/*` | The paper's own furniture — masthead, folio, columns, the three ranks of headline (`Splash`, `Teaser`, `Brief`), their pictures (`Face`, `Drawing`) and the front page's sections. It is the other register and is documented in [gazetta.md](gazetta.md) rather than here, because none of it is shared with the desk; CODE_RULES §4's same-commit row is that file's reading order. |

**Not extracted, and worth knowing why.** The crest-and-name cell reads as six
occurrences and is two: `prem/ClubRow` and `prem/team-stats` draw the same 26px
badge, while `prem/Match` draws 22 with a spacer for a club the snapshot lacks,
the club page draws 56 in a heading, `players/[fantraxId]` puts one on a
portrait, `MatchList` draws 24 with a round grey fallback, and — since 4 Sep
2026 — `prem/match/[id]/MatchBar` draws 24/36 on a club-coloured plate with the
whole half as its tap target. One component across those takes a size, a
fallback, an alignment and an image policy, which is the generic mechanism
CODE_RULES §1 forbids. Two is a coincidence — copy it.

*The count moved from five to six and the answer did not, which is the point of
recording it: the new one is the least like the other five.*

Likewise the sort-href builder: `league/sort.ts` and `prem/sort.ts` are the same
function and that is TWO, while `players/query.ts` preserves the filter and
search state through its own `href()` and Team Stats uses different parameter
names. `SortHead` takes the href as a prop for exactly that reason.

**Rows shrink, they never wrap — and every card is the same size.** A back five
does not fit five cards at full width on a phone, and wrapping put one defender
on a row of his own below the other four, which reads as a formation nobody
picked. `PitchRows` used to give each cell `flex-1` under a `max-w`, which shrank
a crowded line and left an uncrowded one wide — so one XI stood at three sizes
down the pitch. The basis now comes from the FULLEST line in the set and is given
to every card, so a shorter line centres in the space instead.

**And the card is the only thing that shrinks.** The name inside is one step on
the type scale — `NAME_SIZE`, `--text-2xs` — and truncates when the card cannot
hold it. It was one size in container-query *units*, which sounds like the same
sentence and is the opposite one: it handed the card's crowding straight to the
type, and a line of seven printed a 7px name. A card too narrow to say a name has
nothing smaller to say instead, because FPL's `squad_number` is null on all 622 of
its elements, so the ellipsis is where the rule ends.

**The widest a card may be is 110px**, which is the width of the Premier
League's portrait file — past that the card upscales its own photograph. The
figure is drawn at that file's shape (110×140) rather than the old `1.32`, and
`PlayerImage` takes it from `--pitch-figure` with the crop as its default, so
only the card that sets the variable moves.

**And the tallest it may be comes from the ROW count, not the line.** The two
bounds pull in opposite directions and that is the whole trap: width is a share
of the fullest line, so *fewer* per row means a *wider* card, and an upright
figure makes a wider card a taller one. Left unbounded, the slackest formation in
the league drew the tallest card and overflowed the phone by 199px while the
crowded one fitted. `.pitch-figure` caps the height at the room one row has —
`(100svh - --pitch-page) / --pitch-rows` less the two bands — where
`--pitch-rows` is set by `PitchRows` and by both bench strips, so a reserve
matches the man he would replace in height as well as width. `--pitch-page` lives in
`pitch.css` beside the cap that reads it, and is **one value at every width**: it
used to rise at `md` because the tab bar went overhead there, and when the rail
replaced the bar the page was measured spending the same 290px on furniture at
390, 768, 1024 and 1440 alike. **A pitch with a bench under
it is a different budget** — `.pitch-with-bench`, set by `TeamSheet` and
`LineupPitch`, the two that know there is one — because one number for both made
the quiet page pay for the busy one. Row padding is
the taper's **own** inset — `FAR_INSET`, exported by `PitchTurf` and set on the
frame as `--pitch-inset`, which the hoardings read too. One number, three
readers: it used to be written out twice with a comment asking the next person to
keep the two in step.

**A two-line row stacks on a phone and goes inline above `lg`.** Four rows do it
— the pool's name over his position and club, the schedule's competition under
the tie, the squad list's opponent under the team, the scorer's owner under his
name — and it is what takes each of them to the desk's 28px, because
`.cm-row`'s `min-height` is a floor and a second line simply ignores it. The
pattern is `flex-col lg:flex-row lg:items-baseline lg:gap-2`, with `min-w-0
truncate` on the line that may be long and `shrink-0` on the short one, so the
name gives way and the meta stays whole. `SquadRows` records the same finding
from the other side: two short strings that sit happily beside each other had
doubled the height of a fifteen-row list to stack them. A phone has no room to
put them side by side and a desk has nothing but.

**The page's own measurements are tokens, and for one reason: two places read
each of them and a value that can drift from itself is not a measurement.**

- `--page-gutter` — the side margin. `<main>` sets it; the two things wide enough
  to break out of it, the pitch and the bench strip, use `.bleed`, which is the
  negative of the same value. Three files used to write `px-3 sm:px-4` and
  `-mx-3 sm:-mx-4` by hand.
- `--page-frame` — how wide the page may get. `<main>` and the tab bar above it
  both read it once; they were `max-w-2xl` and `max-w-6xl`, so the bar was a
  broadsheet while the page under it was a 640px column at every viewport, and
  the front page's rail could never arrive. The rail took the bar's job and sits
  beside the frame rather than inside it, so `<main>` is the only reader left.
- `--page-foot` — the room `<main>` leaves under the page. It was the bar's own
  height plus the phone's safe area and is now 2rem of room at every width, the
  bar having gone; the inset moved to `body`, where it is the phone's rather than
  the bar's. The front page runs its stock out through it; without that, a cream
  page ends in a band of desk navy.

## Recipes — where a shared class string lives

A component owns an element; a recipe is the composition of look, layout and
size that a screen writes. The codebase had all three kinds of home and picked
between them by accident, so the rule is stated before the table.

| The thing is… | Home | Why |
|---|---|---|
| A pure **appearance** — fill, border, bevel, ink | a class in `app/desk.css` | the cascade owns it, and `.paper` re-points the same tokens without touching a component |
| Appearance **plus layout**, with per-caller variation | an exported class string in `app/desk.ts` | a component would own nothing but a string and would need a `className` prop to hand it back |
| Appearance plus layout, **no variation**, at 3+ sites | a component under `app/components/` | it owns its element and its aria, and a caller cannot get it half right |

`app/desk.ts` is the middle row's home, paired with `desk.css` — the looks in the
stylesheet, the recipes beside it. Named for the register it serves; the paper
keeps its own. **A repeated class string is named there at the third occurrence,
with its row here in the same commit.**

| Recipe | What it is | Was |
|---|---|---|
| `SMALL_CAPS` | The small-caps geometry with no ink, for the caller that needs a different one. | `LABEL`'s other half |
| `LABEL` | `SMALL_CAPS` in the ink furniture is set in. Callers keep their own layout and font. **Appending a colour does not work** — two colour utilities are resolved by stylesheet order, so `${LABEL} text-bad` renders faint; compose from `SMALL_CAPS`. | 26 sites, 22 files |
| `FIGURE` | A figure in a repeating row: tabular, centred, `2xs`. | 3 identical private `const FIGURE` |
| `QUIET_FIGURE` | `numeric text-2xs text-faint` — a figure the reader scans PAST. **Nine sites in five files**, counted 4 Sep 2026; `desk.ts` had listed it under "Declined" at four files and left it for the next pass, and this was that pass. `SLOT_FIGURE` is now composed from it rather than spelling it out, so the pair cannot drift. |
| `SLOT_FIGURE` | The same cell holding something the reader scans past — a shirt number, a position. Same width or the column bends. | 1, named as `FIGURE`'s pair |
| `TONE` | Which way a form result leans. `W`/`D`/`L` as DESIGN §3's direction pair. | 2 byte-identical |
| `TEXT` | Where a column's text sits. `TableHeads.JUSTIFY` is the flex twin. | 2 byte-identical |
| `BOARD` | A table that fills its panel and rules its own rows. | 9 files |
| `ROW_RULE` | The rule between two rows of a TABLE. `border-bg`, the darker step, so a table reads as grooved rather than as fifteen boxes. A LIST is ruled `--color-line` by `.cm-rows` instead, and that distinction is why both colours exist. | 14 files |
| `SCROLL` | What a board is wrapped in so a phone can reach its far columns. | 14 sites |
| `HEAD_PLATE` · `HEAD_PLATE_END` | A column head on a stats board (`h-6`), left over a name and right over a figure. `TableHeads.PLATE` is the `h-7` twin over a table. | 12 sites, 3 files |
| `PANEL` | The default panel: a CM well holding a column of things. A caller with a reason keeps its own spacing and states it; a caller without one takes this. | 6 sites agreed already, 4 strays joined |
| `PANEL_FLUSH` | The same well with no spacing of its own, for a panel whose single child manages it — a board, a ledger, a grid. A different decision from `PANEL`, not `PANEL` minus two utilities. | 6 sites |
| `HEAD_CELL` | The `<th>` a stats board's head plate sits in: no padding, because the plate carries it. | 3 boards — the same three that share `HEAD_PLATE` |
| `FACT` | One stated fact in a stack: bordered, at the tap floor at both widths. | 4 files |
| `FACT_LABEL` | The label half of a `FACT` row — takes the room the figure does not, and truncates rather than wrapping. The truncation is the part worth naming: a Fantrax label is a full sentence on some rows, and a row that wraps to three lines stops being a row. | 5 files |
| `SCORE_CREST` · `SCORE_CREST_PX` | The 22px crest beside a scoreline. **Not `--row-badge`**, which is 26px, drops to 20 on the desk, and is set on `.cm-row` — a class a scoreline panel must never wear. | 7 literals across 3 files |
| `SUBMIT` | The button that submits a form it sits inside. | 3 sites |

One CSS class was split in the same run: **`.cm-scroll` draws CM's bevelled bar
in either axis, and `.cm-scroll-y` adds the reserved gutter**, because
`scrollbar-gutter` reserves the inline-end one and two boards that scroll only
sideways were paying 16px for a bar that could never appear.

**`desk.ts` records what it declined, with the count**, and that section is the
point of the file rather than an afterthought. `const DASH = "—"` is named in 9
files against 68 unnamed `"—"` literals in 34 others: a shared constant most call
sites ignore makes a codebase look centralised while it is not, which is worse
than honest duplication because the plausible name hides the scatter.

DESIGN §6's density table is the other half of this — it says how tall each of
these is and what size it is set in, and every row of it names the recipe here
that implements it.

## Four mechanics worth knowing before you touch them

**Portraits are transparent cut-outs, and nothing is drawn behind them.** That is
now the whole look: no card, no keyline, no studio backdrop — the pitch is the
background. It replaced a 1994/95 Merlin sticker, which was handsome on its own
and wrong at fifteen-up, because every border and backdrop sat between the reader
and the only two things he came for: the face and the fixture.

`PlayerImage` is a client component and has to be. A transparent PNG cannot be
layered over a fallback and left to cover it, so a fallback can only appear once
an image has actually failed to load — and only the browser knows that.

Four rungs: **this season's photograph → one of ours → the club's kit →
initials.**

- About 17 in 60 players have no photograph in the Premier League's current set.
- **Ours** live in `apps/companion/public/portraits/{code}.png`, keyed on the FPL
  season-stable player code, dropped in by hand. A missing one costs a local 404.
  **Not `public/players/`** — that path is the player-profile route, so a miss
  there resolves to a page rather than a 404 and asks Fantrax about an id that is
  not a player.
- **The kit** is the floor and a solid one: `shirtUrl(club, keeper)` picks by club
  code rather than by a photograph of a man, so it is right the day he signs.
  Keeper kits are the `_1` variant, chosen by `isGoalkeeper(slot.position)` —
  which reads the same single declaration the pitch order rests on, so a league
  that files keepers under "GK" needs one edit and not two.
- The set *before* the current one still answers and is deliberately never used:
  it would put those players back in the shirts they wore two clubs ago, and a
  wrong photograph is worse than none because only one of the two looks like an
  answer.

The case that still slips through is a photograph taken *within* the current set
and overtaken by a January transfer — undetectable from the asset, and nothing
marks it. A file in `public/portraits/` overrides it.

**The points band, and the one rule under it: a card says one thing at a time.**
The third band of a player on the grass is his fixture until he kicks off and his
score after it, and the two never share the space. Played, it flips to a dark
ground with cream numerals so the figure a manager came for is the loudest thing
on the card; waiting, it is the FDR colour at full strength. Both are the same
fixed height — a line whose cards stand at different heights stops reading as a
line — and "he has not played" is said by dimming the **photograph** alone.
Dimming the whole card said it too, and took the fixture colour and the name with
it.

**Two player cards, and they are not one card with a flag.** `PlayerCard` answers
*who is this and is he fit* — read midweek, going through somebody's fifteen: the
fixture, the kickoff, FPL's fitness note, why a slot is unresolved.
`LivePlayerCard` answers *what is he scoring and why* — read at ten past four:
Fantrax's own category breakdown, summing to the total exactly, with FPL's record
on a line of its own and labelled as FPL's. Same dialog skeleton, different
questions, opened on different days. A third card is a sign one of these two has
lost its question.

**The pitch angle is in the ground, never in a transform.** A CSS `perspective`
on the container would tilt the stickers with it, and a sticker is a flat printed
object photographed square. The trapezoid, the growing mow bands and the splayed
markings are drawn in `PitchTurf`.

## Motion and access

150–250ms, ease-out only; users are in flow. The live dot is the one place
motion carries meaning, and it is always paired with the word LIVE so it never
relies on colour or movement alone. `prefers-reduced-motion` has a real
alternative for every animation. One focus treatment everywhere, never removed.

## Times

Every time in the app is UK time wherever the reader is (`londonTime.ts`), and
"15:00" has to mean the same thing in Toronto as in Leeds. Fantrax's own
timestamps carry a US Eastern offset and are shown **verbatim with their zone
named**, never silently converted.
