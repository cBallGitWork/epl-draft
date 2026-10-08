import { hasRoom, type Assignment, type Ledger } from "@epl/core";
import type { Say } from "./newsroom";
import type { Filing } from "./persist";

// One firing's loop: the newsdesk's running order, commissioned one assignment at a time and each
// filing saved before the next, so a firing killed mid-run keeps every story it paid for.

/** One assignment's end: a filing, null when nothing was filed or spent, or a model call that failed. */
export type Outcome = Filing | "failed" | null;

export interface Run {
  /** Stories a firing may FILE: a refusal spends nothing and takes no place (`hasRoom`). */
  cap: number;
  /** Once `elapsed()` reaches this, nothing new is commissioned and the firing ends with what it filed. */
  budgetMs: number;
  elapsed: () => number;
  commission: (assignment: Assignment, earlier: readonly Filing[]) => Promise<Outcome>;
  /** Saves the newest of `filings` and answers the ledger with its keys spent. */
  save: (filings: readonly Filing[], ledger: Ledger) => Ledger;
  say: Say;
}

export async function fire(
  assignments: readonly Assignment[],
  ledger: Ledger,
  run: Run,
): Promise<{ filings: Filing[]; failed: number }> {
  const filings: Filing[] = [];
  let failed = 0;
  let book = ledger;
  for (const assignment of assignments) {
    if (!hasRoom(filings.length, run.cap)) break;
    if (run.elapsed() >= run.budgetMs) {
      run.say(`Out of time with ${filings.length} filed; the rest wait for the next firing.`);
      break;
    }
    const outcome = await run.commission(assignment, filings);
    if (outcome === "failed") failed += 1;
    else if (outcome !== null) {
      filings.push(outcome);
      book = run.save(filings, book);
    }
  }
  return { filings, failed };
}
