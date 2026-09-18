import { isActive, isResolved, type Fixture, type ResolvedPlayer, type RosteredTeam } from "@epl/core";

// Which of a manager's men count, here.
//
// Its own file because both halves of the old `assemble.ts` need it — the brief
// builders and the picture — and a shared helper living inside one of them
// would make the other import a module about a different job. Split out when
// `assemble.ts` passed the 300-line ceiling on 18 Sep 2026.
//
// Everything here went through the bridge in `resolveRosters`; nothing matches
// a name.

/** A rostered man with a club in the given fixture, active slots only — a
 *  reserve cannot score, so he carries no stake. */
export function menIn(fixture: Fixture, team: RosteredTeam) {
  return team.players
    .filter(isResolved)
    .filter((man) => isActive(man.slot))
    .filter(
      (man) => man.player.clubId === fixture.homeClubId || man.player.clubId === fixture.awayClubId,
    );
}

/** Everyone a manager fielded, resolved. The active filter is the same one every
 *  brief applies: a reserve cannot score, so he is not the face of anything. */
export function fielded(team: RosteredTeam | undefined): ResolvedPlayer[] {
  return (team?.players ?? []).filter(isResolved).filter((man) => isActive(man.slot));
}
