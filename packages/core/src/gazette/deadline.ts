import type { LeaguePeriod } from "../league/types";
import type { Deadline } from "./types";

// When lineups lock next.
//
// Read from `rosterPeriods`, which is the lineup calendar, never from
// `scoringPeriods` and never from FPL's `deadline_time`. FPL's deadline is FPL's
// house rule; ours is a commissioner setting, and the two are ninety minutes
// apart on a normal weekend — printing the wrong one in a newspaper is how a
// manager misses a deadline believing he had an hour left.
//
// The commissioner sets ours fifteen minutes before the period's first fixture,
// and `getLeagueInfo` does not publish that offset — the period boundary it does
// publish is kickoff. So this reports the boundary and the app says which it is,
// rather than subtracting a number nobody sent us.

export function nextDeadline(periods: readonly LeaguePeriod[], nowIso: string): Deadline | null {
  const now = Date.parse(nowIso);
  if (Number.isNaN(now)) return null;

  // Instants, never strings: the league's bounds carry -0400 and ours carry Z.
  const upcoming = periods
    .map((period) => ({ period: period.number, at: period.start, on: Date.parse(period.start) }))
    .filter((period) => Number.isFinite(period.on) && period.on > now)
    .sort((a, b) => a.on - b.on)[0];

  return upcoming ? { period: upcoming.period, at: upcoming.at } : null;
}
