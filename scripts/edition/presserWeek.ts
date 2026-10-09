import { MS_PER_DAY, TEAM_SHEET, londonDayOf, onLondonDay, type Club, type Fixture, type PresserLine, type RosteredTeam } from "@epl/core";
import type { Say } from "./newsroom";
import {
  presserFixtures,
  presserGameweek,
  presserLines,
  presserQuotes,
  presserSpoke,
  type PresserSquadMan,
} from "./pressers";

// WHICH round and WHICH day the Team Sheet is about: `pressers.ts` reads the export, this decides the window, the
// round it previews, and the day each edition carries.

/** Everything the Team Sheet needs, in one place: the window, the round it previews, the guard that the export is
 *  about that round, and the three files keyed on it. */
export function presserDesk(input: {
  facts: { teams: readonly RosteredTeam[] };
  snapshot: { gameweek: number; players: readonly PresserSquadMan[] };
  byCode: ReadonlyMap<number, Club>;
  now: string;
  lock: string | null;
  locked: boolean;
  /** The season's fixtures, which the writer already holds. */
  season: readonly Fixture[];
  say: Say;
}): {
  lines: PresserLine[];
  quotes: ReturnType<typeof presserQuotes>;
  spoke: ReturnType<typeof presserSpoke>;
  ties: ReturnType<typeof presserFixtures>;
  gameweek: number;
} {
  const { facts, snapshot, byCode, now, lock, locked, say } = input;

  // The window opens at the last lock that has PASSED; before this round locks, its lock is in the future.
  const since = locked && lock !== null ? lock : new Date(Date.parse(now) - TEAM_SHEET.windowDays * MS_PER_DAY).toISOString();

  // LOCKED, not finished: once a round has locked every conference is about the next one.
  const gameweek = locked ? snapshot.gameweek + 1 : snapshot.gameweek;

  // The export records the gameweek its article covers; a stale file is not this round's team news.
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

/** One edition of the Team Sheet: everything said on one London day, so Friday's column carries none of Thursday's. */
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
    lines: onDay(all.lines, day, (row) => row.said),
    // A quote's `said` is the speaker's name; its day is `at`.
    quotes: onDay(all.quotes, day, (row) => row.at),
    spoke: onDay(all.spoke, day, (row) => row.at),
  };
}

/** Only what was said on one London day; `when` names the row's instant. */
function onDay<T>(rows: readonly T[], day: string, when: (row: T) => string | undefined): T[] {
  return rows.filter((row) => onLondonDay(when(row), day));
}

/** The London days the round's conferences were held, one Team Sheet each. */
export function presserDays(lines: readonly PresserLine[]): string[] {
  return [...new Set(lines.flatMap((line) => londonDayOf(line.said) ?? []))].sort();
}

/** An absence: ruled out or suspended. A standing doubt or rotation risk is not still out. */
const ABSENT = new Set(["ruled_out", "suspended"]);

/** Each team-news row given its club's standing absences from the export, with who holds each, in place of any the
 *  column listed; a man the column bulleted is news, so he is not also still out. */
export function withStillOut(rows: unknown, lines: readonly PresserLine[]): unknown {
  if (!Array.isArray(rows)) return rows;
  return rows.map((row) => {
    const { alsoOut, stillOut, ...rest } = row as { alsoOut?: unknown; stillOut?: unknown; code?: unknown; men?: unknown };
    void alsoOut;
    void stillOut;
    const bulleted = new Set(Array.isArray(rest.men) ? rest.men.map((man) => (man as { name?: unknown }).name) : []);
    const still = lines
      .filter((line) => !line.fresh && ABSENT.has(line.tag) && line.club === rest.code && !bulleted.has(line.playerName))
      .map((line) => (line.ownerName === null ? { name: line.playerName } : { name: line.playerName, owner: line.ownerName }));
    return still.length === 0 ? rest : { ...rest, stillOut: still };
  });
}
