import { byKickoffUndatedFirst } from "../../football/selectors";
import type { Club, Fixture } from "../../football/types";
import { londonDayOf } from "../../time";
import { fullClubName } from "../clubNames";

// A club's next match after the report's day, for the sidebar.

export interface NextMatch {
  opponent: string;
  home: boolean;
}

/** The first match after `day` against a club we can name; null when there is none. */
export function nextMatch(season: readonly Fixture[], clubs: readonly Club[], clubCode: number, day: string): NextMatch | null {
  const club = clubs.find((c) => c.code === clubCode);
  if (club === undefined) return null;
  const byId = new Map(clubs.map((c) => [c.id, c]));
  const upcoming = season.filter((f) => (f.homeClubId === club.id || f.awayClubId === club.id) && (londonDayOf(f.kickoff) ?? "") > day).sort(byKickoffUndatedFirst);
  for (const f of upcoming) {
    const home = f.homeClubId === club.id;
    const opponent = byId.get(home ? f.awayClubId : f.homeClubId);
    if (opponent !== undefined) return { opponent: fullClubName(opponent.name), home };
  }
  return null;
}
