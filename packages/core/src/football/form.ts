import type { Fixture, PlayerMatchStats } from "./types";

// Has he been playing: minutes, starts and appearances off FPL's live rows, which score nothing under anybody's rules.

/** One round's live rows, as `gameweekLive` hands them over. */
interface RoundStats {
  gameweek: number;
  stats: readonly PlayerMatchStats[];
}

/** What a man has been doing lately. */
export interface PlayerForm {
  /** The denominator, per player: rounds he had a row in, so a January signing reads "2 of 2". */
  rounds: number;
  /** Rounds he was in the eleven; never a sum of one round's rows, which repeat the round's aggregate. */
  starts: number;
  /** Rounds with `minutes > 0`; a row alone is not an appearance, since FPL opens one for every player. */
  appearances: number;
  minutes: number;
}

/** The last `count` gameweeks with a finished match and none live, most recent first.
 *  Not `gameweekStatus === "finished"`: a postponed fixture stays in its original gameweek and would drop it for months. */
export function playedRounds(fixtures: readonly Fixture[], count: number): number[] {
  const rounds = new Map<number, { finished: boolean; live: boolean }>();
  for (const fixture of fixtures) {
    if (fixture.gameweek === null) continue;
    const seen = rounds.get(fixture.gameweek) ?? { finished: false, live: false };
    rounds.set(fixture.gameweek, {
      finished: seen.finished || fixture.status === "finished",
      live: seen.live || fixture.status === "live",
    });
  }

  return [...rounds.entries()]
    .filter(([, state]) => state.finished && !state.live)
    .map(([gameweek]) => gameweek)
    .sort((a, b) => b - a)
    .slice(0, count);
}

/** Every player's recent form by player id, in one pass; a man with no rows is absent, never zero. */
export function formByPlayer(rounds: readonly RoundStats[]): Map<number, PlayerForm> {
  const form = new Map<number, PlayerForm>();

  for (const round of rounds) {
    // Gathered per man first: a double gameweek gives him two rows, each carrying the round's `starts`.
    const byPlayer = new Map<number, PlayerMatchStats[]>();
    for (const row of round.stats) {
      const rows = byPlayer.get(row.playerId);
      if (rows === undefined) byPlayer.set(row.playerId, [row]);
      else rows.push(row);
    }

    for (const [playerId, rows] of byPlayer) {
      const running = form.get(playerId) ?? { rounds: 0, starts: 0, appearances: 0, minutes: 0 };
      const minutes = rows.reduce((total, row) => total + row.minutes, 0);
      form.set(playerId, {
        rounds: running.rounds + 1,
        // Off the first row, never summed: a double's two rows would report two starts for one.
        starts: running.starts + (rows[0]?.starts ?? 0),
        appearances: running.appearances + (minutes > 0 ? 1 : 0),
        minutes: running.minutes + minutes,
      });
    }
  }

  return form;
}
