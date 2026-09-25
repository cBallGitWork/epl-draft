import { hasRoom, type Assignment } from "@epl/core";
import type { Filing } from "./persist";

// One firing's loop: the newsdesk's running order, commissioned one assignment at a time.

/** One assignment's end: a filing, null when nothing was filed or spent, or a model call that failed. */
export type Outcome = Filing | "failed" | null;

export interface Run {
  /** Stories a firing may FILE: a refusal spends nothing and takes no place (`hasRoom`). */
  cap: number;
  commission: (assignment: Assignment, earlier: readonly Filing[]) => Promise<Outcome>;
}

export async function fire(assignments: readonly Assignment[], run: Run): Promise<{ filings: Filing[]; failed: number }> {
  const filings: Filing[] = [];
  let failed = 0;
  for (const assignment of assignments) {
    if (!hasRoom(filings.length, run.cap)) break;
    const outcome = await run.commission(assignment, filings);
    if (outcome === "failed") failed += 1;
    else if (outcome !== null) filings.push(outcome);
  }
  return { filings, failed };
}
