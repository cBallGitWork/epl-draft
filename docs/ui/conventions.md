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

Four faces, four roles. Archivo carries the desk's UI; **Archivo Narrow
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
| `shell/Rail` | The app's sections as CM's RAIL: a 130px outlined column down the side above `lg`. It decides the section list once from the round and hands it to `shell/FootRow` for the phone — not one shape at two widths — a rail runs out of height and a foot row runs out of width per plate, and `navfit.mjs` asks each its own question. Stands down on `/`. The Live section only exists while football is on, and its plate carries your score under its label (`shell/LiveCount`). Carries CM's back and forward **steppers** above the rail plates (`cm9900/24.jpg`) — desk only, because a phone has the browser's own gesture and the foot row has no room for two more. They are ink rather than the accent: an arrow is not "yours, selected or active". Forward is never greyed, since only the Navigation API could say whether there is anywhere forward and a control greyed by a guess is worse than one that is simply live. |
| `shell/FootRow` | The same sections as CM's FOOT ROW: a flat filled `.cm-foot` strip across the bottom below `lg`. Its own file because it is its own object (DESIGN §2) — a rail runs out of HEIGHT and a foot row runs out of WIDTH per plate, and `navfit.mjs` asks each its own question. **Six plates, and the sixth is a door**: the bar's ceiling is measured (six at 320 are 53.3px each and keep 4px around the label, so a label has 49.3; the widest is `Gazetta` at 44) so everything past the fifth section lives behind `More`, a full-width drawer on the floor. Quote the label's room and never the plate's width — the difference is what clipped `My Team` at 51. A section may also yield its plate for the round: My Team does, while Live exists, and its plate reads `Team`. The door takes `aria-current` when you are inside a section behind it, and is absent when nothing is. The Live plate carries your score under its label (`shell/LiveCount`). |
| `shell/sections` | The sections as data, which one a path is in, and which of them this round puts on the bar (`sectionsFor`). The rail prints it, on the paper as well as the desk. |
| `shell/LeagueCrest` | Our crest. `mark` (no type, legible to ~24px) and `full`. |
| `shell/AutoRefresh` | The app's **single** client poller, mounted by the layout. `POLL.live` during football, `POLL.idle` otherwise, waking at kickoff: it counts down the layout's `liveIn` (`cadence.ts`). Eight pages each mounted their own until 29 Aug, sized from whatever snapshot each happened to hold — so a page with no football read of its own simply froze. |
| `core/inbox/when` | When an inbox item happened, and WHICH KIND of "when". Two sources date themselves differently — Fantrax's offsetless `"Wed Sep 2, 2026, 6:11AM"` and our ISO deadline — and one untagged string carrying both sorted the 12 Sep deadline under 2 Sep deals and drew a US stamp beside a British date. `fantraxDay`/`fantraxMoment` RE-SPELL their parts (`Sep 2` → `2 Sept`, and the zone named: `6:11 AM ET`); nothing converts them, because a converted transaction can move a day. `whenKey` puts both into Fantrax's own calendar for ordering only. |
| `shell/liveTie` | Whether there is a live tie of the reader's, as one question with six guards. The layout starts it ONCE, un-awaited, and hands the promise to both wearers — so the desk's strip and the phone's plate are one Fantrax read, and neither blocks the shell. |
| `shell/LiveNow` · `shell/LiveStrip` | Your tie in the chrome while a ball is in the air, **on the desk**. Stands down on `/` and `/matchday`, which print the same tie larger, and below `lg` everywhere — 44px across the top of a phone for a number the foot row can carry in room it already has. |
| `shell/LiveCount` | The same tie as a figure under the Live plate's label, below `lg`. CM's own idiom — its fitness tab reads `Fitness (40)`. No trailing dim: the strip is a scoreline comparing two sides, this is a count. |
| `shell/Skeleton` | The loading block. Paints `currentColor` at low alpha, so it self-skins in whichever register it lands in — one primitive, no variants. |
| `shell/SkeletonRows` | The app's standard card stack at a given height, for a `loading.tsx` that has to draw its route's real frame rather than a spinner. |
| `league/TableHeads` | Championship Manager's bevelled head strip, and the only place its mechanics live: the row, the cell, the plate, the bare name cell that starts it, `SortHead` — the plate as a LINK, drawn pressed when the table is ordered by it — and `MUTE`, the class a head takes when its column names itself. Three tables sort through it (`/league`, `/prem`, Team Stats); the column LISTS stay with their tables, because different columns mean genuinely different widths. |
| `league/PitchFrame` | Hoardings + goal + turf. Full-bleed. |
| `league/PitchRows` | Players in their lines, on whichever ground `flat` picks — `CmGround`'s diagram or `PitchFrame`'s trapezoid. **Owns card width, the name's size, and the shrink-not-wrap policy** — all FIVE go through it — both squad views, the head-to-head, `/fpl` and `/prem/club/[code]`'s predicted eleven, which is the only one about a real club. What it does NOT own is the pitch's width against the fold: `.pitch`'s ratio turns any width into a height, so a pitch with no second column beside it caps its own — `fpl/FplPitch` and `league/LineupPitch`, two occurrences, copied rather than named. |
| `league/PitchTurf` | The grass in perspective, as an inline SVG. |
| `league/LineupPitch` | Your own XI plus the bench, one target per player: tap to pick, tap again for the rest. Draws `SquadMarker`, same as the head-to-head — it had a sticker of its own until 21 Sep 2026. |
| `league/SquadMarker` | A fantasy roster slot as a `PitchMarker`: the league layer's vocabulary translated into football's, in one place. **Three sites** — the planner's pitch, and the head-to-head's grass and bench. The BUTTON round it stays with each caller, because they disagree about what a tap does. |
| `league/BenchStrip` | The reserves under the grass, numbered from the left and on the pitch's own inset and row budget. Two callers, extracted because the next change was going to be made twice — and because the two had already drifted once over card width (see `PitchRows`). |
| `league/MoveDialog` | Everywhere one player can go, over the pitch. |
| `league/TeamSheet` | A live XI plus bench, or the same squad as rows, every player opening `LivePlayerCard`. Both boards that show a lineup that counts draw it. |
| `league/Pending` | Points Fantrax has not credited yet — a clean sheet is settled at the final whistle and FPL has been paying it since the hour mark. Four screens print it; before this they were four spellings of one rule, two of which could reach a `+0`. |
| `league/SeasonGrid` | Championship Manager's attribute grid — the squad's season as one bevelled panel per scoring group, thirteen keeper columns and eleven outfield, every figure Fantrax's own. The **second panel** on `/squad/[teamId]`, and it costs one cache hit: `squadSeason` already reads this table to price the board. |
| `league/PlayerImage` | The cut-out photograph, with its fallback ladder. Client-only, and has to be — see below. **Four callers, none of them a pitch**: the player profile, the paper's face and picture, and the live card. |
| `league/PlayerShirt` | The club's kit, and the only place it is drawn. What every pitch draws now. Server component — it has no ladder to walk. |
| `league/PitchMarker` · `league/CmGround` | A marker on the grass, and the ground it stands on. The marker is a kit on a translucent wash, the name on Championship Manager's bevelled plate, and under it the fixture or the score on the desk's navy. Was `PitchDisc`, a cut-out head in a coloured circle, until 10 Sep 2026; the band carried the opponent's club colour from 10 to 21 Sep, and gave it up when the card gained two other things to say in colour — how likely he is to MISS on the plate, and the whole card red when he is out. |
| `football/fdr` | FPL's five difficulty steps, each with the ink that survives it. **Not a component** — `FixtureChip` drew one and lost its last caller on 21 Sep 2026 when the planner's band went to `PitchMarker`'s opponent colour, so the file is named for the scale that outlived it. Two consumers: the profile's fixture run and the player dialog's fixture line. |
| `football/PlayerPortrait` | 32px headshot on club colour, for list rows. |
| `shell/TabStrip` | The blue tab strip under a title bar. Five strips use it — the League section, the Premiership section, a fantasy team's five views, a club's four, a player's five. (It read "three" until 4 Sep 2026 and had been undercounting `PremNav` since 2 Sep.) `dim` greys a tab that has nothing behind it for THIS subject and keeps it in place, which is CM's answer for an empty view (`cm0102/07.jpg`). |
| `shell/Caption` | The yellow centred caption inside a panel. The bar above names the subject; this names the view. Not on a plated subject's screens (`PlateShell`), where it only repeated the lit tab. |
| `shell/Section` | A headed block with a rule under it, **on a plate**. The plate is the section's and not each caller's (Craig, 4 Sep 2026: "use the transparent ish panels in other pages and make sure that's now a universal shared property") — four callers had begun wrapping their own children in `PANEL` and the heading was outside it every time, so every headed block in the app printed its title and its provenance onto the photograph. Invisible until `groundfit.mjs` was repaired the same day. It also makes the desk more like the reference: `desk.css` already says a CM screen is "several bevelled PANELS, each opening with its own title bar". |
| `shell/PlateShell` | The frame a screen about a SUBJECT wears: his colour on the bar, his tabs, no caption, and `--cm-index` re-pointed so every table inside is drawn in his colours. Extracted at the third plated subject — a fantasy team, a club, a player — which is where `prem/club/[code]/Shell` said in writing it would be. The tab strip is passed as a NODE, not as a list and a base href: a config object would make it a nav framework three callers configure, and each caller's tab file is where its own docblock lives. |
| `shell/OutLink` | A link that LEAVES the app: a plain anchor, `target="_blank"` and `rel="noopener noreferrer"`, on `ButtonLink`'s plate unless a caller passes its own. **The ↗ is the component's, not the caller's** — every one of the five sites typed `&nearr;` after its own label and React serves that as `&amp;nearr;`, so three shipped screens printed the entity as text. One arrow in one place. Five sites, counted 7 Sep 2026. |
| `shell/Modal` | A native `<dialog>` over the page. Not a hand-rolled overlay — the element already does focus, Escape and the backdrop. Two positions: `centre` for the three cards that answer "tell me about this thing I tapped", and `bottom` for a full-width drawer opened by a thumb from the foot row. The bottom one needs `max-w-none`, because the user agent caps a dialog at `calc(100% - 6px - 2em)`. |
| `shell/DialogFoot` | A dialog's way out: somewhere to go beside a way to stay. Three dialogs ended with it — the squad card, the live card, the match card — and the Close button was byte-identical at all three. In `shell/` because it crosses the registers: two callers are the desk's, the third a Premier League match. `href` is nullable, for a match card holding a man FPL never gave a code. `MatchPlayerCard`'s `text-center` went rather than becoming a prop — `BUTTON` already centres. |
| `shell/DialogHead` | The bar a dialog about a SUBJECT opens with, in that subject's own colours — the squad card, the live card and the match card, three occurrences. It carries the name and nothing else (`cm9900/25.jpg`); what used to crowd in beside it goes on the line under. **Not `PageHeader`**, which draws a PAGE's bar and differs in eight attributes — height, alignment, case, padding, heading level, the `lg:` growth; what they share is `plateOn`, already extracted. `minHeight: 0` is inline because `desk.css` is unlayered and beats `@layer utilities`. |
| `shell/Changed` | A figure that has just moved, briefly marked. The live desk's only animation. |
| `shell/RoundHead` | The strip at the head of one round's block of matches — `Gameweek 7`, plus whatever that screen adds about it. Three copies, and the third had lost the gameweek: `prem/Rounds` and `league/results` wrote the plate byte for byte, while `league/schedule` wrote a fourth spelling that said DEADLINE and a date and never named the round (Craig, 7 Sep 2026: *"this doesnt actually show what gameweek it is"*). The gameweek is the component's, not a caller's string, so the one thing all three must say is the one thing a caller cannot get wrong. `text-ink` came off two of them on the way in — `.cm-bevel` sets its own colour unlayered, so the utility was dead, and what it named was a 2.27:1 failure. |
| `league/TableCells` | The other half: `IndexCell`, the ordinal in CM's index block (`24.jpg` runs `1st 2nd 3rd` down the left of every table it draws), and `ROW_LINK`, the class a board's name cell links with. Both arrived at three occurrences and not before. `INDEX_WIDTH` lived here until 7 Sep 2026 and is in `desk.ts` now: its second consumer is `shell/ScoreRow`, and a `shell/` component importing from `league/` inverts this file's own layering. |
| `league/TeamBadge` | A fantasy manager's own badge, with its initial and its dashed placeholder. The club-side equivalent is deliberately NOT extracted — see the note under this table. |
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
| `league/LineupPlanner` · `league/MoveSheet` | Picking an XI, and everywhere one player can go. |
| `league/PlayerCard` · `league/LivePlayerCard` | One player, tapped open — settled and live. |
| `league/Breakdown` | The itemised table on the live card: one row per league scoring category that moved his total, then the total. **Three columns, not two** (Craig, 21 Sep 2026: *"points breakdown needs the value and the points"*) — the label, the count Fantrax states, the points it paid. "Minutes Played +2" is a price with the thing it priced left out. Split out of `LivePlayerCard` when that file crossed CODE_RULES §4's ceiling. |
| `league/FplRecords` | The football half of the same card, as a native `<details>`. Closed it is the words "Full match stats" and a chevron, nothing else (Craig, 21 Sep 2026: *"Not fpl records, FULL MATCH STATS (ditch the number and labels)"*) — a summary that previews the panel under it is the panel twice. Open it is the whole FPL record: his minutes, what he did, bps, defensive contribution and the expected family. It is what the breakdown above it CANNOT say: that table holds this league's scoring categories, and nobody is paid for a measurement. |
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
- `--page-foot` — the room `<main>` leaves under the page, **and the breakpoint
  is back**: `2.75rem + 1rem` below `lg`, which is `.cm-foot`'s own plate height
  plus the air under the last panel, and 2rem above it where there is no bar. It
  had gone flat at 2rem for the four days the rail held every width; the foot row
  returned to the phone on 5 Sep 2026 and the breakpoint with it. The safe-area
  inset is the nav's own, inside the fixed element, so it is under the plates
  rather than under the page. The front page runs its stock out through it;
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
| `SMALL_CAPS` | The small-caps geometry with no ink, for the caller that needs a different one. | `LABEL`'s other half |
| `LABEL` | `SMALL_CAPS` in the ink furniture is set in. Callers keep their own layout and font. **Appending a colour does not work** — two colour utilities are resolved by stylesheet order, so `${LABEL} text-bad` renders faint; compose from `SMALL_CAPS`. | 26 sites, 22 files |
| `ROW_FIGURE` | **How big a figure in a row is** — `sm`, at both widths (Craig, 10 Sep 2026: *"The numbers in the rows for each column are still too small on desktop"*, then *"numbers in rows are good on desktop, still small/hard to read to mobile"* an hour later, which took the `lg:` half off the pair). **Still**: `tokens.css` had already taken the three smallest STEPS up a pixel on 5 Sep, which left the RATIO where it was — `.cm-index` and `ROW_NAME` both set a desk row's placing and name at `base`, so a row read 16 · 16 · **12**, and the twelve was the part a standings table is for. A step of its own rather than another pixel on `--text-2xs`, which is 141 sites and mostly labels. | the size half of `FIGURE`, `BOARD_FIGURE` and both form guides |
| `FIGURE` | A figure in a repeating row: tabular, **centred**, bold, at `ROW_FIGURE`. **One size, and the decision was Craig's** (7 Sep 2026: *"make sure its not declared in different places"*) — the two boards that carried their own are folded in. A board that wants a bigger figure now asks for it as an addition anybody can grep for. | 3 identical private `const FIGURE`, plus `SquadTable`'s `WIDE_FIGURE = ${FIGURE} lg:text-sm`, `league/team-stats`' private `const FIGURE` at `text-base lg:text-lg` — the same NAME in another file at three times the size — and `prem/team-stats` inline at `text-sm` |
| `BOARD_FIGURE` | The same figure on a stat BOARD: flushed **right**, ink and weight left to the caller. `FIGURE` is the standings table's shape; a board is `cm9900/21.jpg`'s — many columns a reader compares down rather than across, units lined up. No `py`, because two of the six calling files set `py-1` — their rows have no `.cm-row` — and four do not. | 15 sites in 8 files matched the spelling, **13 are this recipe**, counted 10 Sep 2026. One of the 13 had already grown a `lg:text-sm` alone (`prem/club/[code]/stats/PlayerBoard`), which is what a recipe with no name looks like the day somebody needs to change it. **Counted and refused**: `prem/match/[id]/Squads` right-flushes a position and `matchday/desk/Rows` a club's three letters — neither is a figure, and `Rows` has no `.numeric` |
| `INDEX_WIDTH` | How wide CM's index block is — 32px under a thumb, 36 on the desk — so a column of them is one shape rather than six (Craig, 5 Sep 2026: *"blue tab needs to be same size as the rest"*). A **relocation, not an extraction at two**: it was already named, already exported for `shell/ScoreRow`, and had no consumer outside its own file while `ScoreRow` wrote `w-8 lg:w-9` out by hand. | moved from `league/TableCells`, 7 Sep 2026 |
| `QUIET_FIGURE` | `numeric text-2xs text-faint` — a figure the reader scans PAST. **Nine sites in five files**, counted 4 Sep 2026; `desk.ts` had listed it under "Declined" at four files and left it for the next pass, and this was that pass. |
| ~~`SLOT_FIGURE`~~ | **Gone, 10 Sep 2026, because it had no caller.** Its one site — `prem/club/[code]/SquadTable`'s shirt-number column — moved into a `.cm-index` block on 5 Sep at Craig's asking, and the export outlived it. Found while giving every row figure a desk step: it was about to take one, for nobody. |
| `TONE` | Which way a form result leans. `W`/`D`/`L` as DESIGN §3's direction pair. | 2 byte-identical |
| `TEXT` | Where a column's text sits. `TableHeads.JUSTIFY` is the flex twin. | 2 byte-identical |
| `BOARD` | A table that fills its panel and rules its own rows. | 9 files |
| `ROW_NAME` | **A name in a repeating row** — a club, a manager, a footballer: the chrome face, `sm`/`lg:base`, bold. No `truncate` and no `min-w-0`, because whether a name may be cut depends on what is beside it. **Not** a `.cm-title` bar, a dialog heading, or `matchday/desk/Rows`' "ARS v CHE", which is a fixture line rather than a name. | 7 ways in 2 faces and 4 sizes (5 Sep 2026); 3 sites still outside it earlier on 7 Sep, and **12 more found the same day** when Craig checked a second screen (*"i still see different font sizes in the app, such as /league/team-stats"*) — both team-stats boards, three match screens, `league/matchups`, `league/schedule` (both branches of one opponent), `football/MatchList`'s scorer, the transfer ledger, `prem/club` set-pieces and its fixture run. **Three more on 10 Sep** — the row-name cells of the three dense stat GRIDS, which the earlier sweeps had walked past because none of them writes a name into a `<span>`: `squad/[teamId]/stats/StatBoard` inherited `text-2xs` from its `<td>`, `league/SeasonGrid` set it there, and `prem/club/[code]/stats/PlayerBoard` had the size and the weight but not the face. Measured rather than assumed: the row height does not move at either width, because `.cm-index` beside them already sets `text-sm`/`lg:text-base` and was already the tallest thing in the row |
| `ROW_RULE` | The rule between two rows of a TABLE. `border-bg`, the darker step, so a table reads as grooved rather than as fifteen boxes. **`.cm-rows` rules a LIST with the same colour since 7 Sep 2026** — it was `--color-line`, so the schedule's ties and the table's teams were separated by two different marks, and the reference rules its rows with nothing at all (`cm9900/24.jpg`, `cm0102/07.jpg`): what gives a CM list its rhythm is the gap between the index blocks down its left. | 14 files |
| `SCROLL` | What a board is wrapped in so a phone can reach its far columns. | 14 sites |
| `TAB` | One plate of a tab strip: the blue plate, filling its share of the row, label centred in the chrome face. Size and padding stay the caller's — `TabStrip` takes its own from a prop, `GroupNav` keeps a 44px floor that relaxes to 36, `Board` will not let a category wrap. | 5 spellings, and one had already diverged: the wire picker was written with no `lg:text-sm`, so it sat at 9px on a desk where every other strip steps to 14 |
| `HEAD_PLATE` · `HEAD_PLATE_END` | A column head on a stats board (`h-6`), left over a name and right over a figure. `TableHeads.PLATE` is the `h-7` twin over a table. An empty one is not a mistake — see `MUTE`. | 12 sites, 3 files |
| `PANEL` | The default panel: a CM well holding a column of things. A caller with a reason keeps its own spacing and states it; a caller without one takes this. | 6 sites agreed already, 4 strays joined |
| `PANEL_FLUSH` | The same well with no spacing of its own, for a panel whose single child manages it — a board, a ledger, a grid. A different decision from `PANEL`, not `PANEL` minus two utilities. | 6 sites |
| `HEAD_CELL` | The `<th>` a stats board's head plate sits in: no padding, because the plate carries it. | 3 boards — the same three that share `HEAD_PLATE` |
| `FACT` | One stated fact in a stack: bordered, at the tap floor at both widths. | 4 files |
| `FACT_LABEL` | The label half of a `FACT` row — takes the room the figure does not, and truncates rather than wrapping. The truncation is the part worth naming: a Fantrax label is a full sentence on some rows, and a row that wraps to three lines stops being a row. | 5 files |
| `SUBMIT` | The button that submits a form it sits inside. | 3 sites |

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
| `const DASH = "—"` | 10 named against 53 unnamed `"—"` in 34 files (11 Sep) | Named only if every literal adopts it: a shared name most sites ignore hides the scatter. A DESIGN §7 decision, not a class string. |
| `px-3 text-2xs text-faint` | 5 sites (7 Sep) | Left: not sediment from the run that counted it. |
| `Array.isArray(v) ? v[v.length - 1] : v` | 2 (`players/query`, `players/analysis/page`) | A shared query helper. |
| Tab label `px-2 text-2xs` | 1 (`league/GroupNav`, since 6 Sep) | Below the bar. |
| `spelled()` + `WORDS` + `SPELL_FROM` | 2 (`matchday/FootballRow`, `matchday/desk/Rows`) | `football.ts`: a football fact, not a desk recipe. |
| `BOX = { width: 100, height: 64 }` | 2 (`players/analysis/PlayerMap`, `prem/match/[id]/ShotMap`) | `football.ts`. `CmGround`'s `BOX` is a penalty area and shares only the name. |
| `MONTHS` · `SETTLE = 250` · `FORM_GAMES = 5` | 2 each (11 Sep) | Left. |
| The gazette's story furniture (kicker, headline, standfirst, rule) | 3-4 files each | A `paper.ts`: it belongs to the paper, not the desk. |
| The refusal pair (`shell/Nothing`, `error`, `not-found`) | 3 | Two of them should use `Nothing` itself. |
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
