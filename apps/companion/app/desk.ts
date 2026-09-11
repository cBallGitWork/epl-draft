// The desk's recipes: the layer between a token and a page.
//
// `tokens.css` says what a colour and a type step MEAN, and `desk.css` names
// twelve component looks. Neither could say what a screen actually writes, so
// every screen wrote it out — the small-caps label 26 times across 22 files, the
// rule between table rows 11 times across 11, one head plate 12 times in three.
// A recipe is the composition of look, layout and size, and it had no home.
//
// **Where a recipe lives — the rule, because the codebase has all three kinds
// and picked between them by accident.**
//
//   A pure APPEARANCE — fill, border, bevel, ink → a class in `desk.css`. The
//   cascade owns it, which is how `.paper` re-points the same tokens without
//   touching a component.
//
//   Appearance PLUS layout, with per-caller variation → an exported class
//   string, here. A component would own nothing but a string and would need a
//   `className` prop to hand it back.
//
//   Appearance plus layout, NO variation, at three or more sites → a component.
//   It owns its element and its aria, and a caller cannot get it half right.
//
// So the look stays in CSS and the composed recipe becomes a typed string. Not
// CSS-only: `desk.css` is already past §4's 300-line ceiling, and a string
// composes with a caller's own — `${ROW_LINK} ${yoursInk(yours)}` — where a
// class cannot. Not components-only: §1 forbids one built for a single caller.
//
// Named for the register it serves, which is what CODE_RULES §4 asks. `ui.ts`
// is `utils.ts` wearing a different word and §4 bans that family by name. The
// paper keeps its own recipes; this file is the desk's.
//
// **The bar for entry is three occurrences**, and the count is recorded beside
// each one so the next session can check it rather than trust it. The trap this
// file must not become is `DASH`: TEN files name `const DASH = "—"` against 53
// unnamed `"—"` literals in 34 others, which makes the codebase LOOK
// centralised while it is not. That is worse than honest duplication, because
// the plausible name hides the scatter. See "Declined" at the foot.

/* ---- Labels and figures --------------------------------------------------- */

/** The desk's small-caps label — the four classes that make a word furniture
 *  rather than content. 26 sites in 22 files wrote it out.
 *
 *  Four classes and no layout, because the layout is genuinely per-caller: this
 *  is an `h2` at the head of a panel, a `dt` in a figure list, a `label` over a
 *  field, and the `v` between two team names. They share the LOOK and share
 *  nothing else, so each keeps its own `px-`, `flex` and font — `${LABEL}`
 *  after a caller's own classes, never instead of them. */
export const SMALL_CAPS = "text-2xs font-bold uppercase";

/** The same furniture, in the ink it is furniture in. This is the one to reach
 *  for; `SMALL_CAPS` exists for the caller that needs a DIFFERENT ink.
 *
 *  **And that caller cannot get it by appending one.** Two colour utilities on
 *  one element are resolved by their order in the generated stylesheet, not by
 *  their order in the class attribute, so `${LABEL} text-bad` renders faint —
 *  measured, not assumed: `lab(59.45 1.43 8.41)` against `text-bad`'s
 *  `lab(58.88 53.44 31.17)`. The club page's refusal line was grey for exactly
 *  as long as it took to probe it. Compose from `SMALL_CAPS` instead. */
export const LABEL = `${SMALL_CAPS} text-faint`;

