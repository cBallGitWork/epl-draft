import type { Fixture } from "../../football/types";
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
  const days = new Map<string, Fixture[]>();
  for (const fixture of fixtures) {
    const day = fixture.gameweek === gameweek ? londonDayOf(fixture.kickoff) : null;
    if (day !== null) days.set(day, [...(days.get(day) ?? []), fixture]);
  }
  return [...days]
    .filter(([, matches]) => matches.every((f) => f.settled))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day]) => ({ key: `match-report:gw${gameweek}:${day}`, slug: `gw${gameweek}-prem-report-${day}`, day }));
}
