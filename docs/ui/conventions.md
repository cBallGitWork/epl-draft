# Conventions — tokens, components, and what must not move

**`../rules/DESIGN.md` is binding for colour and type and this file defers to it.**
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
the paper (`/`) is ink on stock. **docs/rules/DESIGN.md §1–§5 is the contract**; the short
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
| **Pitch** | `pitch-turf`, `pitch-mow`, `pitch-line` | the grass, darker than the kits so cards lift off it |
| **FDR** | `fdr-1` … `fdr-5` | FPL's difficulty, rebuilt at our lightness. Data, not dress |
| **Doubt** | `doubt-out`, `doubt-major`, `doubt-slight` | how likely he is to MISS — `doubtBand`'s three, on FPL's own 0/25/50/75 steps. A ramp and not three slots, hue-locked to `bad` and `mid` so no new family enters. The box beside his name still says WHICH |

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
emitted and five chips with no colour. `football/fdr` writes the five names out in
a `Record` for exactly this reason — do not "tidy" it back into interpolation.

## Type

One role per face. On the desk, Oxanium sets the chrome (bars, tabs, the rail,
column heads) and Jost the text and names, since 31 Aug 2026; Archivo sets only
the paper's letterspaced small capitals. **Archivo Narrow
(`.numeric`) carries every figure in both registers** and is the shared spine —
tabular, so digits do not jitter as they tick, which is the single most important
typographic decision in a live view. Fraunces sets the paper's masthead, display
and drop caps; Newsreader its prose and italic decks. The two serifs are declared
in `app/paperFonts.ts` and imported **only by paper routes**, so the desk pays
nothing for them.

Fixed rem scale, ratio ~1.15, `--text-3xs` … `--text-6xl`. `--text-3xs` is 9px
and is now a **real floor on the pitch**: the one thing that used to sit under it
was the player card's container clamp, and that closed on 29 Aug (docs/rules/DESIGN.md §8).
No fluid clamps except inside the masthead.

## Shared components