/** **A NAME in a repeating row** — a club, a manager, a footballer.
 *
 *  Craig, 5 Sep 2026: *"im still worried that multiple rows with similar items
 *  look different, different fonts. we should try to unify where we can."* He is
 *  right, and the count says how badly. One thing — the name you scan a list FOR
 *  — was drawn **seven ways in two faces and four sizes** on 5 Sep:
 *
 *    league/TableRow        sans   base / lg:lg   bold
 *    prem/ClubRow           sans   base / lg:lg   bold      (via ROW_LINK)
 *    league/team-stats      sans   base / lg:lg   bold      (via ROW_LINK)
 *    prem/team-stats        sans   base / lg:lg   bold      (via ROW_LINK)
 *    prem/match players     sans   sm             normal
 *    prem/club SquadTable   sans   inherited      bold
 *    players/PlayerTable    sans   inherited      medium
 *    matchday/Wire          CHROME sm / lg:base   bold
 *    shell/ScoreRow         CHROME sm / lg:base   bold
 *
 *  **The chrome face wins**, because Craig asked for it by name the same day
 *  ("for all rows, use the correct CM font please") and because it is the face
 *  `desk.css` already puts on every plate — a row and the column head above it
 *  were in different families.
 *
 *  **`sm` under a thumb and `base` on the desk**, which is the pair the two
 *  chrome sites already used and the one the density table names for a row. The
 *  `base`/`lg:lg` sites came down a step: they were sized against CM's league
 *  table, where a club name is half again the figures beside it — and that is a
 *  ratio between the NAME and the FIGURE, which `--text-2xs` going up a pixel on
 *  the desk already narrowed.
 *
 *  *This went to `text-base font-extrabold lg:text-lg` for an hour on 7 Sep 2026
 *  and came straight back.* Craig's "bolder, larger, stronger, with a slight
 *  shadow" was about the **league PLACING** — the ordinal in the blue box — and
 *  this file read it as the row. `.cm-index` in `desk.css` is where that work
 *  belongs and now lives; the row name was never the thing being complained
 *  about.
 *
 *  No `truncate` and no `min-w-0`: those are the caller's, because whether a
 *  name may be cut depends on what is beside it, and half these sites sit in a
 *  `<td>` that handles it.
 *
 *  **Three sites were still not asking for any of this**, counted the same day
 *  and folded in: `components/league/SquadRows` at `text-sm font-medium`,
 *  `squad/page` at a bare `font-semibold` and `components/football/MatchList` at
 *  `text-sm font-semibold` — all three in the UI face, which is the exact
 *  complaint the docblock above records being made in September and half-fixed.
 *  The squad list was the one Craig named.
 *
 *  **And TWELVE more were not, counted 7 Sep 2026** — the sweep Craig asked for
 *  when the fix above turned out to have been one screen deep (*"i still see
 *  different font sizes in the app, such as /league/team-stats"*). Every one of
 *  them drew a name you scan a list FOR, and every one drew it in the UI face:
 *
 *    league/team-stats        no size at all — inherited `BOARD`'s `text-sm`
 *    prem/team-stats          the same, twice, short name and long
 *    prem/match Squads        text-sm
 *    prem/match PlayerStats   text-sm
 *    prem/match Scoresheet    text-sm font-bold
 *    league/matchups Pairing  text-sm font-semibold
 *    league/schedule Season   text-sm font-semibold — and its OTHER branch,
 *                             `text-sm italic text-faint`, which draws the same
 *                             opponent when there is no team to link to
 *    football/MatchList       text-sm font-medium  (the scorer — the same file
 *                             already used ROW_NAME for the club beside it)
 *    squad transfers Ledger   text-sm font-medium
 *    prem/club set-pieces     text-sm font-bold
 *    prem/club Run            text-sm, under a `font-bold` on the LINK
 *
 *  The last is the one worth naming: `Run` bolded the anchor rather than the
 *  name, so the weight could not travel with the recipe and the `font-bold`
 *  outlived every span it was meant to be about. It came off the link.
 *
 *  Four sites are deliberately NOT here, because they are not rows: the two
 *  `.cm-title` bars, `PlayerCard`/`LivePlayerCard`'s dialog headings, and
 *  `matchday/desk/Rows`, whose "ARS v CHE" is a fixture line rather than a name
 *  — a compound of two clubs and a "v", set at the wire's own `text-xs`. */
export const ROW_NAME = "font-chrome text-sm font-bold lg:text-base";

