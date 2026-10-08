import { toFplClubCode } from "@epl/core";
import type { Club, PlayerMatch } from "@epl/core";
import type { GameLogRow } from "./scouting";

// One row per match with both accounts on it: FPL's game log is the spine, every match of the season; Fantrax's
// recent rows add our league's points. Joined on opponent and venue, Fantrax's club codes translated to FPL's first.

export interface MatchRow {
  fpl: GameLogRow;
  /** What our league paid for it; null where Fantrax's window does not reach, never "he scored nothing". */
  paid: PlayerMatch | null;
  /** Our mark out of ten; null when the match was not rated or he was too brief to rate. */
  mark: number | null;
}

export function joinMatches(
  fpl: readonly GameLogRow[],
  fantrax: readonly PlayerMatch[],
  clubs: ReadonlyMap<number, Club>,
  /** Our marks by FPL fixture id. */
  marks: ReadonlyMap<number, number | null> = new Map(),
): MatchRow[] {
  const paid = new Map<string, PlayerMatch>();
  for (const match of fantrax) paid.set(key(toFplClubCode(match.opponent), match.home), match);

  return fpl.map((row) => {
    const opponent = clubs.get(row.match.opponentClubId)?.shortName;
    return {
      fpl: row,
      paid: (opponent === undefined ? undefined : paid.get(key(opponent, row.match.home))) ?? null,
      mark: marks.get(row.match.fixtureId) ?? null,
    };
  });
}

const key = (opponent: string, home: boolean) => `${opponent}|${home ? "H" : "A"}`;

/** What his season adds up to, FPL's account: CM's appearances columns (`cm9900/11.jpg`) and FPL's points. */
interface MatchTotals {
  minutes: number;
  goals: number;
  assists: number;
  fplPoints: number;
  /** The matches he turned out in: rows with a minute against them, never `rows.length`. */
  apps: number;
  conceded: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  saves: number;
  /** His average mark over the matches rated; null when none was. */
  rating: number | null;
}

export function totalsOf(rows: readonly MatchRow[]): MatchTotals {
  const sum = (of: (row: MatchRow) => number | null | undefined) =>
    rows.reduce((run, row) => run + (of(row) ?? 0), 0);

  return {
    minutes: sum((r) => r.fpl.match.minutes),
    goals: sum((r) => r.fpl.match.goals),
    assists: sum((r) => r.fpl.match.assists),
    fplPoints: sum((r) => r.fpl.match.fplPoints),
    apps: rows.filter((row) => row.fpl.match.minutes > 0).length,
    // FPL's count while he was on, never the club's score: a match he sat out adds nothing.
    conceded: sum((r) => r.fpl.match.goalsConceded),
    cleanSheets: rows.filter((row) => row.fpl.match.cleanSheet).length,
    yellowCards: sum((r) => r.fpl.match.yellowCards),
    redCards: sum((r) => r.fpl.match.redCards),
    saves: sum((r) => r.fpl.match.saves),
    rating: average(rows.flatMap((r) => (r.mark === null ? [] : [r.mark]))),
  };
}

const average = (marks: readonly number[]) => (marks.length === 0 ? null : marks.reduce((a, b) => a + b, 0) / marks.length);
