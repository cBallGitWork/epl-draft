import { londonDayOf, type Club, type Fixture, type PresserLine, type RosteredTeam } from "@epl/core";
import {
  presserFixtures,
  presserGameweek,
  presserLines,
  presserQuotes,
  presserSpoke,
  type PresserSquadMan,
} from "./pressers";

// WHICH round and WHICH day the Team Sheet is about.
//
// Split from `pressers.ts` when it passed the 300-line ceiling: that reads the
// export, this decides the window, the round it previews, and the day each
// edition carries.

/** No round is longer than one, so a presser older than this is about a round
 *  already played. */
const WEEK = 7 * 24 * 60 * 60 * 1000;

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



/** ONE EDITION of the Team Sheet: everything said on one London day.
 *
 *  The presser is a single kind with two editions a week, and this is where that
 *  is expressed once. The window the desk reads is the ROUND's, so without this
 *  both editions carried the whole week — Friday's column printed all eighteen
 *  clubs and led on a man whose conference was Thursday. */
export function presserEdition<
  L extends { said?: string },
  Q extends { at?: string },
  S extends { at?: string },
>(day: string, all: { lines: readonly L[]; quotes: readonly Q[]; spoke: readonly S[] }): {
  lines: L[];
  quotes: Q[];
  spoke: S[];
} {
  return {
    lines: onDay(all.lines, day),
    quotes: onDay(all.quotes, day),
    spoke: onDay(all.spoke, day),
  };
}

/** Only what was said on one London day. */
function onDay<T extends { said?: string; at?: string }>(rows: readonly T[], day: string): T[] {
  return rows.filter((row) => {
    return londonDayOf(row.said ?? row.at ?? "") === day;
  });
}

/** One assignment per press-conference DAY. Craig's week runs pressers Thursday
 *  and Friday, so a single key for the week would suppress the second column. */
export function presserDays(
  lines: readonly PresserLine[],
  gameweek: number,
): { key: string; slug: string; day: string }[] {
  const days = new Set<string>();
  for (const line of lines) {
    const on = londonDayOf(line.said);
    if (on !== null) days.add(on);
  }
  return [...days]
    .sort()
    .map((day) => ({ key: `presser:gw${gameweek}:${day}`, slug: `gw${gameweek}-presser-${day}`, day }));
}
