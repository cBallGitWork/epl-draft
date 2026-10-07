import type { LeagueTransaction, TransactionKind, TransactionView } from "../types";

// `getTransactionDetailsHistory` → our transaction rows, typed and timed to the minute, with no cookie.
// Cells bind by `key`, never heading (one heading is the raw "{0} on which…"). Cells span rows: a DROP row inherits
// team and date from the CLAIM above, so reading without carrying spans loses half of every transaction.

/** A table cell; on team cells `teamId` is the only trustworthy id, as `content` is a NAME and managers rename teams. */
interface RawTxCell {
  key?: string;
  content?: string;
  teamId?: string;
  rowspan?: number;
}

/** The player; `scorerId` is the roster and pool id, so it joins the bridge with no matching. */
interface RawTxScorer {
  scorerId?: string;
  name?: string;
  posShortNames?: string;
  teamShortName?: string;
  /** His club in full, "Sunderland". */
  teamName?: string;
}

interface RawTxRow {
  cells?: RawTxCell[];
  scorer?: RawTxScorer;
  /** `CLAIM` or `DROP` on the claim/drop view; absent on trades, where the view is the type. */
  transactionCode?: string;
  /** Groups both halves of a trade, or a claim with the drop that paid for it. */
  txSetId?: string;
  /** How a claim was made: `WW` off waivers, `FA` a free agent, "" on a drop. */
  claimType?: string;
  executed?: boolean;
  /** `EXECUTED`, `TRADE_CANCELLED`, `TRADE_REJECTED`: how a proposal ended, read with `executedOnly: false`. */
  resultCode?: string;
}

export interface RawTransactionHistory {
  table?: {
    caption?: string;
    /** The date column's `name` carries the zone its stamps are in: "Date Processed (EDT)". */
    header?: { cells?: { key?: string; name?: string }[] };
    rows?: RawTxRow[];
  };
  paginatedResultSet?: { totalNumResults?: number; totalNumPages?: number };
}

/** A row's cells, inheriting any a previous row still spans: a fresh map per row, with `carried` updated in place. */
function cellsFor(
  row: RawTxRow,
  carried: Map<string, { cell: RawTxCell; rowsLeft: number }>,
): Map<string, RawTxCell> {
  const own = new Map<string, RawTxCell>();
  for (const cell of row.cells ?? []) {
    if (cell.key) own.set(cell.key, cell);
  }

  // A cell the row states wins over an inherited one: trade rows carry their own `from` and `to` but share a date.
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

/** Which team he left and joined: a trade names both, a claim brings him in, a drop sends him out; the pool is null. */
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

/** Fantrax's claim types, in words. */
const VIA: Readonly<Record<string, "waivers" | "free agency">> = { WW: "waivers", FA: "free agency" };

/** One row per player per transaction, in Fantrax's order; rows with no player id are skipped.
 *  `view` is part of the answer, as trade rows carry no `transactionCode`; its values come from `displayedLists.tabs`. */
export function mapTransactions(
  raw: RawTransactionHistory,
  view: TransactionView,
): LeagueTransaction[] {
  const rows = raw.table?.rows;
  if (!rows) return [];

  const carried = new Map<string, { cell: RawTxCell; rowsLeft: number }>();
  const transactions: LeagueTransaction[] = [];

  for (const row of rows) {
    // Resolved for every row, skipped ones too: a span covers rows by position.
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
      club: row.scorer?.teamShortName ?? null,
      clubName: row.scorer?.teamName ?? null,
      via: VIA[row.claimType ?? ""] ?? null,
      ...movement(kind, cells),
      // Verbatim, e.g. "Wed Aug 12, 2026, 9:14AM": US Eastern, with no offset in it.
      processedAt: cells.get("date")?.content ?? null,
      period: periodOf(cells),
      executed: row.executed === true,
      resultCode: row.resultCode ?? null,
    });
  }

  return transactions;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** A sortable key for "Wed Aug 12, 2026, 9:14AM", in their own calendar; null if it does not read.
 *  The stamp's second parser, beside `inbox/when.ts`'s instant: two, so not yet shared. */
export function orderKey(processedAt: string | null): number | null {
  const parts = /([a-z]{3})[a-z]* (\d{1,2}), (\d{4}), (\d{1,2}):(\d{2})\s*([ap])m/i.exec(
    processedAt ?? "",
  );
  if (!parts) return null;

  // Defaults only satisfy the type checker: a match supplies all six groups.
  const [, month = "", day = "", year = "", hour = "", minute = "", meridiem = ""] = parts;
  const monthIndex = MONTHS.indexOf(month.toLowerCase());
  if (monthIndex < 0) return null;

  // 12AM is hour zero and 12PM is hour twelve; every other PM hour adds twelve.
  const hours = (Number(hour) % 12) + (meridiem.toLowerCase() === "p" ? 12 : 0);
  const days = (Number(year) * 12 + monthIndex) * 32 + Number(day);
  return (days * 24 + hours) * 60 + Number(minute);
}

/** The zones Fantrax names in a date column's head, which follow the reader's account. */
const STAMP_ZONES: Readonly<Record<string, string>> = {
  EDT: "America/New_York",
  EST: "America/New_York",
  BST: "Europe/London",
  GMT: "Europe/London",
};

/** The zone a log's stamps are in, off its date column's head; null for one this table does not know. */
export function stampZone(raw: RawTransactionHistory): string | null {
  const head = raw.table?.header?.cells?.find((cell) => cell.key === "date")?.name ?? "";
  const abbreviation = /\(([A-Z]{2,5})\)/.exec(head)?.[1];
  return abbreviation === undefined ? null : (STAMP_ZONES[abbreviation] ?? null);
}
