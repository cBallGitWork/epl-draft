import type { MatchSheetLine } from "@epl/core";

// The Fantasy panel's categories, keyed by Fantrax's own codes (`getLeagueInfo`'s scoring table names them).
// A scaffold (Craig, 23 Sep 2026: *"il add the categories later"*): the event counts one match can give.

interface FantasyCategory {
  /** Fantrax's code for it, so the league's scoring can decide later which of these count. */
  code: string;
  label: string;
  of: (line: MatchSheetLine) => number;
}

export const FANTASY_CATEGORIES: readonly FantasyCategory[] = [
  { code: "G", label: "Goals", of: (line) => line.goals },
  { code: "A", label: "Assists", of: (line) => line.assists },
  { code: "Sv", label: "Saves", of: (line) => line.saves },
  { code: "PKS", label: "Penalties saved", of: (line) => line.penaltiesSaved },
  { code: "PKM", label: "Penalties missed", of: (line) => line.penaltiesMissed },
  { code: "OG", label: "Own goals", of: (line) => line.ownGoals },
  { code: "YC", label: "Yellow cards", of: (line) => line.yellowCards },
  { code: "RC", label: "Red cards", of: (line) => line.redCards },
];
