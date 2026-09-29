import { londonDayOf } from "../../time";
import type { Fixture } from "../../football/types";
import type { Cutoff } from "./brief";

// When each draft report is due: Saturday's once every match on the gameweek's Saturday is settled, the round's once
// every match of the gameweek is. Keyed so the ledger files each once.

export interface DraftReportDue {
  cutoff: Cutoff;
  key: string;
  slug: string;
}

const isSaturday = (day: string) => new Date(`${day}T12:00:00Z`).getUTCDay() === 6;

export function draftReportsDue(fixtures: readonly Fixture[], gameweek: number): DraftReportDue[] {
  const round = fixtures.filter((f) => f.gameweek === gameweek && f.kickoff !== null);
  if (round.length === 0) return [];
  const day = (f: Fixture) => londonDayOf(f.kickoff!) ?? "";
  const saturday = round.filter((f) => isSaturday(day(f)));
  const later = round.some((f) => day(f) > (saturday[0] === undefined ? "" : day(saturday[0])));
  const due = (cutoff: Cutoff) => ({ cutoff, key: `draft-report:gw${gameweek}:${cutoff}`, slug: `gw${gameweek}-draft-report-${cutoff === "saturday" ? "saturday" : "round"}` });
  const out: DraftReportDue[] = [];
  // A Saturday report is worth filing only when there is football after it.
  if (saturday.length > 0 && later && saturday.every((f) => f.settled)) out.push(due("saturday"));
  if (round.every((f) => f.settled)) out.push(due("week"));
  return out;
}
