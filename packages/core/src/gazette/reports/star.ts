import { didOf, sidebarClub } from "./fantasy";
import { surname } from "./keyStats";
import { played } from "./men";
import { isGoal, type MatchEvent } from "./timeline";
import type { ReportMatchInput } from "./types";

// The Star man: the best mark of everyone who played, held or not, as a paper names one under its ratings. Ties go to the
// man with more league points, then more minutes. None when nobody was rated.

export interface StarMan {
  name: string;
  club: string;
  holder: string | null;
  mark: number;
  /** "3 goals"; empty when he did neither. */
  did: string;
}

export function starMan(match: ReportMatchInput, events: readonly MatchEvent[]): StarMan | null {
  const rated = match.men.flatMap((m) => {
    const mark = match.marks.get(m.code);
    return played(m) && mark != null ? [{ m, mark }] : [];
  });
  rated.sort((a, b) => b.mark - a.mark || (b.m.points ?? 0) - (a.m.points ?? 0) || b.m.minutes - a.m.minutes);
  const best = rated[0];
  if (best === undefined) return null;
  return {
    name: surname(best.m.name),
    club: sidebarClub(match, best.m),
    holder: best.m.holder?.team ?? null,
    mark: best.mark,
    did: didOf(events.filter(isGoal), best.m.code),
  };
}
