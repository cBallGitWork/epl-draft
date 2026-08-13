// A manager's own FPL side — the other game most of our league also plays.
//
// Its own adapter rather than part of `football/`, because `football/` models
// the competition (clubs, fixtures, who scored) and this models one person's
// entry into a fantasy game played on top of it. The two happen to share a
// provider and nothing else.
//
// Deliberately thin. This is one tab for the members who also run an FPL side at
// weekends: their points, their squad, their mini-leagues. No history, no
// projections, no second opinion on football we already model properly.

export interface FplEntry {
  id: number;
  managerName: string;
  /** What they called their side. */
  teamName: string;
  /** Null before a ball is kicked — FPL sends null, not zero, and so do we. */
  overallPoints: number | null;
  overallRank: number | null;
  gameweekPoints: number | null;
  /** The round FPL considers current for this entry, or null pre-season. */
  currentEvent: number | null;
  leagues: FplMiniLeague[];
}

export interface FplMiniLeague {
  id: number;
  name: string;
  rank: number | null;
  lastRank: number | null;
  /** FPL's own code, raw: "x" is a league somebody made, "s" one of the automatic
   *  global ones nobody joined on purpose. Kept as they send it — the vocabulary
   *  is theirs and undocumented. */
  kind: string;
}

/** One of the fifteen, with FPL's own points under FPL's own scoring.
 *
 *  Never mixed with a Fantrax number on the same screen: the same footballer is
 *  worth different amounts in the two games, and a reader has to be told which
 *  game a number belongs to. */
export interface FplPick {
  /** Season-stable, so it keys the portrait and joins to a snapshot. */
  code: number;
  /** 0 benched, 1 playing, 2 captain, 3 triple captain. */
  multiplier: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  /** Already multiplied — what this pick contributed to the manager's score. */
  points: number;
}

export interface FplSquad {
  gameweek: number;
  picks: FplPick[];
  /** FPL's own total for the round, which is not the sum of the picks: autosubs
   *  and transfer hits both move it. Carried so the app can show theirs rather
   *  than add ours up. */
  total: number | null;
  /** Points docked for transfers. */
  hit: number | null;
}
