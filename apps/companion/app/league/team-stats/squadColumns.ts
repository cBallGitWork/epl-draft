import {
  ASSISTS_TOTAL,
  GOALS,
  GOALS_AGAINST,
  MINUTES,
  OWN_GOALS,
  PENALTY_SAVES,
  RED_CARDS,
  SAVES,
  YELLOW_CARDS,
  statCategory,
  type GroupKey,
  type StatCategory,
  type StatKey,
} from "@epl/core";

// The Squad view's columns: counts the stats league keeps for every man, four a group at most so a phone keeps the names.
// A count that is one of the league's categories is headed and named as that category is everywhere else.

export type SquadColumn = StatCategory & { key: StatKey };

export const SQUAD_COLUMNS: readonly SquadColumn[] = [
  { ...statCategory(GOALS, "attacking"), key: "goals" },
  { ...statCategory(ASSISTS_TOTAL, "attacking"), key: "totalAssists" },
  { key: "shots", group: "attacking", label: "Shots", short: "Sh" },
  { key: "keyPasses", group: "attacking", label: "Key passes: passes that led to a shot", short: "KP" },
  { key: "tacklesWon", group: "defensive", label: "Tackles won", short: "TkW" },
  { key: "interceptions", group: "defensive", label: "Interceptions", short: "Int" },
  { key: "clearances", group: "defensive", label: "Clearances", short: "Clr" },
  { key: "recoveries", group: "defensive", label: "Ball recoveries", short: "BR" },
  { ...statCategory(SAVES, "keeping"), key: "saves" },
  { ...statCategory(PENALTY_SAVES, "keeping"), key: "penaltySaves" },
  { ...statCategory(GOALS_AGAINST, "keeping", true), key: "goalsAgainst" },
  { key: "appearances", group: "appearances", label: "Appearances", short: "GP" },
  { key: "starts", group: "appearances", label: "Starts", short: "GS" },
  { ...statCategory(MINUTES, "appearances"), key: "minutes" },
  { ...statCategory(YELLOW_CARDS, "discipline", true), key: "yellowCards" },
  { ...statCategory(RED_CARDS, "discipline", true), key: "redCards" },
  { ...statCategory(OWN_GOALS, "discipline", true), key: "ownGoals" },
  { key: "errorsLeadingToGoal", group: "discipline", label: "Errors leading to a goal", short: "ErG", lowIsGood: true },
];

export function squadColumnsIn(group: GroupKey): SquadColumn[] {
  return SQUAD_COLUMNS.filter((column) => column.group === group);
}
