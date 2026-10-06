import type { Fixture, FootballPlayer } from "../football/types";
import { type RosteredTeam, isResolved } from "./roster";

// Which matches have one of mine in it, by SQUAD membership, never the lineup: who he holds is public, his XI is not.

/** A squad's players in each fixture, by fixture id, names sorted; a fixture with none is absent, not empty.
 *  Only resolved slots appear, since an unresolved one has no club. */
export function fixtureInvolvement(
  team: RosteredTeam,
  fixtures: readonly Fixture[],
): Map<number, FootballPlayer[]> {
  const byClub = new Map<number, FootballPlayer[]>();
  for (const rostered of team.players) {
    if (!isResolved(rostered)) continue;
    const held = byClub.get(rostered.player.clubId);
    if (held === undefined) byClub.set(rostered.player.clubId, [rostered.player]);
    else held.push(rostered.player);
  }

  const involved = new Map<number, FootballPlayer[]>();
  for (const fixture of fixtures) {
    // Both ends of the match: one man at each end is two in this fixture.
    const players = [
      ...(byClub.get(fixture.homeClubId) ?? []),
      ...(byClub.get(fixture.awayClubId) ?? []),
    ];
    if (players.length === 0) continue;
    involved.set(
      fixture.id,
      players.sort((a, b) => a.name.localeCompare(b.name)),
    );
  }
  return involved;
}

/** Who a footballer belongs to in our league. */
export interface PlayerOwner {
  teamId: string;
  teamName: string;
}

/** Every rostered footballer by FPL's season-stable `code` (never the per-season `id`) against the squad holding
 *  him, by membership, never lineup. A man on two rosters mid-trade goes to the first team listed. */
export function owners(teams: readonly RosteredTeam[]): Map<number, PlayerOwner> {
  const owned = new Map<number, PlayerOwner>();
  for (const team of teams) {
    for (const rostered of team.players) {
      if (!isResolved(rostered)) continue;
      if (owned.has(rostered.player.code)) continue;
      owned.set(rostered.player.code, { teamId: team.teamId, teamName: team.teamName });
    }
  }
  return owned;
}