/** **How big a figure in a row is**, and it is the same figure whether the table
 *  centres it or flushes it right.
 *
 *  Craig, 10 Sep 2026: *"The numbers in the rows for each column are still too
 *  small on desktop."* **Still** is the word that matters — `tokens.css` already
 *  answered the first complaint (5 Sep) by taking the three smallest STEPS up a
 *  pixel above `lg`, which moved `text-2xs` from 11px to 12 and left the ratio
 *  where it was. The ratio is the actual fault: `.cm-index` sets the placing at
 *  `text-base` on a desk and `ROW_NAME` sets the name beside it at the same, so
 *  a row read 16px · 16px · **12px**, and the twelve is the part of the row a
 *  standings table is FOR.
 *
 *  So the figure takes a step of its own above `lg` rather than the scale taking
 *  another pixel: `--text-2xs` is 141 of the app's type sites and most of them
 *  are labels, which have no complaint. `sm` is 14px on a laptop and 15 on a
 *  monitor, against the name's 16 and 15 — a ratio CM's own table would
 *  recognise, where `24.jpg` runs a club name about half again its figures.
 *
 *  Nothing measured moves: `.cm-row` is 28px above `lg` and `text-sm`'s line box
 *  is 18, so DESIGN §6's density table stands.
 *
 *  **And the phone takes the same step, an hour later.** This shipped as
 *  `text-2xs lg:text-sm` on the reasoning that the phone was never the complaint
 *  and its 44px row has the room anyway — the first half of which Craig answered
 *  within the hour: *"numbers in rows are good on desktop, still small/hard to
 *  read to mobile."* The second half was the argument for fixing it rather than
 *  against: a 44px row carrying an 11px figure is a row with 33px of nothing in
 *  it, and 11px of `.numeric` is 11px of a CONDENSED face — Archivo Narrow with
 *  `tnum`, which is the narrowest thing on the screen at the smallest size on
 *  the screen. The name beside it was already `text-sm`.
 *
 *  So one step for both, and the `lg:` half of the pair is gone: `text-sm` is
 *  14px under a thumb, 14 on a laptop and 15 on a monitor, because `tokens.css`
 *  moves `sm` at 96rem and not at 64. The desk lands exactly where Craig has
 *  just approved it and the phone catches up. It fits: at 390 the widest figure
 *  on the table is `141` at about 21px inside a `w-11` cell, and the six single
 *  digits are 7px inside `w-7`. */
export const ROW_FIGURE = "text-sm";

/** A figure in a repeating row: tabular, centred, and small enough that a column
 *  of them reads as a column. Three files declared it byte-identically under a
 *  private `const FIGURE` — `league/TableRow`, `prem/ClubRow`, and `players/Board`
 *  (deleted 6 Sep 2026, when the pool's leaderboard became a directory).
 *
 *  **Both of the exceptions are gone, and the decision was Craig's** (7 Sep
 *  2026: *"make sure its not declared in different places"*). Two files carried
 *  their own: `prem/club/[code]/SquadTable` composed `WIDE_FIGURE = ${FIGURE}
 *  lg:text-sm`, and `league/team-stats` declared a private `const FIGURE` at
 *  `text-base font-bold lg:text-lg` — the same NAME as this one, in another
 *  file, at three times the size on a desk. `prem/team-stats` wrote a fourth
 *  spelling inline at `text-sm`. The entry this replaces said "one figure size
 *  per density is a visible decision and this file is not allowed to make one",
 *  which was right: the file did not make it, and the four spellings sat there
 *  until somebody looked at two boards side by side. A board that wants a bigger
 *  figure now asks for it as an ADDITION anybody can grep for, the way
 *  `.cm-index` does with the placing.
 *
 *  `.numeric` is what makes the digits line up (`font-display` plus `tnum`), and
 *  DESIGN §6 is why nothing here letterspaces: `.numeric` already sets -0.01em
 *  and a `tracking-*` on the same element is the two rules arguing.
 *
 *  The size is `ROW_FIGURE`'s, which is one step and not a token — see above. */
export const FIGURE = `numeric px-1.5 text-center font-bold ${ROW_FIGURE}`;

/** How wide CM's index block is, and it is a WIDTH rather than a padding.
 *
 *  Craig, 5 Sep 2026, on the match ratings board: *"blue tab needs to be same
 *  size as the rest."* A `<td>` sizes to its content, so a shirt number of 7 got
 *  a narrower block than 77 and a man the identity files carry no number for got
 *  the narrowest of all — eleven blocks down a column, six different widths.
 *  What makes a column of them read as one object is that they are the same
 *  shape. 32px under a thumb and 36 on the desk.
 *
 *  **Here rather than in `components/league/TableCells`, where it lived until
 *  7 Sep 2026**, and the move is a LAYERING fix rather than an extraction at
 *  two. Its second consumer is `components/shell/ScoreRow`, and `shell/` is the
 *  cross-register frame that `league/` builds on (CODE_RULES §4) — importing the
 *  other way was the only `shell/ → league/` import in the app. `desk.ts` is
 *  layer-neutral and both components already import from it, so the constant
 *  moves to the one place both may reach without either owning the other.
 *
 *  The bar of three governs whether a name is CREATED. This name existed, was
 *  exported for exactly this caller, and had **no consumer outside its own file**
 *  while `ScoreRow` wrote `w-8 lg:w-9` out by hand — an unused export beside a
 *  copy of its value, with two docblocks claiming they could not drift. */
