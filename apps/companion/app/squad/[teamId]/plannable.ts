import type { Round } from "../../round";

/** Whether the planner may open on `shown`: only the open week, the one whose lineups have not locked. */
export function plannable(shown: Round | null, open: Round | null): boolean {
  return shown !== null && open !== null && shown.period === open.period;
}
