import { londonDayOf } from "../../time";
import type { Fixture } from "../../football/types";
import type { Cutoff } from "./brief";

// When each draft report is due: Saturday's once every match on the gameweek's Saturday is settled, the gameweek's once
// every match of the gameweek is. Keyed so the ledger files each once.

export interface DraftReportDue {
  cutoff: Cutoff;
  key: string;
  slug: string;
  /** The London day the cut-off falls on, which names the edition: "Saturday Draft Report". */
  day: string;
}

/** A London date that falls on a Saturday. */
export const isSaturday = (day: string) => new Date(`${day}T12:00:00Z`).getUTCDay() === 6;

export function draftReportsDue(fixtures: readonly Fixture[], gameweek: number): DraftReportDue[] {
  const played = fixtures.filter((f) => f.gameweek === gameweek && f.kickoff !== null);
  if (played.length === 0) return [];
  const day = (f: Fixture) => londonDayOf(f.kickoff) ?? "";
  const saturday = played.filter((f) => isSaturday(day(f)));
  const later = played.some((f) => day(f) > (saturday[0] === undefined ? "" : day(saturday[0])));
  const last = played.map(day).sort().at(-1) ?? "";
  const due = (cutoff: Cutoff) => ({
    cutoff,
    key: `draft-report:gw${gameweek}:${cutoff}`,
    slug: cutoff === "saturday" ? `gw${gameweek}-draft-report-saturday` : `gw${gameweek}-draft-report`,
    day: cutoff === "saturday" ? day(saturday[0]) : last,
  });
  const out: DraftReportDue[] = [];
  // A Saturday report is worth filing only when there is football after it.
  if (saturday.length > 0 && later && saturday.every((f) => f.settled)) out.push(due("saturday"));
  if (played.every((f) => f.settled)) out.push(due("gameweek"));
  return out;
}
