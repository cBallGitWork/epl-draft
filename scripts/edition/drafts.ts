import type { Assignment, Cutoff } from "@epl/core";
import { draftDesk } from "./draftDesk";
import type { DraftJob } from "./draftWriter";

// The reads behind each draft report a firing commissions, made only when one is assigned: one gameweek's reads serve
// both cut-offs.

export async function draftsDesk(input: { assignments: readonly Assignment[]; gameweek: number; say: (message: string) => void }): Promise<Map<Cutoff, DraftJob>> {
  const jobs = new Map<Cutoff, DraftJob>();
  const wanted = input.assignments.filter((a) => a.kind === "draft-report" && a.cutoff !== undefined);
  if (wanted.length === 0) return jobs;
  const desk = await draftDesk(input.gameweek);
  for (const a of wanted) {
    const contexts = desk.cutoffs.get(a.cutoff!);
    if (contexts === undefined || contexts.length === 0) {
      input.say(`  draft report: nothing due for ${a.cutoff} in gameweek ${input.gameweek}`);
      continue;
    }
    jobs.set(a.cutoff!, { cutoff: a.cutoff!, gameweek: input.gameweek, contexts, rankAfter: desk.rankAfter, pastHeadlines: desk.pastHeadlines.get(a.cutoff!) ?? [] });
  }
  return jobs;
}