export const INDEX_WIDTH = "w-8 lg:w-9";

/* `PLACING` was here for an hour on 7 Sep 2026 and is gone. It sized the ordinal
   in the blue index block at four sites, on the argument that the SIZE of that
   block's text is a decision about what the block holds — a placing, a shirt
   number, a date — where the weight and the shadow are not. Craig overruled it
   the same hour: *"i think we can have the same for now and il find the correct
   exceptions (such as ones that hold a date for example)."* One size on
   `.cm-index` is the honest default, and it makes an exception an ADDITION that
   somebody can grep for rather than a disagreement nobody can distinguish from a
   decision. `desk.css` carries the argument. */

/** A figure the reader is meant to scan PAST — a subordinate line under a
 *  louder one: a club's three letters beside a name, a record under a heading,
 *  a dash where a measurement is missing.
 *
 *  **Nine sites in five files**, counted 4 Sep 2026. This file's own "Declined"
 *  section listed it at four files and left it for "the next pass" on the
 *  grounds that extracting four recipes at the end of a long run is how a name
 *  gets chosen from tiredness. This is that pass, and the count has moved.
 *
 *  No padding and no alignment, because the nine callers genuinely differ there:
 *  three are inline `span`s in a flex column, two are `p`s in a dialog, and the
 *  rest sit in cells that set their own. What they share is the SIZE and the
 *  INK, which is the whole of the recipe. */
export const QUIET_FIGURE = "numeric text-2xs text-faint";

/* `SLOT_FIGURE` was here — `QUIET_FIGURE` in `FIGURE`'s geometry, for a cell
   holding a shirt number or a position beside a real figure — and it is **gone
   because it had no caller**. Its one site was `prem/club/[code]/SquadTable`,
   which moved that column into a `.cm-index` block on 5 Sep 2026 at Craig's
   asking; the export outlived it, and the only mention left in the tree is the
   comment there recording the move. Found on 10 Sep while giving every row
   figure a desk step: it was about to take one, which would have been a size
   decision made for nobody. An unused export beside a docblock claiming a
   pairing it no longer has is the `DASH` failure this file opens by naming. */

/** **A figure on a STAT BOARD** — flushed right, in a column of many, with the
 *  ink and the weight left to the caller.
 *
 *  `FIGURE` is the standings table's: centred, bold, one of eight. A board is
 *  the other shape CM draws — `cm9900/21.jpg`, thirteen columns of numbers a
 *  reader compares down rather than across — and it flushes them right so the
 *  units line up. `numeric px-1.5 text-right text-2xs` was written out at
 *  **fifteen sites in eight files**, counted 10 Sep 2026, and **thirteen of the
 *  fifteen are this recipe**. One of the thirteen had already grown a
 *  `lg:text-sm` on its own (`prem/club/[code]/stats/PlayerBoard`), which is what
 *  a recipe with no name looks like the day somebody needs to change it.
 *
 *  **Counted and refused, both in the other two:** `prem/match/[id]/Squads`
 *  right-flushes a POSITION and `matchday/desk/Rows` a club's three letters.
 *  Neither is a figure, and `Rows` does not even carry `.numeric` — a recipe
 *  that swallows the two members of a grep that are not what the grep was about
 *  is how a name stops meaning anything.
 *
 *  No `py`: two of the six files that call this set `py-1`, because their rows
 *  have no `.cm-row` on them, and four do not. A padding two thirds of the
 *  callers would have to undo is not part of the recipe. */
export const BOARD_FIGURE = `numeric px-1.5 text-right ${ROW_FIGURE}`;

/** Which way a form result leans. Two files declared this byte-identically.
 *
 *  It is DESIGN §3's direction pair spelled for one letter each: green is a
 *  gain, red is a loss, and a draw is neither, so it takes the quiet ink rather
 *  than a third colour. A yellow draw would be the accent making a claim about
 *  a result, and the accent means "yours". */
export const TONE = { W: "text-up", D: "text-faint", L: "text-bad" } as const;

/** Where the text in a column sits. Two files declared this byte-identically,
 *  and `TableHeads` has the `justify-*` twin for the flexed head plate. */
export const TEXT = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

/* ---- Boards --------------------------------------------------------------- */

