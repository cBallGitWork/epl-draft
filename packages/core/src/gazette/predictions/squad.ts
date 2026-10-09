import { PREDICTIONS } from "../../config";
import { projectedTotal, type ProjectedPlayer } from "../../football/intel/projections";
import type { PlannerRow, StrengthPlaces } from "../../football/intel/strength";
import { availabilityOf } from "../../football/playerState";
import type { Club } from "../../football/types";
import { isResolved, type RosteredTeam } from "../../join/roster";
import { isBack } from "../sheets/sheet";
import type { RecentGame, SquadMan } from "./sides";

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
  standing: StrengthPlaces;
  /** Each man's last finished gameweeks by FPL's per-season id, oldest first. */
  recent: ReadonlyMap<number, readonly RecentGame[]>;
}

export function squadMen(team: RosteredTeam, join: SquadJoin): SquadMan[] {
  return team.players.filter(isResolved).map(({ slot, player }) => {
    const positions = join.eligible.get(slot.fantraxId) ?? [];
    const back = positions.some(isBack);
    const row = (back ? join.defence : join.attack).get(player.clubId);
    const club = join.clubs.get(player.clubId);
    const projection = join.projections.get(player.code);
    return {
      name: player.name,
      club: club === undefined ? "" : join.clubName(club),
      positions,
      horizon: projection === undefined ? null : projectedTotal(projection, join.horizon),
      availability: availabilityOf(player),
      fixtures: (row?.cells[0] ?? []).map((cell) => ({
        opponent: join.clubName(cell.opponent),
        home: cell.home,
        standing: standing(cell.opponent.code, back ? "attack" : "defence", join.standing),
      })),
      ease: easeOf(row, join.standing.attack.size > 0),
      liverpool: club?.code === PREDICTIONS.liverpoolCode,
      recent: join.recent.get(player.id) ?? [],
      face: { code: player.code, name: player.name, clubId: player.clubId, position: positions.includes("G") ? "G" : null },
    };
  });
}

/** His line's ease this round: null when nobody he plays is rated, and a blank's the hardest only when clubs are. */
function easeOf(row: PlannerRow | undefined, rated: boolean): number | null {
  const round = row?.cells[0];
  if (row === undefined || round === undefined) return null;
  return (round.length === 0 ? rated : round.some((cell) => cell.rank !== null)) ? row.mean : null;
}

/** An opponent's standing at what this man faces, in an old man's words, and only at the extremes. */
export function standing(code: number, measure: "attack" | "defence", table: SquadJoin["standing"]): string | null {
  const place = table[measure].get(code);
  const size = table[measure].size;
  if (place === undefined) return null;
  const words = measure === "attack" ? ["a dangerous attack", "a weak attack"] : ["a tough defence to score against", "a soft defence"];
  if (place <= PREDICTIONS.extremes) return words[0];
  if (place > size - PREDICTIONS.extremes) return words[1];
  return null;
}