| Component | Job |
|---|---|
| `shell/PageHeader` | How a section opens: the title bar and one sub-line under it. **Two bars, not three** — a light competition plate and a blue club/person one, both `min-h-16 lg:min-h-24` with the title centred. The bare ~30px strip with the league crest in it was retired 5 Sep 2026: a screen's SUBJECT is the biggest object on it whatever the subject is, and the crest is the LEAGUE's mark, which says the wrong thing on the FPL tab. |
| `shell/Nothing` | A page that cannot show what it exists to show, saying why — with the provider's own error code on screen. |
| `shell/Section` | A headed block with a rule under it. |
| `shell/ButtonLink` | The one way out of a page, drawn as CM's own button (`cm-bevel`). `BUTTON` exports the plate for everything that presses but is not a link — the two dialogs' foot pairs, the search's submit, the error page's way back, the planner's external anchor. Ten sites had written the bordered box out by hand. |
| `shell/Rail` | The app's sections as CM's RAIL: a 130px outlined column down the side above `lg`. It decides the section list once from the round and hands it to `shell/ThumbRail` for the phone. Words only; the phone's rail carries the glyphs. |
| `shell/ThumbRail` | The same rail laid along the foot below `lg`: six tabs, a 24px glyph over each `xs` word, 56px plus the safe-area inset. The second tab is yours (Team, or Live with your score); the last is More, a link to `/more`. `navfit.mjs` holds the 49px label room at 320. |
| `shell/glyphs` | The rail's glyph set: one 24 grid, one 2px stroke, square caps, fills only where CM fills a cell, and the PL's own lion for Prem (`plLion.ts`). |
| `shell/UnreadBadge` | Mail's unread count: inbox ids this device has not seen, a cyan plate capped at `9+`, cleared by opening Mail, pulsing only on arrival. It takes the layout's un-awaited inbox read and `use()`s it, like the live tie. |
| `shell/sections` | The sections as data, which one a path is in, which of them this round puts on the phone's rail (`sectionsFor`), and when the More tab is current (`moreOwns`). The rail prints it, on the paper as well as the desk. |
| `shell/LeagueCrest` | Our crest. `mark` (no type, legible to ~24px) and `full`. |
| `shell/AutoRefresh` | The app's **single** client poller, mounted by the layout. `POLL.live` during football, `POLL.idle` otherwise, waking at kickoff: it counts down the layout's `liveIn` (`cadence.ts`). Eight pages each mounted their own until 29 Aug, sized from whatever snapshot each happened to hold — so a page with no football read of its own simply froze. |
| `core/inbox/when` | Fantrax's offsetless US Eastern stamp, `"Wed Sep 2, 2026, 6:11AM"`, read as an instant: `fantraxInstant` takes the offset of the stamp's own date (EDT or EST), and `fantraxDay`/`fantraxTime` print it in London like every other time. Mail's deals carry the instant, so an inbox item has one kind of "when". |
| `shell/liveTie` | Whether there is a live tie of the reader's, as one question with six guards, the football's asked before Fantrax is read. The layout starts it ONCE, un-awaited, and hands the promise to both wearers — so the desk's strip and the phone's plate are one Fantrax read, and neither blocks the shell. A provider failing is no strip; anything else still throws. |
| `shell/LiveNow` · `shell/LiveStrip` | Your tie in the chrome while a ball is in the air, **on the desk**. Stands down on `/` and `/matchday`, which print the same tie larger, and below `lg` everywhere — 44px across the top of a phone for a number the thumb rail can carry in room it already has. |
| `shell/LiveFigure` | The same tie as the Live tab's figure, in the glyph's slot below `lg`, stepping down the type scale by length (`scoreSize`); the match clock when there is no tie of yours. |
| `shell/Skeleton` | The loading block. Paints `currentColor` at low alpha, so it self-skins in whichever register it lands in — one primitive, no variants. |
| `shell/SkeletonRows` | The app's standard card stack at a given height, for a `loading.tsx` that has to draw its route's real frame rather than a spinner. |
| `league/TableHeads` | Championship Manager's bevelled head strip, and the only place its mechanics live: the row, the cell, the plate, the bare name cell that starts it, `SortHead` — the plate as a LINK (`href`, server-ordered) or a button (`onSort`, a client board), drawn pressed when the table is ordered by it — `MUTE`, the class a head takes when its column names itself, and `PlateHead`, a head that does not sort (the cell and its 28px plate, at the start or centred; 19 sites in 9 files on 25 Sep 2026). **Every table's head row is `HeadRow`** (2 Oct 2026; seven had a bare `<tr>` or their own `text-2xs`), and `PRESSED_PLATE` is the one held-down plate over a board ordered by a column that is not a control (Prem Team Stats, /prem/data, the planner). Ten boards sort through it (30 Sep 2026), the squad's stat board the one by `onSort`; the column LISTS stay with their tables, because different columns mean genuinely different widths. |
| `league/PitchRows` | Players in their lines, on `CmGround`'s diagram, the only ground since 21 Sep 2026. **Owns card width, the name's size, and the shrink-not-wrap policy** — all FIVE go through it — both squad views, the head-to-head, `/fpl` and `/prem/club/[code]`'s predicted eleven, which is the only one about a real club. What it does NOT own is the pitch's width against the fold: `.pitch`'s ratio turns any width into a height, so a pitch with no second column beside it caps its own — `fpl/FplPitch` and `league/LineupPitch`, two occurrences, copied rather than named. |
| `league/LineupPitch` | Your own XI plus the bench, one target per player: tap to pick, tap again to put him down. Draws `SquadMarker`, same as the head-to-head — it had a sticker of its own until 21 Sep 2026. |
| `league/SquadMarker` | A fantasy roster slot as a `PitchMarker`: the league layer's vocabulary translated into football's, in one place. **Three sites** — the planner's pitch, and the head-to-head's grass and bench. The BUTTON round it stays with each caller, because they disagree about what a tap does. |
| `league/BenchStrip` | The reserves under the grass, numbered from the left and on the pitch's own inset and row budget. Two callers, extracted because the next change was going to be made twice — and because the two had already drifted once over card width (see `PitchRows`). |
| `league/TeamSheet` | A live XI plus bench, or the same squad as rows, every player opening `LivePlayerCard`. Both boards that show a lineup that counts draw it. |
| `league/Pending` | Points Fantrax has not credited yet — a clean sheet is settled at the final whistle and FPL has been paying it since the hour mark. Four screens print it; before this they were four spellings of one rule, two of which could reach a `+0`. |
| `league/SeasonGrid` | Championship Manager's attribute grid — the squad's season as one bevelled panel per scoring group, thirteen keeper columns and eleven outfield, every figure Fantrax's own. The **second panel** on `/squad/[teamId]`, and it costs one cache hit: `squadSeason` already reads this table to price the board. |
| `league/PlayerImage` | The cut-out photograph, with its fallback ladder. Client-only, and has to be — see below. The player profile, the paper's face and picture, the live card, and **two pitches**: a club's predicted XI and the match line-up, through `PitchMarker`'s `face`. |
| `league/PlayerShirt` | The club's kit, and the only place it is drawn. What every pitch but a club's predicted XI and the match line-up draws. Server component — it has no ladder to walk. |
| `league/PitchMarker` · `league/CmGround` | A marker on the grass, and the ground it stands on. The marker is a kit on a translucent wash, the name on Championship Manager's bevelled plate, and under it the fixture or the score on the desk's navy. Was `PitchDisc`, a cut-out head in a coloured circle, until 10 Sep 2026; the band carried the opponent's club colour from 10 to 21 Sep, and gave it up when the card gained two other things to say in colour — how likely he is to MISS on the plate, and the whole card in the same colour (red out since 21 Sep; orange and yellow doubts since 1 Oct). |
| `football/fdr` | FPL's five difficulty steps, each with the ink that survives it. **Not a component** — `FixtureChip` drew one and lost its last caller on 21 Sep 2026 when the planner's band went to `PitchMarker`'s opponent colour, so the file is named for the scale that outlived it. Two consumers: the profile's fixture run and the player dialog's fixture line. |
| `football/PlayerPortrait` | 32px headshot on club colour, for list rows. |
| `football/clubIndex` | CM's index block re-pointed to a club's colour, with the ink that reads on it; paired with `cm-index-scoped`. **Not a component** — a style the team sheet, a club's stats board, the match board's plates and the shot list's minute tile all set (4 sites, 23 Sep 2026). |
| `shell/TabStrip` | The blue tab strip under a title bar. Eighteen strips in seventeen files use it (counted 2 Oct 2026): the League section, the Premiership section and Scout's pool; a fantasy team's, a club's, a player's and a match's tabs; and the views inside a screen — the head-to-head, the cups, Live and its top stats, Compare, the planner, and a match's players, stats and zones. (It read "seven" from 23 Sep, and "three" until 4 Sep 2026.) `dim` greys a tab that has nothing behind it for THIS subject and keeps it in place, which is CM's answer for an empty view (`cm0102/07.jpg`). |
| `shell/Caption` | The yellow centred caption inside a panel. The bar above names the subject; this names the view. Not on a plated subject's screens (`PlateShell`), where it only repeated the lit tab. |
| `shell/Section` | A headed block with a rule under it, **on a plate**. The plate is the section's and not each caller's (Craig, 4 Sep 2026: "use the transparent ish panels in other pages and make sure that's now a universal shared property") — four callers had begun wrapping their own children in `PANEL` and the heading was outside it every time, so every headed block in the app printed its title and its provenance onto the photograph. Invisible until `groundfit.mjs` was repaired the same day. It also makes the desk more like the reference: `desk.css` already says a CM screen is "several bevelled PANELS, each opening with its own title bar". |
| `shell/PlateShell` | The frame a screen about a SUBJECT wears: his colour on the bar, his tabs, no caption, and `--cm-index` re-pointed so every table inside is drawn in his colours. Extracted at the third plated subject — a fantasy team, a club, a player — which is where `prem/club/[code]/Shell` said in writing it would be. The tab strip is passed as a NODE, not as a list and a base href: a config object would make it a nav framework three callers configure, and each caller's tab file is where its own docblock lives. |
| `shell/OutLink` | A link that LEAVES the app: a plain anchor, `target="_blank"` and `rel="noopener noreferrer"`, on `ButtonLink`'s plate unless a caller passes its own. **The ↗ is the component's, not the caller's** — every one of the five sites typed `&nearr;` after its own label and React serves that as `&amp;nearr;`, so three shipped screens printed the entity as text. One arrow in one place. Five sites, counted 7 Sep 2026. |
| `shell/Modal` | A native `<dialog>` over the page. Not a hand-rolled overlay — the element already does focus, Escape and the backdrop. Centred, for the cards that answer "tell me about this thing I tapped". Its bottom anchor went with the foot row's drawer on 23 Sep 2026. |
| `shell/DialogFoot` | A dialog's way out: somewhere to go beside a way to stay. The squad card and the live card end with it — every player pop-up in the app is one of those two; the match screens' own card went on 23 Sep 2026 and they open the squad card now. In `shell/` because it is the frame's way out of any dialog. |
| `shell/DialogHead` | The bar a dialog about a SUBJECT opens with, in that subject's own colours — the squad card, the live card and the match card, three occurrences, and the FPL tab's pick card since 1 Oct 2026. It carries the name and nothing else (`cm9900/25.jpg`); what used to crowd in beside it goes on the line under. **Not `PageHeader`**, which draws a PAGE's bar and differs in eight attributes — height, alignment, case, padding, heading level, the `lg:` growth; what they share is `plateOn`, already extracted. `minHeight: 0` is inline because `desk.css` is unlayered and beats `@layer utilities`. |
| `shell/Changed` | A figure that has just moved, briefly marked. The live desk's only animation. |
| `shell/RoundHead` | The strip at the head of one round's block of matches — `Gameweek 7`, plus whatever that screen adds about it. Three copies, and the third had lost the gameweek: `prem/Rounds` and `league/results` wrote the plate byte for byte, while `league/schedule` wrote a fourth spelling that said DEADLINE and a date and never named the round (Craig, 7 Sep 2026: *"this doesnt actually show what gameweek it is"*). The gameweek is the component's, not a caller's string, so the one thing all three must say is the one thing a caller cannot get wrong. `text-ink` came off two of them on the way in — `.cm-bevel` sets its own colour unlayered, so the utility was dead, and what it named was a 2.27:1 failure. |
| `league/TableCells` | The other half: `IndexCell`, the ordinal in CM's index block (`24.jpg` runs `1st 2nd 3rd` down the left of every table it draws), and `ROW_LINK`, the class a board's name cell links with. Both arrived at three occurrences and not before. `INDEX_WIDTH` lived here until 7 Sep 2026 and is in `desk.ts` now: its second consumer is `shell/ScoreRow`, and a `shell/` component importing from `league/` inverts this file's own layering. **`PointsCell`** (the Pts column in an index block) and **`CutRow`** (a dashed rule naming what it separates: playoffs, Champions League, relegation, a cup group's knockout line) joined on 2 Oct 2026 at three sites each. |
| `league/TabEmpty` | The empty state INSIDE a shell: one muted line in a panel. Not `shell/Nothing`, which is a whole-page state and takes a provider code. |
| `league/GroupNav` | The stat groups under a board. Deliberately not `TabStrip`: it wraps, it is drawn shorter, and it lists groups rather than routes. |
| `league/ScoreFigure` | A score, at the one size and weight every board sets it. |
| `league/RoundWord` | "Gameweek 7" and its short forms, spelled once so four screens cannot disagree. |
| `league/Chips` | The little state chips on a player — captain, bench, the rest. |
| `league/Note` | A short note in the caution ink saying why something on screen is missing or degraded — a roster slot with no footballer behind it, a points table Fantrax refused. **`text-mid` on PROSE, and the only place in the app that does it**: DESIGN §3 gives amber to a figure standing alone beside a name, and the other twenty sites are figures or a position's three letters, counted 21 Sep 2026. A component rather than a `desk.ts` recipe on that file's own rule — appearance plus layout with no per-caller variation, at three sites — and because §4 forbids a PR adding lines to a file 302 over the ceiling. Two of the three had drifted: `PlayerCard` drew the box as `border border-line bg-raised`, the live card as a `cm-panel`. |
| `league/EmptySlot` | A roster slot with no footballer behind it: the dashed box, at the size a resolved player fills, so a hole in a row does not read as a formation nobody picked. Three sites drew it — the planner's sticker, the marker on the grass, the live card — byte-identical at two, and the third had hand-written `1.32`, which is `.pitch-figure`'s own fallback out of `pitch.css`. A `<span>`, because the live card's parent is one. |
| `league/PlayerIdentity` | What both player dialogs open with under the bar: the photograph, club · slot, the fixture as a crest + `v` + a difficulty-coloured opponent, and a kickoff time until he has played. The count is **2** and §1 leaves two alone — it does not apply, because the second card was about to be handed a hand-made copy of the first's thirty lines rather than two files having arrived at similar shapes. It draws the photograph and not a `PitchPlayer`: the sticker has a name plate, and a card with a title bar would print his name twice. |
| `league/ViewToggle` | Pitch or list, as one control, and the plates FILL their row (CM's own `Back` · `Next`). `BoardBar` sat above it until 5 Sep 2026 to fix which side the toggle went; by then both of its props had lost their last caller and one board had wrapped it in a second `justify-between` row to put a count beside it, which is the duplication it was written to prevent. Filling the row retires the question. |
| `league/SquadRows` · `league/SquadBoard` | A squad as rows, and the gated board around it. |
| `league/PositionTile` | Our league's position in the index block, as a table cell or a list tile. `SquadRows` and the club squad table. |
| `league/MatchupBoard` | The head-to-head: the scoreline, a five-plate strip, and one of five views. Only `Lineups` belongs to a side; the other four are the join of both squads and are drawn once at both widths. |
| `league/LineupPlanner` | Picking an XI. |
| `league/PlayerCard` · `league/LivePlayerCard` | One player, tapped open — settled and live. |
| `league/Breakdown` | The itemised table on the live card: one row per league scoring category that moved his total, then the total. **Three columns, not two** (Craig, 21 Sep 2026: *"points breakdown needs the value and the points"*) — the label, the count Fantrax states, the points it paid. "Minutes Played +2" is a price with the thing it priced left out. Split out of `LivePlayerCard` when that file crossed CODE_RULES §4's ceiling. The FPL tab's pick card (`fpl/PickPoints`) draws it too, over FPL's own scoring lines (1 Oct 2026). |
| `league/FplRecords` | The football half of the same card, as a native `<details>`. Closed it is the words "Full match stats" and a chevron, nothing else (Craig, 21 Sep 2026: *"Not fpl records, FULL MATCH STATS (ditch the number and labels)"*) — a summary that previews the panel under it is the panel twice. Open it is the whole FPL record: his minutes, what he did, bps, defensive contribution and the expected family. It is what the breakdown above it CANNOT say: that table holds this league's scoring categories, and nobody is paid for a measurement. |
| `football/StateBox` | The box beside a name saying why he is not playing. Silent for a fit player: a box reading "fit" on every row makes the one worth seeing harder to find. **It must survive a greyed row** — the whole point of it is to say why the row is grey. |
| `football/doubtRow` | The wash across a row for how likely its man is to miss, red, orange or yellow, beside `StateBox`'s word; `doubtWash` for a row that holds a band, not a footballer (Mail). The Team page's rows, the club squad list and stats board, set pieces, the depth chart and the pool board. |
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

**The chevron in a `<summary>`** — `list-none`,
`[&::-webkit-details-marker]:hidden`, and an inline SVG taking
`group-open:rotate-180` — is TWO, counted 21 Sep 2026: `football/MatchList`
and `league/FplRecords`. Left duplicated under §1, and the count is here so
the third does not have to re-derive it.

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
nothing smaller to say instead, because FPL's `squad_number` is null on every
element (667 of 667, counted 23 Sep 2026), so the ellipsis is where the rule ends.

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
the quiet page pay for the busy one. Row padding is `FAR_INSET`, exported by
`PitchRows`, and the bench strip pads itself by the same number so a reserve
stands under the man he would replace. It outlived `PitchTurf`, whose taper it
was, on 21 Sep 2026.

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
- `--page-foot` — the room `<main>` leaves under the page: `3.5rem + 1rem` below `lg`, the thumb
  rail's tab plus the air under the last panel, and 2rem above it where there is no bar. The
  safe-area inset is the rail's own, inside the fixed element, and `body` pads by it too. The front page runs its stock out through it;
  without that, a cream page ends in a band of desk navy.
- `--page-top` — the air above the page's first object, 0.5rem. A token because
  two things must agree: `<main>` sets it, and `prem/match/[id]/Shell` subtracts
  it (with `--page-foot`) to know how tall a full-viewport match is, so its foot
  row lands at the foot of a short one.

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
| `SMALL_CAPS` | The small-caps geometry with no ink, for the caller that needs a different one. | `LABEL`'s other half, and 21 more sites that had typed it out (27 Sep 2026) |
| `MINOR_CAPS` | `SMALL_CAPS` a step down (`3xs`): a tag or a key beside something larger. | 14 sites across 10 files (27 Sep 2026); the paper's own letterspaced caps are a different recipe and stay |
| `LABEL` | `SMALL_CAPS` in the ink furniture is set in. Callers keep their own layout and font. **Appending a colour does not work** — two colour utilities are resolved by stylesheet order, so `${LABEL} text-bad` renders faint; compose from `SMALL_CAPS`. | 26 sites, 22 files |
| `MINOR_LABEL` | `MINOR_CAPS` in furniture ink: `LABEL` a step down. | 7 sites in 6 files (30 Sep 2026) |
| `ROW_FIGURE` | **How big a figure in a row is** — `sm`, at both widths (Craig, 10 Sep 2026: *"The numbers in the rows for each column are still too small on desktop"*, then *"numbers in rows are good on desktop, still small/hard to read to mobile"* an hour later, which took the `lg:` half off the pair). **Still**: `tokens.css` had already taken the three smallest STEPS up a pixel on 5 Sep, which left the RATIO where it was — `.cm-index` and `ROW_NAME` both set a desk row's placing and name at `base`, so a row read 16 · 16 · **12**, and the twelve was the part a standings table is for. A step of its own rather than another pixel on `--text-2xs`, which is 141 sites and mostly labels. | the size half of `FIGURE_CELL`, `FIGURE` and both form guides |
| `FIGURE_CELL` | **The figure cell on every table and board**: tabular, centred under a centred head, at `ROW_FIGURE`, weight the caller's. `FIGURE` is this, bold. A name is the one thing left-aligned. | 12 files (2 Oct 2026), `BOARD_FIGURE`'s eight joining the form columns and the two match-side boards |
| `FIGURE` | A figure in a repeating row: tabular, **centred**, bold, at `ROW_FIGURE`. **One size, and the decision was Craig's** (7 Sep 2026: *"make sure its not declared in different places"*) — the two boards that carried their own are folded in. A board that wants a bigger figure now asks for it as an addition anybody can grep for. | 3 identical private `const FIGURE`, plus `SquadTable`'s `WIDE_FIGURE = ${FIGURE} lg:text-sm`, `league/team-stats`' private `const FIGURE` at `text-base lg:text-lg` — the same NAME in another file at three times the size — and `prem/team-stats` inline at `text-sm` |
| ~~`BOARD_FIGURE`~~ | **Gone, 2 Oct 2026** (Craig: *"columns (repo wide, centre align)"*). It flushed a stat board's figures right under right-flushed heads while the standings tables centred theirs, so boards of one kind disagreed: player stat boards, team stats and leader lists each came in both. Its eight boards wear `FIGURE_CELL`, and their heads are centred. | 8 files |
| `INDEX_WIDTH` | How wide CM's index block is — 32px under a thumb, 36 on the desk — so a column of them is one shape rather than six (Craig, 5 Sep 2026: *"blue tab needs to be same size as the rest"*). A **relocation, not an extraction at two**: it was already named, already exported for `shell/ScoreRow`, and had no consumer outside its own file while `ScoreRow` wrote `w-8 lg:w-9` out by hand. | moved from `league/TableCells`, 7 Sep 2026 |
| `QUIET_FIGURE` | `numeric text-2xs text-faint` — a figure the reader scans PAST. **Nine sites in five files**, counted 4 Sep 2026; `desk.ts` had listed it under "Declined" at four files and left it for the next pass, and this was that pass. |
| core `fixed` · `PLACES` | **How many places a figure prints, by its KIND and never by its value** (2 Oct 2026; `/players` printed FP/G as `4`, `3.75` and `3.8` in one column): points per game, xG/xA/xGC and per-90 rates to two, a rating and a projection to one, a count whole with a thousands comma. A column carries its `kind` (`FigureKind`) the way it carries its head. | 20 sites in 17 files, replacing 16 `toFixed` and two private `printed`s |
| ~~`SLOT_FIGURE`~~ | **Gone, 10 Sep 2026, because it had no caller.** Its one site — `prem/club/[code]/SquadTable`'s shirt-number column — moved into a `.cm-index` block on 5 Sep at Craig's asking, and the export outlived it. Found while giving every row figure a desk step: it was about to take one, for nobody. |
| `TONE` | Which way a form result leans. `W`/`D`/`L` as DESIGN §3's direction pair. | 2 byte-identical |
| `gainOrLoss()` | What a fantasy figure did to a score, as DESIGN §3's direction pair: green paid, red docked, nought left to the caller (`|| "text-muted"` where a quiet nought is wanted). | 3 sites (1 Oct 2026): the player card's `Breakdown`, and the head-to-head's side boards and fantasy report |
| `TEXT` | Where a column's text sits: `left` for a name, `center` for a figure; `right` went with `BOARD_FIGURE`. `TableHeads.JUSTIFY` is the flex twin. | 2 byte-identical |
| `BOARD` | A table that fills its panel and rules its own rows. | 9 files |
| `ROW_NAME` | **A name in a repeating row** — a club, a manager, a footballer: the chrome face, `sm`/`lg:base`, bold. No `truncate` and no `min-w-0`, because whether a name may be cut depends on what is beside it. **Not** a `.cm-title` bar, a dialog heading, or `matchday/desk/Rows`' "ARS v CHE", which is a fixture line rather than a name. | 7 ways in 2 faces and 4 sizes (5 Sep 2026); 3 sites still outside it earlier on 7 Sep, and **12 more found the same day** when Craig checked a second screen (*"i still see different font sizes in the app, such as /league/team-stats"*) — both team-stats boards, three match screens, `league/matchups`, `league/schedule` (both branches of one opponent), `football/MatchList`'s scorer, the transfer ledger, `prem/club` set-pieces and its fixture run. **Three more on 10 Sep** — the row-name cells of the three dense stat GRIDS, which the earlier sweeps had walked past because none of them writes a name into a `<span>`: `squad/[teamId]/stats/StatBoard` inherited `text-2xs` from its `<td>`, `league/SeasonGrid` set it there, and `prem/club/[code]/stats/PlayerBoard` had the size and the weight but not the face. Measured rather than assumed: the row height does not move at either width, because `.cm-index` beside them already sets `text-sm`/`lg:text-base` and was already the tallest thing in the row |
| `ROW_RULE` | The rule between two rows of a TABLE. `border-bg`, the darker step, so a table reads as grooved rather than as fifteen boxes. **`.cm-rows` rules a LIST with the same colour since 7 Sep 2026** — it was `--color-line`, so the schedule's ties and the table's teams were separated by two different marks, and the reference rules its rows with nothing at all (`cm9900/24.jpg`, `cm0102/07.jpg`): what gives a CM list its rhythm is the gap between the index blocks down its left. | 14 files |
| `SCROLL` | What a board is wrapped in so a phone can reach its far columns. | 14 sites |
| `TAB` | One plate of a tab strip: the blue plate, filling its share of the row, label centred in the chrome face. Size and padding stay the caller's — `TabStrip` takes its own from a prop, `GroupNav` keeps a 44px floor that relaxes to 36. | 5 spellings, and one had already diverged: the wire picker was written with no `lg:text-sm`, so it sat at 9px on a desk where every other strip steps to 14 |
| `HEAD_PLATE` · `HEAD_PLATE_CENTRE` | A 24px caption plate, left or centred: `GROUP_PLATE` over a group of columns, `BLOCK_PLATE` over a block, the player card's breakdown strip. **No longer a column head** (2 Oct 2026): every table's heads are `TableHeads.PLATE`'s 28px, `PlateHead` included, and `_END` went with `BOARD_FIGURE`. | 12 sites, 3 files |
| `phoneShows(picked)` | A block a phone shows only while it is the view picked, a desk showing every one — the match screens' club and view switches (`?side=`, `?view=`). Compare stopped using it on 24 Sep 2026: one view at every width. | 5 sites, 4 files |
| `SECTION_BAR` | CM's blue title row across a panel, naming the section under it — the Overview's `Match Report`, and Action Zones' `Shots` and `Average Position`. A phone drops it with `max-lg:hidden` where a control row above already names the section in view. Set in the chrome face (`font-chrome`) since 24 Sep 2026; it had inherited the text face. | 6 sites, 5 files |
| `PANEL` | The default panel: a CM well holding a column of things. A caller with a reason keeps its own spacing and states it; a caller without one takes this. | 6 sites agreed already, 4 strays joined |
| `PANEL_FLUSH` | The same well with no spacing of its own, for a panel whose single child manages it — a board, a ledger, a grid. A different decision from `PANEL`, not `PANEL` minus two utilities. | 6 sites |
| `HEADING_PLATE` | A heading between two panels, on a plate of its own: DESIGN §2's "nothing prints on the bare ground". | 3 sites: both Bench headings and `/squad`'s "Around the league" (23 Sep 2026) |
| `HEAD_CELL` | The `<th>` a stats board's head plate sits in: no padding, because the plate carries it. | 3 boards — the same three that share `HEAD_PLATE` |
| `FACT_LABEL` | The label half of a fact row — takes the room the figure does not, and truncates rather than wrapping. The truncation is the part worth naming: a Fantrax label is a full sentence on some rows, and a row that wraps to three lines stops being a row. | 1 file, `league/Breakdown` (26 Sep 2026) |
| `SUBMIT` | The button that submits a form it sits inside. | 3 sites |
| `ROW_HOVER` | `ROW_RULE` plus the surface under a pointer: a board row nobody owns. | 5 Prem boards (23 Sep 2026) |
| `ROW_HOVER_ON_SURFACE` | `ROW_HOVER` on a board that already sits on the surface, so the hover steps up to raised. | 3 boards: Players, Projections, a player's match log (2 Oct 2026) |
| `PINNED_TILE` · `PINNED_NAME` | A board's frozen tile (or index block) and its frozen name column; the caller adds where the name starts. `bg-surface` is load-bearing: a transparent one lets the scrolled figures slide under the name. Were `STICKY_LEAD` plus four hand-written copies until 24 Sep 2026. | 6 files |
| `PINNED_BESIDE_TILE` | `PINNED_NAME` starting where a pinned position tile ends, at `TILE_WIDTH`'s offsets. | 5 sites in 4 boards (30 Sep 2026) |
| `PINNED_BESIDE_INDEX` | `PINNED_NAME` starting where a pinned index block ends, at `INDEX_WIDTH`'s offsets. | 3 sites in 2 boards: a player's match log, Teams (2 Oct 2026) |
| `league/ScrollBoard` | A board that scrolls sideways, with drawn cues under a thumb: a fade while there is more, a gauge docked above the rail, a shadow on the pinned lead once scrolled (`.cm-board`, `desk.css`). A pinned board passes `bg-surface`. | 23 boards (27 Sep 2026) |
| `TableHeads` `LeadHeads` · `sortedAs` · `SortArrow` | A pinned lead's two bare heads; a `SortHead`'s direction from "is this the column" and "descending"; the ▲/▼ beside a head. | 6 · 9 · 1 sites (30 Sep 2026; the club stats board joined) |
| `gazette/StoryFace` · `hasPicture` | A story's own picture: its man, else its columnist's photograph, in `.paper-frame`. | 3 sites at 2 ranks (splash; a shoulder's and a brief's card) |
| `GAMEWEEK_HEAD` · `GAMEWEEK_TITLE` | A gameweek view's header row and title, shared with its loading skeleton so the page does not jump when it lands. | 5 files |
| `DESK_ONLY` · `standDown()` | A column shown on the desk only; `standDown` keeps it when the table is sorted by it, or the sort arrow and `aria-sort` would hide with it. | 4 files |
| `players/BoardRow` | The Data boards' shared row: `LeadFace` (crest, name, `after` slot, position under it on a phone), `PIN_TILE` · `PIN_NAME`, `LEAD_WIDTH`, `FIGURE`. Taken at two because Craig asked for it (24 Sep 2026: *"make sure we are using shared code"*) and the two boards must agree. | 2 boards (Players, Projections) |
| `league/BoardKey` | What a board's column heads stand for, shut under the board on a phone: a head's `title` is hover-only. | 3 boards: Data, Projections, Teams (27 Sep 2026) |
| `league/standout` `SIDE_SHARES` | A side-sized board's lit shares: a fifth in yellow, a tenth in orange. The pool and the match log keep their own. | 4 boards: match, Team Stats, club stats, Teams (30 Sep 2026) |
| `shell/QuerySelect` · `clubOptions` | One URL parameter from a list: a GET form that navigates on change, shows the pick while the page loads, and asks `LeaveGuard` first. Every GET select in the app: Data's, `/prem/data`'s list, Prem Team Stats' category (was `team-stats/Filters`) and the squad's gameweek (was `GameweekPicker`). `select.cm-bevel` in `desk.css` draws the plate and its ▼ in both engines: WebKit drew the platform's box at 25–33px. | 8 selects in 6 files (2 Oct 2026) |

**`.cm-index` owns its text outright** — size, weight and shadow, in `desk.css`,
the way `.cm-bevel` owns its ink and its face. The twenty sites that draw a blue
index block wrote that text **four sizes and three weights** between them
(`text-3xs`, `text-2xs`, `text-sm`, one stepping `3xs`→`2xs`; seventeen
`font-bold`, one with no weight, one at `opacity-60`), counted 7 Sep 2026. All
twenty now set layout and nothing else. A `PLACING` recipe held the size here for
an hour and was overruled the same hour (Craig: *"i think we can have the same
for now and il find the correct exceptions"*): one size everywhere is the honest
default, and **an exception is now an addition** — a `text-3xs` after the class,
which is a thing you can grep for — rather than twenty sites that never agreed
and cannot be told from deliberate ones. The 800 weight cost a font file
(`layout.tsx`) and is the only thing on the desk heavier than 700.

One CSS class was split in the same run: **`.cm-scroll` draws CM's bevelled bar
in either axis, and `.cm-scroll-y` adds the reserved gutter**, because
`scrollbar-gutter` reserves the inline-end one and two boards that scroll only
sideways were paying 16px for a bar that could never appear.

*`SCORE_CREST` and `SCORE_CREST_PX` were rows in this table until 7 Sep 2026 and
had not existed in `desk.ts` since 5 Sep, when the recipe fell to a single caller
and the number moved back into `prem/club/[code]/Run.tsx` beside the `next/image`
call that uses it. CODE_RULES §4 asks for the row in the same commit as the
recipe; it asks the same on the way out.*

### Declined, with the count

Counted at the dates shown, so the next session re-counts rather than re-argues.
A recipe is named at its third occurrence (CODE_RULES §1); these were not.

| What | Count | Where it goes at the third |
|---|---|---|
| `px-3 text-2xs text-faint` | 5 sites (7 Sep) | Left: not sediment from the run that counted it. |
| `Array.isArray(v) ? v[v.length - 1] : v` | 2 (`players/query`, `players/analysis/page`) | A shared query helper. |
| Tab label `px-2 text-2xs` | 1 (`league/GroupNav`, since 6 Sep) | Below the bar. |
| `MONTHS` · `SETTLE = 250` · `FORM_GAMES = 5` | 2 each (11 Sep) | Left. |
| The gazette's story furniture (kicker, headline, standfirst, rule) | 3-4 files each | A `paper.ts`: it belongs to the paper, not the desk. |
| Crest `<Image>` outside a row | 14, in 11 sizes and 9 class strings (23 Sep) | Left: a wrapper would rename props. Rows use `ClubLabel`. |
| Pitch markings | 2 identical (`ShotMap`, `AveragePosition`); `PlayerMap` draws its own (23 Sep) | A shared markings group, at a third map that draws these. |
| `?gw=` on a route builder | 2 (`matchupHref`, `teamHref`) | A `withRound` helper. |
| `${ROW_RULE} ${mine ? "bg-raised" : "hover:bg-surface"}` | 2 (`league/TableRow`, league team-stats) | `desk.ts`, beside `ROW_HOVER`. |
| Panel sized in rows by hand | 2 (`SectionShell`, the club's fixtures tab) | A `Panel` taking `rows`. |
| `raw instanceof FantraxError ? fallback : map(raw)` | 15 read modules, each with its own fallback (23 Sep) | Left: a helper would rename a one-line ternary. |
| The refusal pair (`shell/Nothing`, `error`, `not-found`) | 3 written out; `global-error` draws `Nothing` (1 Oct) | `error` and `not-found` should use `Nothing` too. |
| `border-collapse w-full whitespace-nowrap` | 3 | Reconcile with `BOARD` rather than name it. |

DESIGN §6's density table is the other half of this — it says how tall each of
these is and what size it is set in, and every row of it names the recipe here
that implements it.

## Four mechanics worth knowing before you touch them

**A pitch draws KITS. A page about one man draws his face.** That is the split as
of 10 Sep 2026 (Craig: *"portraits dont work — lets go back to classic shirts for
the pitch view that all sites work"*), and it is worth saying why, because the
photographs did not stop working.

Counted the same day across 60 random players: the Premier League's `110x140` set
answers for **51** and `500x500` for **49**. What the ladder below cannot do is
AGREE. It falls photograph → ours → kit → initials, so a line of eleven reliably
holds nine faces, a shirt and a set of letters — three kinds of object standing in
one row, which is what reads as broken. One man in seven is enough to spoil every
pitch in the app and not nearly enough to notice on a profile page.

**Two exceptions draw faces: a club's predicted XI** (Craig, 26 Sep 2026: *"pitch
view uses real players, every other pitch view uses shirts"*) **and the match
line-up** (Craig, 1 Oct 2026: *"this pitch view, use portraits"*). Each half is one
club, so a man with no photograph falls back to that club's kit and nothing else.
The match pitch drew faces from 23 Sep, kits from 26 Sep, and faces again from 1 Oct;
the squad pitches drew faces from 24 Sep and are kits again.

**The keeper stands at the top, so the team faces the reader** (Craig, 10 Sep 2026). On
the two pitches that know their flanks, a club's predicted XI and its depth chart, the
right-back stands on the reader's LEFT; both drew it mirrored until 26 Sep 2026.

**`PlayerShirt` is what a pitch draws, and it has no ladder.** A kit is chosen by
club code, answers **40/40** (`shirtUrl` carries the count), and is right the day
a man signs. The only absence it can meet is a club we cannot name, which it
answers before asking for an image at all — so no `useState`, no `onError`, no
`"use client"`. Keeper kits are the `_1` variant and a genuinely different shirt.

- **The card and the kit are ONE rectangle.** `.pitch-figure` carries an
  aspect-ratio *and* a max-height and the two disagree on a short viewport, so an
  inner box takes the card's height and derives its width. Bound the other way
  round (`max-h-full max-w-full`) the crop quietly became a letterbox instead.
- **The hem is cropped, and the crop is one constant.** The jersey inside the
  file measures 0.680 wide-to-tall where other sites draw about 0.88 — ours is a
  photograph and theirs is an illustration, so it reads long. `KEPT` is the
  fraction drawn and `CARD = JERSEY / KEPT` is the shape that follows; both the
  token `.pitch-figure` reads and the inner box round the jersey take that one
  computed number. At `KEPT = 0.7` the card is very nearly square. It crops the
  FOOT, because the collar, crest and sponsor are the top two thirds and the hem
  identifies nobody.
- **No shirt number, anywhere on a pitch** (Craig, 10 Sep 2026). One rode on the
  chest for an afternoon, on the reading that eleven identical kits need one. The
  name plate at full card width does the same job, and the number is still in the
  blue index block on every board that lists these men — which is where
  Championship Manager keeps it.
- **The card is a WASH, not a plate.** 45% of the desk's blue-black, with no
  border and no padding of its own: those cost 6px of a 58px phone card on top of
  the bevel's 4, and the wash already separates the card from the field. The
  plates run to the card's edge and the SHIRT is the thing inset — a kit reads at
  any width and a truncated name does not.
- **The number, on the two pitches that have one.** Centred just below the
  sponsor — the only patch of a Premier League kit nobody else has bought — in
  `inkOn(colours)` with a contrast ring under it. The ring is load-bearing:
  `clubColours` describes the OUTFIELD shirt, so Arsenal's `#EF0107` returns white
  and Arsenal's keeper top is white.

**`PlayerImage` keeps the four-rung ladder for the four callers that are about one
man**: the player profile, the paper's face and picture, and the live card. It is
a client component and has to be — a transparent PNG cannot be layered over a
fallback and left to cover it, so a fallback can only appear once an image has
actually failed, and only the browser knows that.

Four rungs: **this season's photograph → one of ours → the club's kit →
initials.**

- **Ours** live in `apps/companion/public/portraits/{code}.png`, keyed on the FPL
  season-stable player code, dropped in by hand. A missing one costs a local 404.
  **Not `public/players/`** — that path is the player-profile route, so a miss
  there resolves to a page rather than a 404 and asks Fantrax about an id that is
  not a player.
- The set *before* the current one still answers and is deliberately never used:
  it would put those players back in the shirts they wore two clubs ago, and a
  wrong photograph is worse than none because only one of the two looks like an
  answer.

The case that still slips through is a photograph taken *within* the current set
and overtaken by a January transfer — undetectable from the asset, and nothing
marks it. A file in `public/portraits/` overrides it. **A kit never has this
problem**, which is the second reason a pitch does not want a photograph.

**The points band, and the one rule under it: a card says one thing at a time.**
The third band of a player on the grass is his fixture until he kicks off and his
score after it, and the two never share the space. Played, it flips to a dark
ground with cream numerals so the figure a manager came for is the loudest thing
on the card; waiting, it is the FDR colour at full strength. Both are the same
fixed height — a line whose cards stand at different heights stops reading as a
line — and "he has not played" is said by dimming the **kit** alone. Dimming the
whole card said it too, and took the fixture colour and the name with it.

**Two player cards, and they are not one card with a flag.** `PlayerCard` answers
*who is this and is he fit* — read midweek, going through somebody's fifteen: the
fixture, the kickoff, FPL's fitness note, why a slot is unresolved.
`LivePlayerCard` answers *what is he scoring and why* — read at ten past four:
Fantrax's own category breakdown, summing to the total exactly, with FPL's record
on a line of its own and labelled as FPL's. Same dialog skeleton, different
questions, opened on different days. A third card is a sign one of these two has
lost its question.

**No pitch is drawn in perspective since 21 Sep 2026.** Every one stands on
`CmGround`'s flat diagram; `PitchTurf`, which drew the trapezoid, is gone. The
rule it kept still holds for any ground that returns: an angle goes in the ground,
never in a CSS transform, which would tilt the cards with it.

## Motion and access

150–250ms, ease-out only; users are in flow. The live dot is the one place
motion carries meaning, and it is always paired with the word LIVE so it never
relies on colour or movement alone. `prefers-reduced-motion` has a real
alternative for every animation. One focus treatment everywhere, never removed.

## Times

Every time in the app is UK time wherever the reader is (core's `time.ts`), and
"15:00" has to mean the same thing in Toronto as in Leeds. Fantrax's own
timestamps are US Eastern; they are read with their date's offset and printed in
London like the rest (`core/inbox/when`), with no zone named anywhere (Craig,
2 Oct 2026: *"Times need to be local time"*).