/** A table that fills its panel and rules its own rows. Nine files wrote it.
 *
 *  `border-collapse` because the row rule below is a border and two adjacent
 *  borders on a separated table is a 2px rule. */
export const BOARD = "w-full border-collapse text-sm";

/** The rule between two rows of a table. Eleven files wrote it.
 *
 *  `border-bg` and not `border-line`: inside a panel the darker step reads as a
 *  ruled table where the lighter one reads as fifteen separate boxes, which is
 *  the same argument `.cm-rows` makes in `desk.css` for a list. Four further
 *  rows say `border-line/60` instead — two of them in a loading skeleton, whose
 *  job is to look like the table it stands in. That disagreement is visible, so
 *  it is phase 2's to settle and not this file's. */
export const ROW_RULE = "border-b border-bg";

/** What a board is wrapped in so a narrow phone can reach its far columns.
 *
 *  Fourteen wrappers on the desk scroll sideways and TWO of them add
 *  `cm-scroll`, CM's own bevelled bar — which is the worst of both, because a
 *  reader learns the bar means "there is more this way" and then meets twelve
 *  boards without one. Phase 2 settles it in one direction or the other; this
 *  names the geometry only, so that settlement is one edit here. */
export const SCROLL = "overflow-x-auto";

/** The FROZEN first column of a board that scrolls sideways — the name a reader
 *  needs to still have in front of him when the figures have slid away.
 *
 *  **Three sites, and the last refactor pass named this file as the destination
 *  at the third.** It declined at two — `players/Cell` and
 *  `prem/match/[id]/PlayerStats` — with the note that "CODE_RULES §1 leaves two
 *  alone and §4 moves a shared thing at the third; importing it across sections
 *  would also be `prem/` reaching into `players/` for a class string. The third
 *  use takes it to `desk.ts`." `players/PlayerTable` is the third, and the two
 *  files that declared it had drifted to byte-identical copies of one string.
 *
 *  `bg-surface` is load-bearing rather than decorative: a transparent frozen
 *  column lets the scrolled figures pass UNDER the name, which reads as a
 *  rendering fault rather than as a frozen column. It is the panel's own well
 *  rather than a plate laid on top of it, and it must not become a token that
 *  moves. The right border is what says the column is a boundary and not the
 *  first of the numbers.
 *
 *  **The head and the body cell take the same class**, because a head that does
 *  not freeze with its column is a label sliding off its own figures. */
export const STICKY_LEAD = "sticky left-0 z-10 bg-surface border-r border-line";

/** The header a GAMEWEEK view opens with — a title on the left, whatever the
 *  page has to say on the right, sharing one baseline.
 *
 *  **Five files, the widest spread of any repeated recipe in the app**, and four
 *  of them are the loading skeletons that have to match the real thing or the
 *  page jumps when it arrives: `football/GameweekView`, `matchday/desk/page`,
 *  and the `loading.tsx` of `gw/[gameweek]`, `matchday` and `matchday/desk`. A
 *  skeleton that mirrors a recipe by hand is the one kind of duplication that
 *  fails VISIBLY the moment the two drift, and it drifts silently until then. */
export const GAMEWEEK_HEAD = "flex items-baseline justify-between gap-3 pt-1";
export const GAMEWEEK_TITLE = "text-xl font-bold tracking-tight";

/** One plate of a TAB STRIP: the blue plate, filling its share of the row, with
 *  its label centred in the chrome face.
 *
 *  **Five spellings, counted 6 Sep 2026** — `shell/TabStrip`, `players/Board`,
 *  `league/GroupNav` and the wire picker's two on `/matchday` — which is past
 *  §4's third occurrence twice over, and the copying had already diverged: the
 *  wire picker was written without `lg:text-sm`, so the one strip added that day
 *  sat at 9px on a desk where every other strip steps to 14.
 *
 *  **Size and padding stay the caller's**, because the four genuinely differ and
 *  an options bag reconciling them is the abstraction §1 forbids: `TabStrip`
 *  takes its size from a prop, `GroupNav` keeps a 44px floor that relaxes to 36,
 *  and `Board` will not let a category label wrap. What is shared is the plate,
 *  the fill of the row, the centring and the face — which is exactly what a strip
 *  IS, and what a fifth caller would otherwise get half right. */
export const TAB =
  "cm-tab flex flex-1 items-center justify-center font-bold uppercase lg:text-sm";

