import type { Fixture } from "../../football/types";
import { groupedBy } from "../../grouped";
import { londonDayOf } from "../../time";

// When a match-day report is due: once every match that London day has settled (FPL has added the bonus, so the figures
// have stopped moving). One per day, keyed on the day; a day still being played files nothing and spends nothing.

export interface ReportDay {
  key: string;
  slug: string;
  /** London calendar day, `2026-09-19`. */
  day: string;
}

export function reportDays(fixtures: readonly Fixture[], gameweek: number): ReportDay[] {
  const days = groupedBy(fixtures.filter((fixture) => fixture.gameweek === gameweek), (fixture) => londonDayOf(fixture.kickoff));
  return [...days]
    .flatMap(([day, matches]) => (day !== null && matches.every((f) => f.settled) ? [day] : []))
    .sort((a, b) => a.localeCompare(b))
    .map((day) => ({ key: `match-report:gw${gameweek}:${day}`, slug: `gw${gameweek}-prem-report-${day}`, day }));
}
