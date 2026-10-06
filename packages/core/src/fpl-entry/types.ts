// A manager's own FPL side, for one thin tab: points, squad, mini-leagues. Not `football/`, which models the competition.

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
  /** FPL's own undocumented code, raw: "x" a league somebody made, "s" an automatic global one. */
  kind: string;
}

/** One of the fifteen, with FPL's own points under FPL's scoring; never beside a Fantrax number. */
export interface FplPick {
  /** Season-stable, so it keys the portrait and joins to a snapshot. */
  code: number;
  /** FPL's slot number, 1–15, which they call `position`: 1 the keeper, 12–15 the bench in the order they come on. */
  slot: number;
  /** 0 benched, 1 playing, 2 captain, 3 triple captain. */
  multiplier: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  /** Already multiplied — what this pick contributed to the manager's score. */
  points: number;
  /** His own points, unmultiplied: what a benched man scored, which `points` zeroes. */
  scored: number;
  /** FPL's scoring lines behind `scored`, in FPL's order, a double's fixtures merged. */
  lines: FplScoreLine[];
  /** FPL's own `element_type`, 1 keeper to 4 forward: FPL's filing for its game, so it lives here, not in football.
   *  Zero when FPL did not say, which sorts him to the top of the pitch rather than dropping him. */
  line: number;
}

/** One line of FPL's own scoring for a man's round: what he did, and what FPL paid for it. */
export interface FplScoreLine {
  /** FPL's identifier, raw: `minutes`, `goals_scored`, `bonus`. */
  identifier: string;
  value: number;
  points: number;
}

export interface FplSquad {
  gameweek: number;
  picks: FplPick[];
  /** FPL's own total for the round, not the sum of the picks: autosubs and transfer hits both move it. */
  total: number | null;
  /** Points docked for transfers. */
  hit: number | null;
}

/** How many of the fifteen start, under FPL's rules; our league fields its own number. */
export const FPL_STARTERS = 11;

/** FPL's four lines, back to front, in FPL's vocabulary: the same words as our league's by coincidence, not rule. */
export const FPL_LINES: readonly { line: number; name: string }[] = [
  { line: 1, name: "GK" },
  { line: 2, name: "DEF" },
  { line: 3, name: "MID" },
  { line: 4, name: "FWD" },
];

/** FPL's scoring identifiers in FPL's own words. */
const FPL_SCORE_NAMES: Readonly<Record<string, string>> = {
  minutes: "Minutes played",
  goals_scored: "Goals scored",
  assists: "Assists",
  clean_sheets: "Clean sheets",
  goals_conceded: "Goals conceded",
  own_goals: "Own goals",
  penalties_saved: "Penalties saved",
  penalties_missed: "Penalties missed",
  yellow_cards: "Yellow cards",
  red_cards: "Red cards",
  saves: "Saves",
  bonus: "Bonus",
  defensive_contribution: "Defensive contribution",
};

/** A scoring line's name; one FPL adds later is printed verbatim rather than guessed at. */
export function fplScoreName(identifier: string): string {
  return FPL_SCORE_NAMES[identifier] ?? identifier;
}

/** Whether FPL files this man in goal, which picks the kit drawn behind a man with no photograph. */
export function isFplKeeper(line: number): boolean {
  return line === FPL_LINES[0]?.line;
}
