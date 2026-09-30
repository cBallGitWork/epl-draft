import type { PlayerMatchStats, RecentGame } from "@epl/core";

// What each man did in the last few rounds, off FPL's live match reads: minutes, goals, assists
// and clean sheets. Read by Lawro's key men and by the team sheets' form lines.

/** Each man's last gameweeks, oldest first, a double summed; a man missing from a read did not play. */
export function recentGames(gameweeks: readonly number[], reads: readonly (readonly PlayerMatchStats[])[]): Map<number, RecentGame[]> {
  const out = new Map<number, RecentGame[]>();
  gameweeks.forEach((gameweek, at) => {
    const rows = new Map<number, RecentGame>();
    for (const row of reads[at] ?? []) {
      const game = rows.get(row.playerId) ?? { gameweek, minutes: 0, goals: 0, assists: 0, cleanSheets: 0, points: 0 };
      rows.set(row.playerId, {
        gameweek,
        minutes: game.minutes + row.minutes,
        goals: game.goals + row.goals,
        assists: game.assists + row.assists,
        cleanSheets: game.cleanSheets + (row.cleanSheet ? 1 : 0),
        points: game.points + row.fplPoints,
      });
    }
    for (const [playerId, game] of rows) out.set(playerId, [...(out.get(playerId) ?? []), game]);
  });
  return out;
}
