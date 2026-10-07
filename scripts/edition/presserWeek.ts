import { MS_PER_DAY, type Club, type Fixture, type PresserLine, type RosteredTeam } from "@epl/core";
import {
  presserFixtures,
  presserGameweek,
  presserLines,
  presserQuotes,
  presserSpoke,
  type PresserSquadMan,
} from "./pressers";

// WHICH round the Team Sheet is about, and the conferences it carries.
//
// Split from `pressers.ts` when it passed the 300-line ceiling: that reads the
// export, this decides the window and the round it previews.

/** No round is longer than one, so a presser older than this is about a round
 *  already played. */
const WEEK = 7 * MS_PER_DAY;

/** Everything the Team Sheet needs, assembled in one place.
 *
 *  Six reads that only make sense together — the window, the round they preview,
 *  the guard that the export is about that round, and the three files keyed on
 *  it. The same seam `deskState` was extracted along, for the same reason: the
 *  caller had passed the ceiling. */
export function presserDesk(input: {
  facts: { teams: readonly RosteredTeam[] };
  snapshot: { gameweek: number; players: readonly PresserSquadMan[] };
  byCode: ReadonlyMap<number, Club>;
  now: string;
  lock: string | null;
  locked: boolean;
  /** The season's fixtures, which the writer already holds. */
  season: readonly Fixture[];
  say: (message: string) => void;
}): {
  lines: PresserLine[];
  quotes: ReturnType<typeof presserQuotes>;
  spoke: ReturnType<typeof presserSpoke>;
  ties: ReturnType<typeof presserFixtures>;
  gameweek: number;
} {
  const { facts, snapshot, byCode, now, lock, locked, say } = input;

  // The window opens at the last lock that has PASSED. `lock ?? now` was wrong:
  // `lock` is the current period's, which before that round locks is in the
  // FUTURE, so every signal was filtered and the column silently never fired.
  const since = locked && lock !== null ? lock : new Date(Date.parse(now) - WEEK).toISOString();

  // LOCKED, not finished: once a round has locked every conference is about the
  // next one, and `finished` is a later and different moment.
  const gameweek = locked ? snapshot.gameweek + 1 : snapshot.gameweek;

  // Scout writes one article per gameweek and the export records which; a stale
  // file, or one from a European week, is not this round's team news.
  const covers = presserGameweek();
  const wrongRound = covers !== null && covers !== gameweek;
  if (wrongRound) {
    say(`Pressers skipped: the export covers gameweek ${covers} and the round ahead is ${gameweek}.`);
  }

  const lines = wrongRound ? [] : presserLines(facts.teams, since, byCode, snapshot.players);
  return {
    lines,
    quotes: presserQuotes(byCode),
    spoke: presserSpoke(since, byCode),
    ties: lines.length === 0 ? new Map() : presserFixtures(gameweek, byCode, input.season),
    gameweek,
  };
}
