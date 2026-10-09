import { isActive, isResolved, type Fixture, type ResolvedPlayer, type RosteredTeam } from "@epl/core";
import { involves } from "./round";

// Which of a manager's men count, for the briefs and the picture alike; every man here came through the bridge.

/** A rostered man with a club in the given fixture, active slots only — a
 *  reserve cannot score, so he carries no stake. */
export function menIn(fixture: Fixture, team: RosteredTeam): ResolvedPlayer[] {
  return fielded(team).filter((man) => involves(fixture, man.player.clubId));
}

/** Everyone a manager fielded, resolved. The active filter is the same one every
 *  brief applies: a reserve cannot score, so he is not the face of anything. */
export function fielded(team: RosteredTeam | undefined): ResolvedPlayer[] {
  return (team?.players ?? []).filter(isResolved).filter((man) => isActive(man.slot));
}
