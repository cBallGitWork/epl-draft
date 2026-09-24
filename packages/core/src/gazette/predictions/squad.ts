import { PREDICTIONS } from "../../config";
import { projectedTotal, type ProjectedPlayer } from "../../football/intel/projections";
import type { PlannerRow } from "../../football/intel/strength";
import { availabilityOf } from "../../football/playerState";
import type { Club } from "../../football/types";
import { isResolved, type RosteredTeam } from "../../join/roster";
import type { SquadMan } from "./sides";

// A manager's squad joined for Lawro: every man he holds, whatever slot he fills. The slot is the
// line-up and the line-up is private until the lock, so a slot's status and position are never read.

export interface SquadJoin {
  /** League eligibility by Fantrax id, e.g. ["F", "M"]. */
  eligible: ReadonlyMap<string, readonly string[]>;
  projections: ReadonlyMap<number, ProjectedPlayer>;
  /** The round and the few after it, for who matters most. */
  horizon: readonly number[];
  /** This round's planner row for each club id, in each view. */
  attack: ReadonlyMap<number, PlannerRow>;
  defence: ReadonlyMap<number, PlannerRow>;
  clubs: ReadonlyMap<number, Club>;
  /** The club's name as the brief prints it. */
  clubName: (club: Club) => string;
}

export function squadMen(team: RosteredTeam, join: SquadJoin): SquadMan[] {
  return team.players.filter(isResolved).map(({ slot, player }) => {
    const positions = join.eligible.get(slot.fantraxId) ?? [];
    const row = (positions.some((position) => position === "G" || position === "D") ? join.defence : join.attack).get(player.clubId);
    const club = join.clubs.get(player.clubId);
    const projection = join.projections.get(player.code);
    return {
      name: player.name,
      club: club === undefined ? "" : join.clubName(club),
      positions,
      horizon: projection === undefined ? null : projectedTotal(projection, join.horizon),
      availability: availabilityOf(player),
      fixtures: (row?.cells[0] ?? []).map((cell) => ({ opponent: join.clubName(cell.opponent), home: cell.home })),
      ease: row?.mean ?? null,
      liverpool: club?.code === PREDICTIONS.liverpoolCode,
    };
  });
}