/** A column head on a STATS board — the bevelled plate at the height a board of
 *  measures uses, as against `TableHeads.PLATE`'s `h-7` for a table of rows.
 *  Twelve sites in three files wrote it.
 *
 *  Two of them, because a head is left over a name and right over a figure: the
 *  figures are centred or right under a centred head in `cm9900/24.jpg`, and a
 *  name is read rather than compared, so it stays left. The height difference
 *  between this and `PLATE` is one of the conflicts DESIGN §6's density table
 *  now records; naming both is what makes reconciling them a single edit. */
export const HEAD_PLATE = "cm-bevel flex h-6 items-center px-1.5";
export const HEAD_PLATE_END =
  "cm-bevel flex h-6 items-center justify-end px-1.5";

/* ---- Panels and controls -------------------------------------------------- */

/** The default panel: a Championship Manager well holding a column of things,
 *  at the spacing six of them already agreed on.
 *
 *  Twenty-one distinct `cm-panel` spellings were counted across the app, which
 *  read as no rule at all. It is closer to three: `gap-2 p-2` at six sites is
 *  this, `gap-3 p-4` at three is the roomy one a page-level panel uses, and
 *  `gap-2 p-3` at three is between them. The rest are singletons, and a
 *  singleton is where a panel drifted rather than where it decided.
 *
 *  Named so a panel has a default to depart FROM. A caller with a reason keeps
 *  its own spacing and says the reason; a caller without one takes this. */
export const PANEL = "cm-panel flex flex-col gap-2 p-2";

/** The same well with no spacing of its own, for a panel whose single child
 *  manages its own — a board, a ledger, a grid. Six sites wrote it.
 *
 *  A separate name rather than `PANEL` minus two utilities, because it is a
 *  different decision: `PANEL` spaces a COLUMN OF THINGS, and this holds ONE
 *  thing that is already spaced. A gap with nothing to sit between is how
 *  `squad/[teamId]/fixtures` came to declare one. */
export const PANEL_FLUSH = "cm-panel flex flex-col";

/** The `<th>` a stats board's head plate sits in: no padding, because the plate
 *  inside carries it, and left because the plate decides its own alignment.
 *  Three boards wrote it — the club's, the squad's and the season grid — which
 *  are the same three that share `HEAD_PLATE`. */
export const HEAD_CELL = "p-0 text-left font-bold";

/** One stated fact in a stack of them: a bordered row tall enough to be aimed
 *  at, holding a label and its value. Four sites wrote it — the player page's
 *  own facts, his draft pedigree, his projection, and the Prem player page.
 *
 *  `min-h-11` and NOT `.cm-row`: this is a line you read, but it is also often
 *  a link, and desk.css is explicit that a control keeps its floor at every
 *  width. A row of a LIST relaxes to 28 on the desk; a stack of four facts is
 *  not a list. */
export const FACT =
  "flex min-h-11 items-center gap-2.5 border border-line bg-surface px-3 py-2";

/** The label half of a `FACT` row: takes the room the figure does not, and
 *  truncates rather than wrapping.
 *
 *  Five sites wrote it out — `Facts`, `Breakdown` and `Moves` on the player
 *  screen, `LivePlayerCard`, and `prem/player/[code]` — which is the third
 *  occurrence twice over. The truncation is the part worth naming: a Fantrax
 *  label is a full sentence on some rows, and a row that wraps to three lines
 *  stops being a row. */
export const FACT_LABEL = "min-w-0 flex-1 truncate text-sm text-muted";

/* `SCORE_CREST` / `SCORE_CREST_PX` were here and are gone — **down to one
   caller**, counted 5 Sep 2026. They were extracted at four scoreline rows;
   `shell/ScoreRow` absorbed three of them and draws its own badge, and the
   fourth (`prem/club/[code]/Run`) is a club's fixture run, which is not a
   scoreline at all. §1 forbids a recipe built for a single caller as firmly as
   it forbids a fourth copy, so the number moved back into `Run.tsx` beside the
   `next/image` call that is now its only consumer. */

/** The button that submits a form it sits inside — the plate at `BUTTON`'s
 *  height without `BUTTON`'s `flex` centring, because a `<button>` centres its
 *  own label and a form row wants to size it by its text. Three sites wrote it.
 *
 *  Not `ButtonLink.BUTTON` with the flex removed, because that string is a LINK
 *  looking like a button and this is a real submit; they agree today and the
 *  reason each is what it is differs. If they diverge, they diverge here. */
