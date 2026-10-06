import type { GroupKey } from "./categories";
import {
  ASSISTS_FANTASY,
  ASSISTS_OFFICIAL,
  ASSISTS_TOTAL,
  CLEAN_SHEETS,
  DEFENSIVE_POINTS,
  DEFENSIVE_POINTS_3,
  GOALS,
  GOALS_AGAINST,
  GOALS_AGAINST_OUTFIELD,
  KEEPER_POINTS,
  MINUTES,
  OWN_GOALS,
  PENALTIES_MISSED,
  PENALTY_SAVES,
  RED_CARDS,
  SAVES,
  YELLOW_CARDS,
  type FantraxCategory,
} from "./categoryNames";
import { wordsFor } from "./categoryWords";

// The categories a league can pay a player for, keyed by getPlayerStats' column abbreviation: a squad's Stats board.

/** A category the squad board can show, under Fantrax's own column abbreviation: `G`, `AF`, `CS`. */
interface PlayerCategory {
  key: string;
  /** Its column head; display only, as reads are filed under `key`. */
  head: string;
  group: GroupKey;
  label: string;
  /** True when a low count is the better one. */
  lowIsGood?: boolean;
  /** The other half's name for the same fact; read as a fallback, never added, as a man is in one half only. */
  also?: string;
}

const entry = (category: FantraxCategory, group: GroupKey, lowIsGood?: true, label = wordsFor(category).key): PlayerCategory => ({
  key: category.short,
  head: wordsFor(category).head,
  group,
  label,
  lowIsGood,
});

/** Ordered as a reader looks for them: his time on the pitch, then going forward, at the back, and what he did wrong. */
export const PLAYER_CATEGORIES: readonly PlayerCategory[] = [
  entry(MINUTES, "appearances"),
  entry(GOALS, "attacking"),
  entry(ASSISTS_TOTAL, "attacking"),
  entry(ASSISTS_OFFICIAL, "attacking"),
  entry(ASSISTS_FANTASY, "attacking"),
  entry(PENALTIES_MISSED, "attacking", true),
  entry(CLEAN_SHEETS, "defensive"),
  entry(DEFENSIVE_POINTS, "defensive"),
  entry(DEFENSIVE_POINTS_3, "defensive"),
  entry(SAVES, "defensive"),
  entry(KEEPER_POINTS, "defensive"),
  entry(PENALTY_SAVES, "defensive"),
  // A keeper's read calls it GA and an outfielder's GAO: one fact, one column, under the name both share.
  { ...entry(GOALS_AGAINST, "defensive", true, wordsFor(GOALS_AGAINST).name), also: GOALS_AGAINST_OUTFIELD.short },
  entry(YELLOW_CARDS, "discipline", true),
  entry(RED_CARDS, "discipline", true),
  // Defensive, not discipline: on a player's row an own goal is what he did at the back.
  entry(OWN_GOALS, "defensive", true),
];
