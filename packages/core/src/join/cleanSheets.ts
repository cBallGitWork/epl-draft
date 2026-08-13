import { CLEAN_SHEET_MINUTES } from "../config";
import { isActive } from "../league/rosterStatus";
import { categoryPoints } from "../league/scoring";
import type { ScoringRules } from "../league/scoring";
import { isResolved } from "./roster";
import type { RosteredTeam } from "./roster";

// The one number Fantrax's live feed will not give us.
//
// Their totals move during a match — verified with Craig on 13 Aug — with a
// single exception: a clean sheet is not credited until the final whistle, so a
// defender who has kept one for eighty minutes is still showing nothing while
// FPL has been showing the points since the hour mark. That gap is the whole
// reason this file exists, and it is the only scoring the app does.
//
// It is a preview, not a score. Fantrax settles clean sheets on their own terms
// at full time, and the moment they do, the points appear in their total and
// disappear from here — which is why only fixtures actually in play are counted.
// Counting a finished one would show it twice.

/** The clean-sheet category's short name in Fantrax's own scoring table. */
const CLEAN_SHEET = "CS";

/** What a squad stands to gain when the whistles go, and from how many players. */
export interface PendingCleanSheets {
  points: number;
  players: number;
}

export function pendingCleanSheets(
  team: RosteredTeam,
  rules: ScoringRules,
  /** Fixtures currently in play. A clean sheet in a finished match is Fantrax's
   *  to award and is already in their total. */
  inPlay: ReadonlySet<number>,
): PendingCleanSheets {
  let points = 0;
  let players = 0;

  for (const rostered of team.players) {
    // Reserves do not score, so they cannot be owed anything.
    if (!isResolved(rostered) || !isActive(rostered.slot)) continue;
    if (rostered.slot.position === null) continue;

    const worth = categoryPoints(rules, CLEAN_SHEET, rostered.slot.position);
    // Null is a position this league does not price, not a free one. Zero is a
    // forward, who is correctly owed nothing and correctly not counted.
    if (worth === null || worth === 0) continue;

    if (!keepingOne(rostered.stats, inPlay)) continue;
    points += worth;
    players += 1;
  }

  return { points, players };
}

/** Whether this player is, right now, on a clean sheet worth previewing.
 *
 *  The hour mark is FPL's rule rather than Fantrax's — Fantrax says only "on
 *  field" and does not publish a threshold — and it is what a manager watching
 *  the match already expects, because it is when FPL's own numbers move.
 *
 *  A double gameweek yields a row per fixture; any one of them in play with a
 *  clean sheet is a clean sheet being kept. */
function keepingOne(
  stats: readonly { fixtureId: number; minutes: number; goalsConceded: number }[],
  inPlay: ReadonlySet<number>,
): boolean {
  return stats.some(
    (stat) =>
      inPlay.has(stat.fixtureId) &&
      stat.minutes >= CLEAN_SHEET_MINUTES &&
      stat.goalsConceded === 0,
  );
}
