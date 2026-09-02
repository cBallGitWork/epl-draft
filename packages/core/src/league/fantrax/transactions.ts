import type { LeagueTransaction, TransactionKind, TransactionView } from "../types";

// `getTransactionDetailsHistory` → our own transaction rows.
//
// This is a READ, not a derivation. Diffing consecutive captures does find
// pickups and trades — it found the first real ones unaided — but it cannot name
// a transaction type, cannot see two moves made the same day, and cannot tell a
// trade from a commissioner override. This surface does all three, timestamps
// them to the minute, and needs no cookie.
//
// Two things about the payload drive every decision below, both learned from the
// live response rather than guessed:
//
//  1. Cells carry a `key`. Bind to it and never to the column heading — the
//     gameweek column's heading arrives as the literal string
//     "{0} on which this transaction takes effect", an unsubstituted i18n
//     placeholder shipped to production. A parser reading English headers is
//     reading text Fantrax itself cannot render.
//
//  2. Cells span rows. The two halves of a trade share one date cell carrying
//     `rowspan: 2`, and the second row simply omits it — a DROP row arrives with
//     nothing but its gameweek and inherits team and date from the CLAIM above
//     it. Read row-by-row without carrying spans forward and half of every
//     transaction loses its team and its timestamp.

/** A table cell. `content` is display text; `teamId` appears on team cells and
 *  is the only trustworthy team identifier, since the content is a team NAME and
 *  managers rename teams. */
interface RawTxCell {
  key?: string;
  content?: string;
  teamId?: string;
  rowspan?: number;
}

/** The player. `scorerId` is Fantrax's player id — the same id space as the
 *  roster payloads and the pool, so this joins to our bridge with no matching. */
interface RawTxScorer {
  scorerId?: string;
  name?: string;
  posShortNames?: string;
  teamShortName?: string;
}

interface RawTxRow {
  cells?: RawTxCell[];
  scorer?: RawTxScorer;
  /** `CLAIM` or `DROP` on the claim/drop view. Absent on trades, where the view
   *  itself is the transaction type. */
  transactionCode?: string;
  /** Groups both halves of a trade, or a claim with the drop that paid for it. */
  txSetId?: string;
  executed?: boolean;
}

export interface RawTransactionHistory {
  table?: {
    caption?: string;
    rows?: RawTxRow[];
    /** Column headings. Read only to find the date column's own label — never to
     *  identify a column, which is what `cell.key` is for. */
    header?: { cells?: { key?: string; name?: string; shortName?: string }[] };
  };
  paginatedResultSet?: { totalNumResults?: number; totalNumPages?: number };
}

/** Fantrax's own label for the date column, e.g. "Date (EDT)", or null.
 *
 *  The timezone is the point. `processedAt` is a bare "Wed Aug 12, 2026, 9:14AM"
 *  with no offset in it, so a British reader takes it for British time and is
 *  four hours out. Fantrax states the zone in the heading and nowhere else, so
 *  this hands their words through verbatim rather than converting — which would
 *  mean mapping an abbreviation to an offset and asserting a fact about somebody
 *  else's clock.
 *
 *  Found by `key`, as every other read here is; only the label itself is text. */
export function transactionDateLabel(raw: RawTransactionHistory): string | null {
  const cell = raw.table?.header?.cells?.find((header) => header.key === "date");
  return cell?.shortName ?? cell?.name ?? null;
}

/** Resolve a row's cells, inheriting any a previous row is still spanning.
 *
 *  Returns a fresh map per row so a caller cannot accidentally mutate the
 *  carried state, and updates `carried` in place for the rows still to come. */
