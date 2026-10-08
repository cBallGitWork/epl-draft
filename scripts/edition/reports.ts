import { buildReportsBrief, deskDay, onLondonDay, type Assignment, type FootballSnapshot, type MatchDesk } from "@epl/core";
import type { DeskFacts } from "./facts";
import { matchdayInput } from "./matchday";
import type { Say } from "./newsroom";

// The reads behind each match-day report a firing commissions, made only when one is assigned (a dozen requests a day).

export interface ReportsJob {
  day: string;
  gameweek: number;
  desks: MatchDesk[];
  brief: string;
}

export async function reportsDesk(input: {
  assignments: readonly Assignment[];
  snapshot: FootballSnapshot;
  facts: DeskFacts;
  gameweeks: readonly number[];
  say: Say;
}): Promise<Map<string, ReportsJob>> {
  const jobs = new Map<string, ReportsJob>();
  for (const assignment of input.assignments) {
    if (assignment.kind !== "match-report" || assignment.day === undefined) continue;
    const day = assignment.day;
    const read = await matchdayInput({
      snapshot: input.snapshot,
      facts: input.facts,
      periodGameweeks: input.gameweeks,
      pick: (fixture) => onLondonDay(fixture.kickoff, day),
      say: input.say,
    });
    if (read === null || read.matches.length === 0) {
      input.say(`  reports: nothing readable for ${day}`);
      continue;
    }
    const desks = deskDay(read);
    jobs.set(day, { day, gameweek: read.gameweek, desks, brief: buildReportsBrief(day, read.gameweek, desks) });
  }
  return jobs;
}
