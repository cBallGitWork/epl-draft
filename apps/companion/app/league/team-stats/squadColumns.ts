import type { GroupKey, StatCategory, StatKey } from "@epl/core";

// The Squad view's columns: counts the stats league keeps for every man, four a group at most so a phone keeps the names.

export type SquadColumn = StatCategory & { key: StatKey };

export const SQUAD_COLUMNS: readonly SquadColumn[] = [
  { key: "goals", group: "attacking", label: "Goals", short: "G" },
  { key: "totalAssists", group: "attacking", label: "Assists, fantasy assists included", short: "AT" },
  { key: "shots", group: "attacking", label: "Shots", short: "Sh" },
  { key: "keyPasses", group: "attacking", label: "Key passes: passes that led to a shot", short: "KP" },
  { key: "tacklesWon", group: "defensive", label: "Tackles won", short: "TkW" },
  { key: "interceptions", group: "defensive", label: "Interceptions", short: "Int" },
  { key: "clearances", group: "defensive", label: "Clearances", short: "Clr" },
  { key: "recoveries", group: "defensive", label: "Ball recoveries", short: "BR" },
  { key: "saves", group: "keeping", label: "Saves", short: "Sv" },
  { key: "penaltySaves", group: "keeping", label: "Penalties saved", short: "PKS" },
  { key: "goalsAgainst", group: "keeping", label: "Goals conceded in goal", short: "GA", lowIsGood: true },
  { key: "appearances", group: "appearances", label: "Appearances", short: "GP" },
  { key: "starts", group: "appearances", label: "Starts", short: "GS" },
  { key: "minutes", group: "appearances", label: "Minutes", short: "Min" },
  { key: "yellowCards", group: "discipline", label: "Yellow cards", short: "YC", lowIsGood: true },
  { key: "redCards", group: "discipline", label: "Red cards", short: "RC", lowIsGood: true },
  { key: "ownGoals", group: "discipline", label: "Own goals", short: "OG", lowIsGood: true },
  { key: "errorsLeadingToGoal", group: "discipline", label: "Errors leading to a goal", short: "ErG", lowIsGood: true },
];

export function squadColumnsIn(group: GroupKey): SquadColumn[] {
  return SQUAD_COLUMNS.filter((column) => column.group === group);
}
