import type { PeriodRosters } from "@epl/core";

type TeamRoster = PeriodRosters["teams"][number];

/** Before anyone joins, after they join but before the draft, and after it. */
export type LeagueState = "no teams" | "no squads" | "drafted";

export interface WalkLeague {
  state: LeagueState;
  /** The first team, for the id-scoped screens and the served-league check. */
  teamId: string | null;
  teamName: string | null;
  /** A player somebody holds: an invented id would test a 404. */
  playerId: string | null;
  /** Another held man, for Compare beside `playerId`. */
  rivalId: string | null;
}

/** What a walk may expect of a league, from ONE roster read so the answers cannot disagree. */
export function walkLeague(teams: readonly TeamRoster[]): WalkLeague {
  const [first] = teams;
  const held = teams.flatMap((team) => team.slots.map((slot) => slot.fantraxId));
  const [playerId = null] = held;
  return {
    state: first === undefined ? "no teams" : playerId === null ? "no squads" : "drafted",
    teamId: first?.teamId ?? null,
    teamName: first?.teamName || null,
    playerId,
    rivalId: held.find((id) => id !== playerId) ?? null,
  };
}
