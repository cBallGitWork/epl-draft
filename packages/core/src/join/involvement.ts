import type { Fixture, FootballPlayer } from "../football/types";
import { type RosteredTeam, isResolved } from "./roster";

// "Which of these ten matches has one of mine in it" — the question a manager
// asks of a fixture list and the app had no answer to. A round of football was
// rendered identically for the man with three players at the Emirates and the
// man with none.
//
// Keyed off SQUAD membership, never off the lineup. Who a manager holds is
// public all week; how he has arranged them is not, and the two must not be
// confused here of all places — this map crosses into a view that renders every
// team's football side by side.

/** Which of a squad's players appear in each fixture, by squad membership.
 *
 *  Keyed by fixture id, and a fixture with none of his players in it is absent
 *  rather than present-and-empty: the caller's question is "is this one mine",
 *  and an empty array is a yes-shaped answer meaning no.
 *
 *  Only resolved slots can appear — an unbridged or unmapped slot has no club to
 *  match on. That is a silent shortfall by design: the squad screen is where a
 *  slot with no footballer behind it is explained, and repeating it on every
 *  fixture row would be noise on a screen about football rather than about us.
 *
 *  Names sort alphabetically so the same match reads the same way twice. */
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
    // Both sides of the same match: a manager holding one player at each end has
    // two in this fixture, and the row says two.
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

/** Every rostered footballer, keyed by FPL's season-stable `code`, against the
 *  squad holding him.
 *
 *  What it is for: a goal on the fixture list is a fact about the Premier
 *  League, and in a sixteen-man draft league it is also somebody's afternoon.
 *  Tagging the scorer is the cheapest thing in the app that makes a round of
 *  football read as *our* round of football.
 *
 *  `code` rather than `id`, because `id` is recycled every summer (CODE_RULES
 *  §3) and this map is built from the same snapshot the view renders — the rule
 *  costs nothing to keep here and is the one worth never making an exception to.
 *
 *  Squad membership again, not lineups: this says whose player he is, never
 *  whether that manager started him.
 *
 *  A player on two rosters at once cannot be represented and is not modelled —
 *  the first team listed keeps him. Fantrax's rosters are one-to-one and a
 *  half-completed trade showing otherwise is their transient, not our fact. */
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
