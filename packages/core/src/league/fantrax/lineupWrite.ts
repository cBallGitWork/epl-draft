import type { RosterSlot } from "../types";

// A planned lineup as Fantrax's write wants it, and Fantrax's answers read back. Pure: the I/O is
// `lineupClient.ts`. Every id comes off the team's own roster read, never a constant.

/** One man as `getTeamRosterInfo` files him. */
export interface RosterRow {
  scorerId: string;
  posId: string;
  statusId: string;
  /** His eligible positions: short name to Fantrax's id, zipped from his own row. */
  positions: ReadonlyMap<string, string>;
}

export interface LineupState {
  period: number | null;
  rows: RosterRow[];
  /** `ACTIVE` / `RESERVE` to Fantrax's status id, off `statusTotals`. */
  statusIds: ReadonlyMap<string, string>;
  applyToFuturePeriods: boolean;
  autoSubOrder: Readonly<Record<string, number>>;
}

export type FieldMap = Record<string, { posId: string; stId: string }>;

/** Why a plan cannot be turned into a write. */
type PlanRefusal = "squad-changed" | "unknown-status" | "not-eligible";

export type WriteAnswer = { ok: true } | { ok: false; messages: string[] };

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];

function rowOf(raw: unknown): RosterRow | null {
  const row = record(raw);
  const scorer = record(row.scorer);
  if (row.secondary || typeof scorer.scorerId !== "string") return null;
  if (typeof row.posId !== "string" || typeof row.statusId !== "string") return null;
  const ids = strings(scorer.posIds);
  const names = typeof scorer.posShortNames === "string" ? scorer.posShortNames.split(",") : [];
  if (ids.length !== names.length) return null;
  return {
    scorerId: scorer.scorerId,
    posId: row.posId,
    statusId: row.statusId,
    positions: new Map(ids.map((id, i) => [names[i]?.trim() ?? "", id])),
  };
}

/** `getTeamRosterInfo` as the save needs it, or null when the shape is not one we know. */
export function mapLineupState(raw: unknown): LineupState | null {
  const data = record(raw);
  const misc = record(data.miscData);
  const tables = Array.isArray(data.tables) ? data.tables : [];
  const rows = tables.flatMap((table) => {
    const found = record(table).rows;
    return Array.isArray(found) ? found.flatMap((row) => rowOf(row) ?? []) : [];
  });
  const totals = Array.isArray(misc.statusTotals) ? misc.statusTotals.map(record) : [];
  const statusIds = new Map(
    totals.flatMap((t) =>
      typeof t.name === "string" && typeof t.id === "string" ? [[t.name.toUpperCase(), t.id] as const] : [],
    ),
  );
  if (rows.length === 0 || statusIds.size === 0) return null;
  const period = Number(record(data.displayedSelections).displayedPeriod);
  const order = record(misc.autoSubOrderMap);
  return {
    period: Number.isInteger(period) ? period : null,
    rows,
    statusIds,
    applyToFuturePeriods: misc.applyToFuturePeriods === true,
    autoSubOrder: Object.fromEntries(
      Object.entries(order).filter((entry): entry is [string, number] => typeof entry[1] === "number"),
    ),
  };
}

/** Every rostered man's `{posId, stId}` under the plan, or why it cannot be sent. */
export function fieldMapFor(roster: LineupState, plan: readonly RosterSlot[]): FieldMap | PlanRefusal {
  const planned = new Map(plan.map((slot) => [slot.fantraxId, slot]));
  if (planned.size !== roster.rows.length || roster.rows.some((row) => !planned.has(row.scorerId))) {
    return "squad-changed";
  }
  const map: FieldMap = {};
  for (const row of roster.rows) {
    const slot = planned.get(row.scorerId);
    if (slot === undefined) return "squad-changed";
    const stId = roster.statusIds.get(slot.status.toUpperCase());
    if (stId === undefined) return "unknown-status";
    const posId = slot.position === null ? undefined : row.positions.get(slot.position);
    if (posId === undefined) return "not-eligible";
    map[row.scorerId] = { posId, stId };
  }
  return map;
}

/** Whether the plan moves anybody from where Fantrax has him. */
export function changesLineup(roster: LineupState, map: FieldMap): boolean {
  return roster.rows.some((row) => map[row.scorerId]?.posId !== row.posId || map[row.scorerId]?.stId !== row.statusId);
}

/** The bench in order, ranked from 1; a man Fantrax had ranked who is no longer on it goes to 0. */
export function benchOrderMap(bench: readonly string[], previous: Readonly<Record<string, number>>): Record<string, number> {
  const map: Record<string, number> = {};
  for (const id of Object.keys(previous)) if (!bench.includes(id)) map[id] = 0;
  bench.forEach((id, i) => (map[id] = i + 1));
  return map;
}

/** Whether the bench order differs from what Fantrax holds. */
export function changesBenchOrder(bench: readonly string[], previous: Readonly<Record<string, number>>): boolean {
  return bench.some((id, i) => previous[id] !== i + 1);
}

const plain = (text: string): string => text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

/** A lineup write's answer: legal and done (or legal on a dry run), or the messages that refused it. */
export function readLineupAnswer(raw: unknown): WriteAnswer {
  const data = record(raw);
  const response = record(data.fantasyResponse);
  const model = record(record(data.textArray).model);
  const illegal = [...strings(response.illegalRosterMsgs), ...strings(model.illegalRosterMsgs)].map(plain);
  if (response.msgType === "CONFIRM" && illegal.length === 0 && model.changeAllowed !== false) return { ok: true };
  const main = typeof response.mainMsg === "string" ? [plain(response.mainMsg)] : [];
  const messages = [...new Set([...illegal, ...main])].filter((m) => m !== "");
  return { ok: false, messages: messages.length > 0 ? messages : ["Fantrax did not accept the lineup."] };
}

/** `setAutoSubsOrder`'s answer. */
export function readBenchAnswer(raw: unknown): WriteAnswer {
  const data = record(raw);
  if (data.success === true) return { ok: true };
  const main = record(data.fantasyResponse).mainMsg;
  return { ok: false, messages: [typeof main === "string" ? plain(main) : "Fantrax did not accept the bench order."] };
}
