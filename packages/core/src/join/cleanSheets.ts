import { CLEAN_SHEET_MINUTES } from "../config";
import { isActive } from "../league/rosterStatus";
import { CLEAN_SHEET, categoryPoints } from "../league/scoring";
import type { ScoringRules } from "../league/scoring";
import { isResolved } from "./roster";
import type { RosteredTeam } from "./roster";

// A preview of the clean sheets Fantrax credits only at full time. Fixtures in play only: a finished one is in their total.

/** What a squad stands to gain when the whistles go, and from how many players. */
export interface PendingCleanSheets {
  points: number;
  players: number;
}

export function pendingCleanSheets(
  team: RosteredTeam,
  rules: ScoringRules,
  /** Fixtures currently in play. */
  inPlay: ReadonlySet<number>,
): PendingCleanSheets {
  let points = 0;
  let players = 0;

  for (const rostered of team.players) {
    // Reserves do not score, so they cannot be owed anything.
    if (!isResolved(rostered) || !isActive(rostered.slot)) continue;
    if (rostered.slot.position === null) continue;

    const worth = categoryPoints(rules, CLEAN_SHEET, rostered.slot.position);
    // Null is a position this league does not price; zero, a forward, is owed nothing.
    if (worth === null || worth === 0) continue;

    if (!keepingOne(rostered.stats, inPlay)) continue;
    points += worth;
    players += 1;
  }

  return { points, players };
}

/** Whether he is keeping a clean sheet past the hour in any fixture in play, by FPL's own flag: never
 *  `goalsConceded === 0`, which reads zero for a man who conceded one on a double. */
function keepingOne(
  stats: readonly { fixtureId: number; minutes: number; cleanSheet: boolean }[],
  inPlay: ReadonlySet<number>,
): boolean {
  return stats.some(
    (stat) => inPlay.has(stat.fixtureId) && stat.cleanSheet && stat.minutes >= CLEAN_SHEET_MINUTES,
  );
}
