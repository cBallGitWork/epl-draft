import type { LeaguePeriod } from "./types";

// Which FPL gameweek falls inside which Fantrax scoring period.
//
// This is the league layer's second seam onto the football layer, and the only
// one that is not player identity. It stays a seam rather than a dependency: this
// file imports nothing from `football/` and declares the football facts it needs
// as plain data, exactly as `identity/candidates.ts` declares `FplCandidate`
// rather than importing `FootballPlayer`. The caller is told to supply kickoffs;
// where they came from is not this file's business.
//
// **Measured by kickoff, and that matters.** The obvious test — does FPL's
// deadline fall inside the period? — says the two calendars disagree everywhere:
// each deadline lands one period early (period 1 holds gameweek 2's), and around
// the September break period 3 gets no gameweek while period 4 gets two. Fantrax's
// boundary sits inside the 90-minute gap between FPL's deadline and that
// gameweek's first kickoff, which is what puts the deadline on the wrong side of
// it. By kickoff, all 38 periods align exactly with the identically numbered
// gameweek, across all 380 fixtures. See `calendar.test.ts`.
//
// Postponements are the known future divergence: FPL keeps a rearranged fixture in
// its original `event`, while Fantrax scores it in the period it was actually
// played. That is a real disagreement about the football, not a bug here.

/** One fixture's kickoff, tagged with the gameweek FPL files it under. */
export interface GameweekKickoff {
  gameweek: number;
  /** ISO instant. FPL sends `Z`; Fantrax's period bounds carry `-0400`. */
  kickoff: string;
}

/** Zero and two are both possible answers — a blank period and a double — which
 *  is why this is a list and not a number. */
export interface PeriodGameweeks {
  period: number;
  gameweeks: number[];
}

export function periodGameweeks(
  periods: LeaguePeriod[],
  kickoffs: GameweekKickoff[],
): PeriodGameweeks[] {
  // Compare instants, never strings. Fantrax's "…T15:00:00.0-0400" and FPL's
  // "…T19:00:00Z" are the same moment and sort the wrong way lexically.
  const instants = kickoffs
    .map((k) => ({ gameweek: k.gameweek, at: Date.parse(k.kickoff) }))
    .filter((k) => Number.isFinite(k.at));

  return periods.map((period) => {
    const start = Date.parse(period.start);
    const end = Date.parse(period.end);
    const gameweeks = new Set<number>();

    // Inclusive at both ends: consecutive periods end at :59 and start at the
    // next :00, so they leave a one-second gap rather than overlapping.
    for (const { gameweek, at } of instants) {
      if (at >= start && at <= end) gameweeks.add(gameweek);
    }

    return { period: period.number, gameweeks: [...gameweeks].sort((a, b) => a - b) };
  });
}
