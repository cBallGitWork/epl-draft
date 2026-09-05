import type { Fixture, PlayerMatchStats } from "./types";

// Has he been playing? — the football half of the question a manager asks about
// a free agent on a Tuesday night.
//
// Pure, and deliberately not in `join/`: nothing here knows our league exists.
// It reads FPL's live rows and answers about a footballer. The join is the app
// attaching an answer to a pool row through the bridge, and it happens there.
//
// **Nothing here scores anything.** Minutes, starts and appearances are
// countable events under nobody's rules, which is what lets them sit beside a
// Fantrax `FPts` column — the bound `football/types.ts` puts on goals, assists
// and clean sheets does not reach them.

/** One round's live rows, as `gameweekLive` hands them over. */
export interface RoundStats {
  gameweek: number;
  stats: readonly PlayerMatchStats[];
}

/** What a man has been doing lately.
 *
 *  `rounds` is the DENOMINATOR and it is per player, not a constant: it counts
 *  the rounds he had a row in, so a January signing reads "2 of 2" rather than
 *  "2 of 5" against men who were here in August. Printing a fixed denominator
 *  would say he had missed three matches he could not have played in. */
export interface PlayerForm {
  rounds: number;
  /** Rounds he was in the eleven. Never a sum of one round's rows — see
   *  `PlayerMatchStats.starts`, which is the round's aggregate repeated. */
  starts: number;
  /** Rounds he got on at all. `minutes > 0` is the appearance test the join
   *  layer already uses; a row by itself is not one, because FPL opens a row for
   *  every player in the league at a round's first whistle. */
  appearances: number;
  minutes: number;
}

/** The last rounds with football in the books, most recent first.
 *
 *  **Not `gameweekStatus === "finished"`, and that is the whole reason this
 *  exists.** That answers "has every match in the round ended", and
 *  `calendar.ts` records that FPL leaves a rearranged fixture in its ORIGINAL
 *  round — so a GW20 match replayed in February holds gameweek 20 at "upcoming"
 *  from December, and a form column reading finished rounds would silently drop
 *  it for two months and quietly shorten every denominator.
 *
 *  The test is instead: some football has been played, and none is being played
 *  now. A round mid-flight is excluded because its minutes are half-counted, and
 *  a man who has not kicked off yet would read as dropped.
 *
 *  A round with no fixtures at all is not a round. */
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

/** Every player's recent form, in one pass.
 *
 *  A Map rather than a function per player, because the caller is a directory of
 *  some six hundred names against five rounds of six hundred rows: asking per
 *  player would walk three thousand rows six hundred times. Built once, read
 *  once per row.
 *
 *  Absent rather than zero for a man with no rows in any of these rounds. He is
 *  a footballer nobody has a reading for — an academy name, or one FPL listed
 *  after these rounds were played — and a nought would say he was available and
 *  went unpicked. The screen dashes him. */
export function formByPlayer(rounds: readonly RoundStats[]): Map<number, PlayerForm> {
  const form = new Map<number, PlayerForm>();

  for (const round of rounds) {
    // One round's rows for one man, gathered before anything is counted: a
    // double gameweek gives him two, and `starts` is the round's own count
    // written onto both of them.
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
        // Read off the first row and never summed. The aggregate is the round's,
        // so adding a double's two rows reports two starts for one appearance.
        starts: running.starts + (rows[0]?.starts ?? 0),
        appearances: running.appearances + (minutes > 0 ? 1 : 0),
        minutes: running.minutes + minutes,
      });
    }
  }

  return form;
}
