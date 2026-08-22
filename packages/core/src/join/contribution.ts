import type { PlayerMatchStats } from "../football/types";

// What one player has actually done this round, added up across however many
// matches he played in it.
//
// Here rather than in the component that used to hold it, for two reasons. It is
// arithmetic over football data, which §5 puts in core; and it now has two
// readers — the sticker on the pitch and the row in the list — which had begun
// summing the same fields two different ways.
//
// Fantrax's own points are deliberately absent. `getTeamRosters` does not carry
// them, their live scoreboard publishes no per-player total we can read, and we
// do not recompute their scoring. So this is the countable events and the
// minutes, which is what we genuinely know.

// There is deliberately no `played` flag here. There was one, defined as "we
// have a stat line for him", and it was true for every player in the league from
// a round's first whistle: FPL's live endpoint emits a row for all 600 elements
// once a gameweek opens, 569 of them on zero minutes, including men whose fixture
// is three days away. Four views branched on it to choose between a fixture and a
// score, and from 21 Aug 2026 they all took the score branch for everybody.
// "Has his match kicked off" is a question about fixtures, and `kickedOff` in the
// football layer answers it there.

export interface Contribution {
  minutes: number;
  goals: number;
  assists: number;
  /** Only when every match he **played in** was a clean sheet. A defender who
   *  kept one and conceded in the other kept none — and a match he has not
   *  appeared in yet is not evidence either way, which is why the not-yet-played
   *  row FPL already carries for him must not be counted. */
  cleanSheet: boolean;
  saves: number;
  yellowCards: number;
  redCards: number;
}

export function contribution(stats: readonly PlayerMatchStats[]): Contribution {
  const sum = (pick: (s: PlayerMatchStats) => number) => stats.reduce((n, s) => n + pick(s), 0);
  // The matches he was actually on the pitch for. FPL carries a zero row for a
  // fixture that has not kicked off, and counting it would let a match nobody has
  // played take a clean sheet off a defender who kept one on Saturday.
  const appearances = stats.filter((s) => s.minutes > 0);

  return {
    minutes: sum((s) => s.minutes),
    goals: sum((s) => s.goals),
    assists: sum((s) => s.assists),
    cleanSheet: appearances.length > 0 && appearances.every((s) => s.cleanSheet),
    saves: sum((s) => s.saves),
    yellowCards: sum((s) => s.yellowCards),
    redCards: sum((s) => s.redCards),
  };
}
