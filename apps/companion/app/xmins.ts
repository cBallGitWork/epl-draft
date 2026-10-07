import { type MinutesRun, NO_MINUTES, minutesAhead } from "@epl/core";
import { XMINS_WEEKS } from "./config";
import { intelMinutes, intelMinutesManifest } from "./intel";

// A screen's xMins, from the gameweek it shows: a list prints the first week, a player card the run.

/** Each man's run from `gameweek`; none for a week the export starts after, which would be a column of dashes. */
export function minutesFrom(gameweek: number | null): MinutesRun {
  const first = intelMinutesManifest.gameweek;
  if (gameweek === null || (first !== null && gameweek < first)) return NO_MINUTES;
  return (code) => minutesAhead(code === null ? undefined : intelMinutes.get(code), gameweek, XMINS_WEEKS);
}

/** One gameweek's xMins for these men by FPL code, or null for a week the export does not cover. */
export function weekMinutes(gameweek: number | null, codes: readonly number[]): ReadonlyMap<number, number | null> | null {
  const run = minutesFrom(gameweek);
  if (run === NO_MINUTES) return null;
  return new Map(codes.map((code) => [code, run(code)[0]?.minutes ?? null]));
}
