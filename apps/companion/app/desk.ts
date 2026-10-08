// The desk's recipes: class strings composed at three or more sites. A pure look (fill, border, bevel) is a
// class in `desk.css`; a recipe with no per-caller variation becomes a component. docs/ui/conventions.md counts them.

/* ---- Labels and figures --------------------------------------------------- */

/** The small-caps label look, with no ink and no layout: callers keep their own. */
export const SMALL_CAPS = "text-2xs font-bold uppercase";

/** The same look a step down, for a tag or a key set beside something larger. Ink and layout are the caller's. */
export const MINOR_CAPS = "text-3xs font-bold uppercase";

/** `SMALL_CAPS` in furniture ink. For another ink compose from `SMALL_CAPS`: an appended
 *  `text-bad` loses to `text-faint` on stylesheet order, whatever the class order says. */
export const LABEL = `${SMALL_CAPS} text-faint`;

/** `MINOR_CAPS` in furniture ink: `LABEL` a step down. */
export const MINOR_LABEL = `${MINOR_CAPS} text-faint`;

/** A name you scan a row for; truncation is the caller's. */
export const ROW_NAME = "font-chrome text-sm font-bold lg:text-base";

/** A figure in a row: one size at both widths, in proportion with the name. */
export const ROW_FIGURE = "text-sm";

/** A row's figure cell, centred under a centred head. `.numeric` already tracks: never add `tracking-*`. */
export const FIGURE_CELL = `numeric px-1.5 text-center ${ROW_FIGURE}`;

/** A standings figure: `FIGURE_CELL`, bold. */
export const FIGURE = `${FIGURE_CELL} font-bold`;

/** CM's index block width, fixed so a column of blocks is one shape; here so `shell/` need not import upward. */
export const INDEX_WIDTH = "w-8 lg:w-9";

/** A figure to scan past: a club's letters beside a name, a record under a heading. */
export const QUIET_FIGURE = "numeric text-2xs text-faint";

/** A line to read past: a note under a board, an aside beside a heading, a caption. `QUIET_FIGURE` is its figure. */
export const QUIET_NOTE = "text-2xs text-faint";

/** A form result's ink: DESIGN §3's direction pair, with a draw quiet rather than a third colour. */
export const TONE = { W: "text-up", D: "text-faint", L: "text-bad" } as const;

/** A fantasy figure's ink by what it did to a score: the direction pair, and nought left to the caller. */
export function gainOrLoss(points: number): string {
  return points > 0 ? "text-up" : points < 0 ? "text-bad" : "";
}

/** Where a column's text sits: a name left, a figure centred. `TableHeads` has the `justify-*` twin. */
export const TEXT = {
  left: "text-left",
  center: "text-center",
} as const;

/* ---- Boards --------------------------------------------------------------- */

/** A table that fills its panel. `border-collapse`, or the row rule doubles to 2px. */
export const BOARD = "w-full border-collapse text-sm";

/** The rule between table rows, in `border-bg`: the darker step reads as one ruled table. */
export const ROW_RULE = "border-b border-bg";

/** A board row that answers the pointer: the rule, and the surface under a hover. */
export const ROW_HOVER = `${ROW_RULE} hover:bg-surface`;

/** `ROW_HOVER` on a board that already sits on the surface: the hover steps up to raised. */
export const ROW_HOVER_ON_SURFACE = `${ROW_RULE} hover:bg-raised`;

/** The wrapper that lets a phone reach a board's far columns. */
export const SCROLL = "overflow-x-auto";

/** A board's frozen tile or index block at its left edge, head and cells alike. */
export const PINNED_TILE = "sticky left-0 z-10";

/** A board's frozen name column; the caller adds where it starts. `bg-surface` is load-bearing: a transparent one
 *  lets the scrolled figures slide under the name. */
export const PINNED_NAME = "cm-lead sticky z-10 border-r border-line bg-surface";

/** `PINNED_NAME` starting where a pinned position tile ends; the offsets are `TILE_WIDTH`'s widths. */
export const PINNED_BESIDE_TILE = `${PINNED_NAME} left-10 lg:left-14`;

/** `PINNED_NAME` starting where a pinned index block ends; the offsets are `INDEX_WIDTH`'s widths. */
export const PINNED_BESIDE_INDEX = `${PINNED_NAME} left-8 lg:left-9`;

