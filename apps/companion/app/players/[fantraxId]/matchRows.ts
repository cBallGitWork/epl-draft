import { toFplClubCode } from "@epl/core";
import type { Club, PlayerMatch } from "@epl/core";
import type { GameLogRow } from "./scouting";

// One row per match, with both accounts of it on the same line.
//
// FPL's history is the SPINE: it covers every match of the season, always, and
// carries the underlying play — expected goals, tackles, recoveries, bps — that
// Fantrax publishes none of. Fantrax's own rows carry the one thing FPL cannot
// give at all: **our league's points for that match**. FPL's points are FPL's,
// under FPL's rules, and the two disagree by design.
//
// **Joined on the opponent and the venue**, which is safe in a league season: a
// man plays each opponent once at home and once away, so the pair names the
// match without needing a date. Fantrax gives its own club codes and disagrees
// with FPL on two of them (`BRF`/`NOT`), so the key is translated before it is
// compared — never joined on a short name raw.
//
// **Fantrax's half is "recent" and how recent is not knowable yet.** Their table
// returned two rows for a two-match season, so its window could be five, ten or
// the lot. A match it does not reach gets `paid: null` and the screen dashes
// those columns rather than printing a nought for points nobody scored.

export interface MatchRow {
  fpl: GameLogRow;
  /** What our league paid for it, or null when Fantrax's window does not reach
   *  back this far. Null is "we were not told", never "he scored nothing". */
  paid: PlayerMatch | null;
}

export function joinMatches(
  fpl: readonly GameLogRow[],
  fantrax: readonly PlayerMatch[],
  clubs: ReadonlyMap<number, Club>,
): MatchRow[] {
  const paid = new Map<string, PlayerMatch>();
  for (const match of fantrax) paid.set(key(toFplClubCode(match.opponent), match.home), match);

  return fpl.map((row) => {
    const opponent = clubs.get(row.match.opponentClubId)?.shortName;
    return {
      fpl: row,
      paid: (opponent === undefined ? undefined : paid.get(key(opponent, row.match.home))) ?? null,
    };
  });
}

const key = (opponent: string, home: boolean) => `${opponent}|${home ? "H" : "A"}`;

/** The foot of the table: what the season adds up to, and what that is per
 *  ninety minutes.
 *
 *  Championship Manager closes its appearances table with a total, and FPL's own
 *  player page closes with `Totals` and `Per 90` — both references say the same
 *  thing, which is that a column of matches is not read without its sum.
 *
 *  **A per-ninety of nothing is nothing, not a division by nought.** A man with
 *  no minutes gets null and the screen dashes it. */
export interface MatchTotals {
  minutes: number;
  goals: number;
  assists: number;
  expectedGoals: number;
  expectedAssists: number;
  bonus: number;
  bps: number;
  fplPoints: number;
  /** Our league's points, over the matches Fantrax reached. Null when it reached
   *  none — a total of nought would say he scored nothing in matches nobody
   *  showed us. */
  points: number | null;
  shots: number | null;
  shotsOnTarget: number | null;
  foulsCommitted: number | null;
}

export function totalsOf(rows: readonly MatchRow[]): MatchTotals {
  const sum = (of: (row: MatchRow) => number | null | undefined) =>
    rows.reduce((run, row) => run + (of(row) ?? 0), 0);
  // Only over the matches Fantrax actually gave, so a partial window sums to what
  // it covers rather than to the season.
  const covered = rows.filter((row) => row.paid !== null);
  const theirs = (of: (match: PlayerMatch) => number | null) =>
    covered.length === 0 ? null : covered.reduce((run, row) => run + (of(row.paid!) ?? 0), 0);

  return {
    minutes: sum((r) => r.fpl.match.minutes),
    goals: sum((r) => r.fpl.match.goals),
    assists: sum((r) => r.fpl.match.assists),
    expectedGoals: sum((r) => r.fpl.match.expectedGoals),
    expectedAssists: sum((r) => r.fpl.match.expectedAssists),
    bonus: sum((r) => r.fpl.match.bonus),
    bps: sum((r) => r.fpl.match.bps),
    fplPoints: sum((r) => r.fpl.match.fplPoints),
    points: theirs((m) => m.points),
    shots: theirs((m) => m.shots),
    shotsOnTarget: theirs((m) => m.shotsOnTarget),
    foulsCommitted: theirs((m) => m.foulsCommitted),
  };
}

/** A total over ninety minutes, or null when there are no minutes to divide. */
export function per90(total: number | null, minutes: number): number | null {
  if (total === null || minutes <= 0) return null;
  return (total * 90) / minutes;
}
