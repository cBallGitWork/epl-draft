import type { PlayerMatchStats } from "../football/types";

// What one player has actually done this round, added up across however many
// matches he played in it.
//
// Here rather than in the component that used to hold it, for two reasons. It is
// arithmetic over football data, which §5 puts in core; and it now has two
// readers — the sticker on the pitch and the row in the list — which had begun
// summing the same fields two different ways.
//
// Fantrax's own points are deliberately absent, and the reason has narrowed.
// `getTeamRosters` still does not carry them and we still recompute nothing —
// but "their live scoreboard publishes no per-player total we can read" stopped
// being true on 22 Aug 2026. `getLiveScoringStats` fills `statsMap[id].object1`
// with a player's total and `.object2` with its per-category parts, priced at
// the roster slot, in the payload the scoreboard already fetches. It is not read
// here because this is the FOOTBALL side of the join — countable events under
// nobody's rules — and pulling a provider's points into it would be the layer
// mistake CLAUDE.md is about. PLATFORM_NOTES, 22 Aug, records what it holds.

// There is deliberately no `played` flag here. There was one, defined as "we
// have a stat line for him", and it was true for every player in the league from
// a round's first whistle: FPL's live endpoint emits a row for all 600 elements
// once a gameweek opens, 569 of them on zero minutes, including men whose fixture
// is three days away. Four views branched on it to choose between a fixture and a
// score, and from 21 Aug 2026 they all took the score branch for everybody.
// "Has his match kicked off" is a question about fixtures, and `kickedOff` in the
// football layer answers it there.

/** What FPL measured about a round, as against the events anyone watching could
 *  have counted.
 *
 *  Apart from the countable fields above, and not merged into them, because
 *  these four are **not summed and summing them is wrong**. FPL's live `explain`
 *  block covers point-scoring identifiers only, so `mapLiveStats` takes bps,
 *  expected goals, expected assists and defensive contribution off the player's
 *  gameweek aggregate and writes that same round total onto every fixture row he
 *  has. Adding two rows up on a double gameweek reports the round twice.
 *
 *  Per-match versions of all four exist, but not in this payload:
 *  `element-summary` publishes them, and `mapGameLog` reads them there.
 *
 *  Not exported. `Contribution` is the only thing that names it, and §2 does not
 *  keep an export around for a caller who has not turned up yet. */
interface RoundMeasurements {
  bps: number;
  defensiveContribution: number;
  expectedGoals: number;
  expectedAssists: number;
}

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
  penaltiesSaved: number;
  penaltiesMissed: number;
  yellowCards: number;
  redCards: number;
  /** Null until he has been on a pitch this round.
   *
   *  Nought expected goals for a man whose match is on Tuesday is a measurement
   *  nobody took, and FPL is already carrying a zero row for him — the same row
   *  the comment above about `played` flags is about. Absent, so a reader gets a
   *  dash rather than a number that reads as a poor afternoon. */
  measured: RoundMeasurements | null;
}

export function contribution(stats: readonly PlayerMatchStats[]): Contribution {
  const sum = (pick: (s: PlayerMatchStats) => number) => stats.reduce((n, s) => n + pick(s), 0);
  // The matches he was actually on the pitch for. FPL carries a zero row for a
  // fixture that has not kicked off, and counting it would let a match nobody has
  // played take a clean sheet off a defender who kept one on Saturday.
  const appearances = stats.filter((s) => s.minutes > 0);
  // Any row will do: `mapLiveStats` copies the gameweek aggregate onto all of
  // them, which is exactly why these are read rather than added.
  const round = appearances[0];

  return {
    minutes: sum((s) => s.minutes),
    goals: sum((s) => s.goals),
    assists: sum((s) => s.assists),
    cleanSheet: appearances.length > 0 && appearances.every((s) => s.cleanSheet),
    saves: sum((s) => s.saves),
    penaltiesSaved: sum((s) => s.penaltiesSaved),
    penaltiesMissed: sum((s) => s.penaltiesMissed),
    yellowCards: sum((s) => s.yellowCards),
    redCards: sum((s) => s.redCards),
    measured:
      round === undefined
        ? null
        : {
            bps: round.bps,
            defensiveContribution: round.defensiveContribution,
            expectedGoals: round.expectedGoals,
            expectedAssists: round.expectedAssists,
          },
  };
}
