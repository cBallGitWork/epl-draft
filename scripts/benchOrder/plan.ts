import {
  BENCH_ORDER_LEAD_MINUTES,
  LEAGUE_TIMEZONE,
  MS_PER_DAY,
  MS_PER_MINUTE,
  benchByPoints,
  benchOrderMap,
  londonDay,
  mapLineupState,
  numberedOrder,
  wallClockInstant,
  type RawTeamRosterInfo,
} from "@epl/core";

// The deadline job's decisions, pure: when to write, and what each team's bench gets. `run.ts` does the waiting and I/O.

/** London wall clock past which today's run leaves a lock to tomorrow's: `install-intel-jobs.sh` starts it at 07:00. */
export const HORIZON = "08:00";

export type Moment =
  /** No period ahead has a lock: the season is over, or FPL has dated nothing. */
  | { kind: "no-lock" }
  | { kind: "locked"; lock: string }
  /** The lock is after tomorrow's 08:00: the next morning's run has it. */
  | { kind: "not-due"; lock: string }
  | { kind: "wait"; lock: string; ms: number }
  | { kind: "now"; lock: string };

/** The next London day's 08:00 after `now`, as an instant. */
export function horizonAfter(now: number): number {
  const tomorrow = londonDay(new Date(now + MS_PER_DAY));
  return wallClockInstant(Date.parse(`${tomorrow}T${HORIZON}:00Z`), LEAGUE_TIMEZONE);
}

/** Where `now` stands against a lock: the write goes `BENCH_ORDER_LEAD_MINUTES` before it, and never at or after it. */
export function momentOf(lock: string | null, now: number): Moment {
  const at = lock === null ? NaN : Date.parse(lock);
  if (lock === null || Number.isNaN(at)) return { kind: "no-lock" };
  if (now >= at) return { kind: "locked", lock };
  if (at > horizonAfter(now)) return { kind: "not-due", lock };
  const writeAt = at - BENCH_ORDER_LEAD_MINUTES * MS_PER_MINUTE;
  return now < writeAt ? { kind: "wait", lock, ms: writeAt - now } : { kind: "now", lock };
}

export type TeamPlan =
  /** The manager numbered any of his bench, or this job already did: never touched. */
  | { kind: "numbered"; order: string[] }
  | { kind: "no-bench" }
  /** Fantrax filed the roster under another period, or in a shape we do not know: never written. */
  | { kind: "unread"; period: number | null }
  | { kind: "write"; order: string[]; map: Record<string, number> };

/** One team's roster page for `period`, and what its bench gets. */
export function teamPlan(raw: unknown, period: number): TeamPlan {
  const state = mapLineupState(raw);
  if (state === null || state.period !== period) return { kind: "unread", period: state?.period ?? null };
  const numbered = numberedOrder(state.autoSubOrder);
  if (numbered.length > 0) return { kind: "numbered", order: numbered };
  const order = benchByPoints(raw as RawTeamRosterInfo);
  return order.length === 0 ? { kind: "no-bench" } : { kind: "write", order, map: benchOrderMap(order, state.autoSubOrder) };
}

/** Each man on a roster page as "Name (FPts)", for the run's log; an unread name is his id, an unread total `—`. */
export function labelsOf(raw: unknown): Map<string, string> {
  const labels = new Map<string, string>();
  for (const table of (raw as RawTeamRosterInfo).tables ?? []) {
    const at = (table.header?.cells ?? []).findIndex((c) => c.key === "fpts");
    for (const row of table.rows ?? []) {
      const id = row.scorer?.scorerId;
      if (typeof id !== "string") continue;
      const fpts = at < 0 ? "" : (row.cells?.[at]?.content ?? "").trim();
      labels.set(id, `${row.scorer?.shortName ?? id} (${fpts === "" ? "—" : fpts})`);
    }
  }
  return labels;
}