/** A gameweek view's header row and title. */
export const GAMEWEEK_HEAD = "flex items-baseline justify-between gap-3 pt-1";
export const GAMEWEEK_TITLE = "text-xl font-bold tracking-tight";

/** One plate of a tab strip. Size and padding stay the caller's. */
export const TAB =
  "cm-tab flex flex-1 items-center justify-center font-bold uppercase lg:text-sm";

/** A name across a colour plate's bar (a side of a scoreline, a man in Compare): the title's shadow, cut short rather
 *  than wrapped. Size is the caller's, and so is ink, which the plate's colour decides. */
export const BAR_TITLE = "cm-title min-w-0 flex-1 truncate font-chrome font-bold uppercase";

/** The yellow line over a pitch naming the eleven on it, after `cm-title` and any spacing the caller needs. */
export const PITCH_CAPTION = "text-center font-chrome text-2xs font-bold text-accent lg:text-sm";

/** CM's blue title row across a panel, naming the section under it. */
export const SECTION_BAR =
  "flex min-h-7 items-center justify-center bg-chrome px-3 font-chrome text-2xs font-bold uppercase text-ink lg:min-h-8 lg:text-xs";

/** A 24px caption plate, left: a block's or a card's strip. A table's column head is `TableHeads.PLATE`, 28. */
export const HEAD_PLATE = "cm-bevel flex h-6 items-center px-1.5";
/** The same plate centred, over a group of columns or a card's figure. */
export const HEAD_PLATE_CENTRE = `${HEAD_PLATE} justify-center`;

/** A plate naming a group of columns or a section of a match board. */
export const GROUP_PLATE = `${HEAD_PLATE_CENTRE} text-2xs font-bold uppercase`;

/** A plate captioning a block inside a panel: a cup round, a group, a side of a bracket. */
export const BLOCK_PLATE = `${HEAD_PLATE} ${MINOR_CAPS}`;

/* ---- Panels and controls -------------------------------------------------- */

/** The default panel spacing. A caller with a reason keeps its own and says why. */
export const PANEL = "cm-panel flex flex-col gap-2 p-2";

/** A panel holding one thing that spaces itself: a board, a ledger, a grid. */
export const PANEL_FLUSH = "cm-panel flex flex-col";

/** A heading between two panels, on a plate of its own: nothing prints on the bare ground. */
export const HEADING_PLATE = `cm-panel px-2 py-1 text-center ${LABEL}`;

/** The `<th>` a stats board's head plate sits in; the plate carries padding and alignment. */
export const HEAD_CELL = "p-0 text-left font-bold";

/** A row's own `<th scope="row">`: unpadded and unbolded, so the link or name inside it sets both. */
export const ROW_HEAD_CELL = "p-0 text-left font-normal";

/** A fact row's label: takes the spare room and truncates, because a Fantrax label can be a sentence. */
export const FACT_LABEL = "min-w-0 flex-1 truncate text-sm text-muted";

/** A form's submit button: `BUTTON`'s height without its flex centring. */
export const SUBMIT = "cm-bevel min-h-11 px-3 text-sm font-medium lg:min-h-9";

/** A plate held down while its choice stands, else raised and lifting under a pointer. Geometry is the caller's. */
export function heldPlate(held: boolean): string {
  return held ? "cm-bevel-pressed" : "cm-bevel hover:brightness-110";
}

// Components own their elements and live with them: BUTTON and SELECT in `shell/ButtonLink`, PLATE
// and SortHead in `league/TableHeads`, ROW_LINK in `league/TableCells`.

/* ---- A column that stands down under a thumb ------------------------------ */

/** A column shown on the desk only. */
export const DESK_ONLY = "hidden lg:table-cell";

/** `DESK_ONLY`, unless the table is sorted by this column, whose arrow and `aria-sort` must show. */
export function standDown(deskOnly: boolean | undefined, sorted: boolean): string {
  return deskOnly && !sorted ? DESK_ONLY : "";
}

/* ---- One view at a time under a thumb -------------------------------------- */

/** A block a phone shows only while it is the view picked; a desk shows every one, side by side. */
export function phoneShows(picked: boolean): string {
  return picked ? "" : "max-lg:hidden";
}
