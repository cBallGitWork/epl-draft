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
  /** FPL's slot number, 1–15. **Their ordering, not a football position** —
   *  1 is the keeper and 12–15 are the bench, in the order they would come on.
   *  Named `slot` rather than `position`, which is what they call it, because
   *  `position` in this codebase means the letter a league files a player under
   *  and this is neither that nor a place on a pitch. */
  slot: number;
  /** 0 benched, 1 playing, 2 captain, 3 triple captain. */
  multiplier: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  /** Already multiplied — what this pick contributed to the manager's score. */
  points: number;
  /** His own points, unmultiplied: what a benched man scored, which `points` zeroes. */
  scored: number;
  /** FPL's own `element_type`: 1 keeper, 2 defender, 3 midfielder, 4 forward.
   *
   *  **Here rather than in the football layer, and that is the whole reason this
   *  adapter exists.** `element_type` is not a fact about a footballer — it is
   *  how FPL files him for FPL's game, and Fantrax files several of the same men
   *  differently and lets them hold two positions at once. `football/types.ts`
   *  refuses to carry it for exactly that reason. This layer models FPL's
   *  fantasy game, so FPL's classification is at home in it.
   *
   *  Zero when FPL did not say, which sorts before the keeper's line and lands
   *  the pick at the top of the pitch rather than dropping him from a fifteen. */
  line: number;
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

/** How many of the fifteen start, under FPL's rules. Their rule, in their layer:
 *  the football layer knows nothing about how many men a fantasy game fields,
 *  and our own league fields a different number. */
export const FPL_STARTERS = 11;

/** FPL's four lines, back to front, and what to call them.
 *
 *  Their vocabulary, not our league's: `positions.ts` in the app translates
 *  Fantrax's letters and this translates FPL's numbers. The four words come out
 *  the same, which is a coincidence of English rather than a shared rule — the
 *  day FPL adds a fifth classification only one of the two moves. */
export const FPL_LINES: readonly { line: number; name: string }[] = [
  { line: 1, name: "GK" },
  { line: 2, name: "DEF" },
  { line: 3, name: "MID" },
  { line: 4, name: "FWD" },
];

/** Whether FPL files this man in goal.
 *
 *  Asked here rather than by comparing a number at a render site, and NOT by
 *  translating the line into a Fantrax letter so `isGoalkeeper` can read it —
 *  that would put our league's vocabulary in the middle of a question about
 *  FPL's, for the sake of one lookup. The view needs the answer to pick which of
 *  a club's two kits to draw behind a man with no photograph. */
export function isFplKeeper(line: number): boolean {
  return line === FPL_LINES[0]?.line;
}