export const SUBMIT = "cm-bevel min-h-11 px-3 text-sm font-medium lg:min-h-9";

/* ---- Moved in, unchanged -------------------------------------------------- */
//
// These already existed and already had callers; they are re-exported from here
// so that "where is the button" has one answer, and their old homes keep
// exporting them so nothing broke in the commit that moved them.
//
//   BUTTON, SELECT   components/shell/ButtonLink.tsx
//   PLATE, SortHead  components/league/TableHeads.tsx
//   ROW_LINK         components/league/TableCells.tsx
//   NAME_SIZE, GAP_CLASS  components/league/PitchRows.tsx
//
// They are NOT re-exported as bare names here, because a component that owns an
// element and a string that decorates one are different things and only the
// second belongs in this file. Import them from their components.

/* ---- A column that stands down under a thumb ------------------------------ */

/** The class a desk-only column wears. **Eight sites in five files**, counted
 *  7 Sep 2026 — `league/Columns`, `prem/Columns`, `prem/club/[code]/SquadTable`
 *  three times, `players/PlayerTable` and its loading skeleton twice. */
export const DESK_ONLY = "hidden lg:table-cell";

/** Whether this column stands down under a thumb — **unless the table is
 *  ORDERED by it**.
 *
 *  **Three copies of one rule, counted 7 Sep 2026**: `league/Columns.deskOnly`,
 *  `prem/Columns.deskOnly` and `players/PlayerTable`'s own `phone()`, the last
 *  of which had renamed the concept to `phoneHidden` on the way past. Each
 *  closed over its own `COLUMNS` list, which is why the FINDING stays in each
 *  file and only the judgement moves here — the varying part is how a column is
 *  looked up and the shared part is what to do once it is found.
 *
 *  It is the rule DESIGN §2 rests on, which is why it must not drift: `display:
 *  none` does not quieten a column, it deletes it. The pressed plate, the sort
 *  arrow and `aria-sort` all live on that cell, so a phone arriving on a shared
 *  `?sort=` link would show an order with no visible author and nothing in the
 *  accessibility tree to say what it was. Three files agreeing by hand is three
 *  chances for one of them to stop. */
export function standDown(deskOnly: boolean | undefined, sorted: boolean): string {
  return deskOnly && !sorted ? DESK_ONLY : "";
}

