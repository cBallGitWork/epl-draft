import type { Fixture, PlayerMatchStats } from "@epl/core";

// Whether a match day's ratings are whole: the men FPL says played it, against the men we marked.

/** Days a short day is asked again before it is recorded as it stands, so a man Fantrax never counts cannot hold it forever. */
export const RETRY_DAYS = 3;

const DAY_MS = 86_400_000;

/** The codes of the men a day owes a mark: FPL says they played one of its fixtures, the bridge knows them, and their
 *  club now is one of the sides (a man who has moved since has no opponent to be rated against). */
export function menOwed(
  on: readonly Fixture[],
  rows: readonly PlayerMatchStats[],
  players: readonly { id: number; code: number; clubId: number }[],
  bridged: ReadonlySet<number>,
): Set<number> {
  const byId = new Map(players.map((player) => [player.id, player]));
  const owed = new Set<number>();
  for (const row of rows) {
    const fixture = on.find((f) => f.id === row.fixtureId);
    const player = byId.get(row.playerId);
    if (fixture === undefined || player === undefined || row.minutes <= 0 || !bridged.has(player.code)) continue;
    if (player.clubId === fixture.homeClubId || player.clubId === fixture.awayClubId) owed.add(player.code);
  }
  return owed;
}

/** Whether to record a day as rated: every man it owes has his mark, or it has been asked for RETRY_DAYS days. */
export function dayDone(rated: ReadonlySet<number>, owed: ReadonlySet<number>, day: string, today: string): boolean {
  const whole = [...owed].every((code) => rated.has(code));
  return whole || Date.parse(today) - Date.parse(day) >= RETRY_DAYS * DAY_MS;
}
