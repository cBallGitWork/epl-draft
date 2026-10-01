import type { GroupKey } from "./categories";
import { ASSISTS_FANTASY, ASSISTS_OFFICIAL, ASSISTS_TOTAL, KEEPER_POINTS, SAVES } from "./categoryNames";

// The categories a league can pay a player for, keyed by getPlayerStats' column abbreviation: a squad's Stats board.

/** A category the squad board can show, under Fantrax's own column abbreviation: `G`, `AF`, `CS`. */
export interface PlayerCategory {
  key: string;
  group: GroupKey;
  label: string;
  /** True when a low count is the better one. */
  lowIsGood?: boolean;
  /** The other half's name for the same fact; read as a fallback, never added, as a man is in one half only. */
  also?: string;
}

/** Ordered as a reader looks for them: his time on the pitch, then going forward, at the back, and what he did wrong. */
export const PLAYER_CATEGORIES: readonly PlayerCategory[] = [
  { key: "Min", group: "appearances", label: "Minutes played" },
  { key: "G", group: "attacking", label: "Goals" },
  { key: ASSISTS_TOTAL.short, group: "attacking", label: "Assists (total)" },
  { key: ASSISTS_OFFICIAL.short, group: "attacking", label: "Assists" },
  { key: ASSISTS_FANTASY.short, group: "attacking", label: "Assists (fantasy)" },
  { key: "PKM", group: "attacking", label: "Penalties missed", lowIsGood: true },
  { key: "CS", group: "defensive", label: "Clean sheets" },
  { key: "DFP", group: "defensive", label: "DefCon: tackles won, interceptions and blocks" },
  { key: "DFP3", group: "defensive", label: "DefCon: tackles won, interceptions, blocks, clearances and recoveries" },
  { key: SAVES.short, group: "defensive", label: "Saves" },
  { key: KEEPER_POINTS.short, group: "defensive", label: "Keeper actions" },
  { key: "PKS", group: "defensive", label: "Penalties saved" },
  // A keeper's read calls it GA and an outfielder's GAO: one fact, one column.
  { key: "GA", group: "defensive", label: "Goals against", lowIsGood: true, also: "GAO" },
  { key: "YC", group: "discipline", label: "Yellow cards", lowIsGood: true },
  { key: "RC", group: "discipline", label: "Red cards", lowIsGood: true },
  // Defensive, not discipline (Craig, 2 Sep): on a player's row an own goal is what he did at the back.
  { key: "OG", group: "defensive", label: "Own goals", lowIsGood: true },
];