/* ---- Declined, with the count ---------------------------------------------
 *
 * The section that saves the next session the counting.
 *
 * `const DASH = "—"` — **10 named against 53 unnamed literals in 34 files**,
 *   re-counted 11 Sep 2026. The two figures this file carried before that — 9
 *   against 68 in the header, 11 against 55 in 32 files here — were taken on the
 *   same day, disagreed with each other, and were both wrong, which is the
 *   strongest argument this entry makes: a count nobody re-runs decays into a
 *   number people quote. The greps, so the next one is reproducible:
 *
 *     named:   grep -rn --include='*.ts' --include='*.tsx' 'DASH = "—"' app
 *     unnamed: the same for '"—"', minus those lines
 *
 *   The entry above this one said 10 against 64 in 34 files on the same day,
 *   which is what an unrecorded method buys you: two sessions counting the same
 *   thing and disagreeing, with no way to tell which was wrong.
 *
 *   Naming it a twelfth time would hide the scatter behind a plausible name. It
 *   is named only if all 55 adopt it, which is a decision about the absence
 *   grammar (DESIGN §7) rather than about class strings.
 *
 * **Above the bar and deliberately left, with the count** — the honest half of
 *   this section. Counted 3 Sep 2026, RE-counted 7 Sep, and left again: none of
 *   it is sediment from the row-style run, so pulling five untouched files into
 *   that commit would make it harder to review for no gain.
 *
 *     `text-xl font-bold tracking-tight`   **5 files** (was 6) — a section
 *                                          heading, across matchday, `/gw` and
 *                                          `football/GameweekView`
 *     `px-3 text-2xs text-faint`           5 sites
 *     `flex items-baseline justify-between gap-3 pt-1`  5 sites
 *
 *   `numeric text-2xs text-faint` was on this list at 4 files and **is gone
 *   from it**: it was extracted as `QUIET_FIGURE` above, on 4 Sep, and the raw
 *   string now appears **0 times**. So this file both named a recipe and went on
 *   listing it as declined — the one failure mode the section exists to prevent,
 *   committed by the section itself.
 *
 *   `Array.isArray(v) ? v[v.length - 1] : v` — the repeated-query-parameter
 *   narrowing, **2 sites** (`players/query.ts`, `players/analysis/page.tsx`).
 *   Two is a coincidence and §1 leaves it alone; the third moves it.
 *
 *   None of these is sediment from this run; they were all there before it, and
 *   extracting four more recipes in the last hour of a session is how a name
 *   gets chosen from tiredness rather than from meaning.
 *
 * The TAB LABEL at `px-2 text-2xs` — was 2 sites, `players/Board`'s measure
 *   strip and `components/league/GroupNav`, whose class strings differed only in
 *   `whitespace-nowrap` against `min-h-11`. **It is ONE since 6 Sep 2026**, Board
 *   having gone with the leaderboard it labelled, so it is below the bar by a
 *   wider margin than when this was written and stays where it is. `GroupNav`
 *   records why it is not a `TabStrip`. The app has five tab-label recipes and this
 *   pair is two of them; the other three are `TabStrip`'s `phrase` and `word`
 *   — both measured and both justified, see its docblock — and the pool's
 *   filter `CHIP`, which is a chip at `text-sm` and a different object. So the
 *   five are not five spellings of one thing, which is what the count implied.
 *
 * The pitch NAME PLATE — 2 sites, `FplPitch` and `PitchPlayer`, and the whole
 *   long string is byte-identical in both. Below the bar, and `PitchRows`
 *   already owns `NAME_SIZE` and `GAP_CLASS` for the pitches, so that is where
 *   the third one goes rather than here.
 *
 *   Its `tracking-[-0.01em]` was reported as duplicating `.numeric`'s own
 *   letter-spacing — "the two rules arguing" that DESIGN §6 forbids. Checked:
 *   neither element carries `.numeric`, so nothing is arguing. It is a NAME on
 *   a fixed-height band, condensed to fit, and §6 says in as many words that
 *   negative tracking is untouched. The duplication is real and the rule breach
 *   was not.
 *
 * Counted 11 Sep 2026 in the repo-wide pass, all at TWO and therefore left:
 *
 *   `spelled()` + `WORDS` + `SPELL_FROM` — 2 (`matchday/FootballRow`,
 *     `matchday/desk/Rows`). The most dangerous of these, because it is a whole
 *     FUNCTION and a threshold rather than a class string, and only one of the
 *     two carries the docblock explaining why four is the number. If a third
 *     screen ever spells a scoreline, it goes to `football.ts`, not here — it is
 *     a football fact, not a desk recipe.
 *   `BOX = { width: 100, height: 64 }` — 2 (`players/analysis/PlayerMap`,
 *     `prem/match/[id]/ShotMap`), the shot/touch pitch in metres. A third map
 *     takes it to `football.ts`. `CmGround`'s `BOX` is a penalty area and shares
 *     nothing but the name.
 *   `WIDTH_M` / `PENALTY_SPOT_M` — 2 (`CmGround`, `PitchTurf`), and only those
 *     two of the nineteen pitch dimensions between them are shared at all.
 *   `MONTHS` — 2 (`core/inbox/when`, `core/league/fantrax/transactions`).
 *   `SETTLE = 250` — 2 (`players/Search`, `players/analysis/PickField`).
 *   `FORM_GAMES = 5` — 2 (`league/TableRow`, `prem/ClubRow`).
 *
 * Seventeen repeated className strings at 3+ files were counted and left, because
 *   naming seventeen recipes in one pass is how a name gets chosen from
 *   tiredness. Two were taken — the ones above with the widest spread. The rest,
 *   loudest first: the gazette's story furniture (kicker chip, display headline,
 *   standfirst, hairline rule — 3-4 files each, and they belong to the PAPER, so
 *   they want a `paper.ts` rather than this file), the refusal pair shared by
 *   `shell/Nothing`, `error` and `not-found` (3 each, and the better fix is that
 *   two of the three stop hand-rolling the component the third already is), and
 *   `border-collapse w-full whitespace-nowrap` (3), which is a near-miss of
 *   `BOARD` and wants reconciling with it rather than a name of its own.
 *
 * The submit-quiet pair above — 2 sites. Under the bar.
 */
