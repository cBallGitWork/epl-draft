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
// file must not become is `DASH`: nine files name `const DASH = "—"` against 68
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

/** A figure in a repeating row: tabular, centred, and small enough that a column
 *  of them reads as a column. Three files declared it byte-identically under a
 *  private `const FIGURE` — `league/TableRow`, `prem/ClubRow`, `players/Board`.
 *
 *  Two more files declare a `FIGURE` that is this string plus a size:
 *  `lg:text-sm` on the club squad table and `text-base font-bold lg:text-lg` on
 *  Team Stats. They are not folded in here, because "one figure size per
 *  density" is a visible decision and this file is not allowed to make one.
 *
 *  `.numeric` is what makes the digits line up (`font-display` plus `tnum`), and
 *  DESIGN §6 is why nothing here letterspaces: `.numeric` already sets -0.01em
 *  and a `tracking-*` on the same element is the two rules arguing. */
export const FIGURE = "numeric px-1.5 text-center text-2xs font-bold";

/** The same cell when it is holding a position, a shirt number or anything else
 *  the reader scans PAST on the way to a figure. Same geometry, quieter ink and
 *  no weight — the pair is the point, and they must stay the same width or the
 *  column bends.
 *
 *  **One caller**, and named anyway, which §1 normally forbids. It is here as
 *  half of a PAIR rather than as an abstraction over its callers: the thing
 *  being recorded is that this and `FIGURE` share a geometry on purpose, and a
 *  second copy written from scratch would not know that. If it is still at one
 *  next refactor, delete it and inline the string. */
export const SLOT_FIGURE = "numeric px-1.5 text-center text-2xs text-faint";

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

/** The crest beside a scoreline: 22px, at both widths, held open even when the
 *  club is missing so a column of scores stays a column. Four sites wrote
 *  `h-[1.375rem] w-[1.375rem]` and three of them wrote `width={22} height={22}`
 *  beside it, which is a magic number twice over.
 *
 *  **Deliberately not `--row-badge`.** That token is 26px, drops to 20 on the
 *  desk, and is set ON `.cm-row` — and `desk.css` says in as many words that a
 *  scoreline panel must not wear `.cm-row`, because one of its halves is a
 *  button and the class would hold a control to a row's floor. So the token
 *  cannot reach here and would be the wrong number if it did. 22 is the
 *  scoreline's own size, and this is where it is written down.
 *
 *  `_PX` is what `next/image` is told to FETCH and the class is what the page
 *  draws — `TeamBadge`'s `BADGE_PX`/`BADGE_SLOT` pair, for its reason: a source
 *  fetched smaller than it is drawn is a soft crest nobody thinks to blame the
 *  CSS for. They are the same number here because this mark has no breakpoint. */
export const SCORE_CREST = "h-[1.375rem] w-[1.375rem] shrink-0";
export const SCORE_CREST_PX = 22;

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

/* ---- Declined, with the count ---------------------------------------------
 *
 * The section that saves the next session the counting.
 *
 * `const DASH = "—"` — 9 named against 68 unnamed literals in 34 files.
 *   Naming it a tenth time would hide the scatter behind a plausible name. It
 *   is named only if all 68 adopt it, which is a decision about the absence
 *   grammar (DESIGN §7) rather than about class strings.
 *
 * **Above the bar and deliberately left, with the count** — the honest half of
 *   this section, counted on 3 Sep 2026 and belonging to the next pass rather
 *   than to the end of a long one:
 *
 *     `text-xl font-bold tracking-tight`   6 files — a section heading, spread
 *                                          across matchday, `/gw` and a player
 *     `numeric text-2xs text-faint`        4 files — a quiet figure
 *     `px-3 text-2xs text-faint`           5 sites
 *     `flex items-baseline justify-between gap-3 pt-1`  5 sites
 *
 *   None of these is sediment from this run; they were all there before it, and
 *   extracting four more recipes in the last hour of a session is how a name
 *   gets chosen from tiredness rather than from meaning.
 *
 * The TAB LABEL at `px-2 text-2xs` — 2 sites, `players/Board`'s measure strip
 *   and `components/league/GroupNav`, whose class strings differ only in
 *   `whitespace-nowrap` against `min-h-11`. Below the bar, and neither is a
 *   `TabStrip`: `GroupNav` records why it stays out, and Board's is a strip of
 *   MEASURES rather than routes. The app has five tab-label recipes and this
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
 * The submit-quiet pair above — 2 sites. Under the bar.
 */