function cellsFor(
  row: RawTxRow,
  carried: Map<string, { cell: RawTxCell; rowsLeft: number }>,
): Map<string, RawTxCell> {
  const own = new Map<string, RawTxCell>();
  for (const cell of row.cells ?? []) {
    if (cell.key) own.set(cell.key, cell);
  }

  // A cell the row states itself always wins over an inherited one: on the trade
  // view both rows carry their own `from` and `to` while sharing one date.
  for (const [key, held] of carried) {
    if (!own.has(key)) own.set(key, held.cell);
  }

  for (const [key, held] of carried) {
    held.rowsLeft -= 1;
    if (held.rowsLeft <= 0) carried.delete(key);
  }

  for (const cell of row.cells ?? []) {
    const span = cell.rowspan ?? 1;
    if (cell.key && span > 1) carried.set(cell.key, { cell, rowsLeft: span - 1 });
  }

  return own;
}

function kindOf(view: TransactionView, code: string | undefined): TransactionKind {
  if (view === "TRADE") return "trade";
  if (view === "LINEUP_CHANGE") return "lineup";
  if (code === "CLAIM") return "claim";
  if (code === "DROP") return "drop";
  return "unknown";
}

/** Which team the player left and which he joined.
 *
 *  A trade names both sides explicitly. A claim or a drop names one team and the
 *  direction comes from the kind: a claim brings a player IN from the pool, a
 *  drop sends him OUT of one. Null on the other side is the honest answer —
 *  the free-agent pool is not a team and giving it a placeholder id would put a
 *  fake team in the feed. */
function movement(
  kind: TransactionKind,
  cells: Map<string, RawTxCell>,
): { fromTeamId: string | null; toTeamId: string | null } {
  const from = cells.get("from")?.teamId ?? null;
  const to = cells.get("to")?.teamId ?? null;
  if (from !== null || to !== null) return { fromTeamId: from, toTeamId: to };

  const team = cells.get("team")?.teamId ?? null;
  if (kind === "claim") return { fromTeamId: null, toTeamId: team };
  if (kind === "drop") return { fromTeamId: team, toTeamId: null };
  return { fromTeamId: null, toTeamId: null };
}

function periodOf(cells: Map<string, RawTxCell>): number | null {
  const raw = cells.get("week")?.content;
  if (raw === undefined) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

/** One row per player per transaction, in the order Fantrax returned them.
 *
 *  `view` is required because it is genuinely part of the answer: trade rows
 *  carry no `transactionCode`, so on that view the tab IS the type. The legal
 *  values come from `displayedLists.tabs` in the same response — server-driven,
 *  never hardcoded (§3).
 *
 *  Rows Fantrax sends without a player id are skipped rather than half-mapped: a
 *  transaction we cannot attribute to a player is not something to render. */
export function mapTransactions(
  raw: RawTransactionHistory,
  view: TransactionView,
): LeagueTransaction[] {
  const rows = raw.table?.rows;
  if (!rows) return [];

  const carried = new Map<string, { cell: RawTxCell; rowsLeft: number }>();
  const transactions: LeagueTransaction[] = [];

  for (const row of rows) {
    // Resolved for every row, including skipped ones: spans are positional, and
    // a row that drops out still consumes the rows a cell above it covers.
    const cells = cellsFor(row, carried);

    const fantraxId = row.scorer?.scorerId;
    if (!fantraxId) continue;

    const kind = kindOf(view, row.transactionCode);
    transactions.push({
      setId: row.txSetId ?? "",
      kind,
      fantraxId,
      playerName: row.scorer?.name ?? "",
      // Their spelling, untouched: "D", or "F,M" for a man eligible at two.
      position: row.scorer?.posShortNames ?? null,
      ...movement(kind, cells),
      // Verbatim, e.g. "Wed Aug 12, 2026, 9:14AM". Left unparsed for the same
      // reason the standings record is: the string carries no offset, the header
      // says EDT elsewhere, and turning it into an instant would mean assuming a
      // timezone and a format on data we do not control.
      processedAt: cells.get("date")?.content ?? null,
      period: periodOf(cells),
      executed: row.executed === true,
    });
  }

  return transactions;
}
