import type { Club, Fixture } from "@epl/core";

// A round's fixtures as club pairs, for the columns that print a match rather than report one, and whether a club
// plays in a fixture.

/** Whether a club plays in a fixture, home or away. Club ids are FPL's per-season ids. */
export function involves(fixture: Pick<Fixture, "homeClubId" | "awayClubId">, clubId: number): boolean {
  return fixture.homeClubId === clubId || fixture.awayClubId === clubId;
}

/** Two clubs and when they play. */
interface RoundTie {
  home: Club;
  away: Club;
  kickoff: string;
}

/** The round's ties, in FPL's own order. A match whose clubs or kickoff FPL has
 *  not published is dropped; it cannot be printed either way. */
export function roundTies(
  gameweek: number,
  clubs: ReadonlyMap<number, Club>,
  season: readonly Fixture[],
): RoundTie[] {
  // Club ids are FPL's per-season ids, which is what `Club.id` carries.
  const byId = new Map([...clubs.values()].map((club) => [club.id, club]));
  return season.flatMap((fixture) => {
    if (fixture.gameweek !== gameweek) return [];
    const home = byId.get(fixture.homeClubId);
    const away = byId.get(fixture.awayClubId);
    const kickoff = fixture.kickoff;
    return home === undefined || away === undefined || kickoff === null
      ? []
      : [{ home, away, kickoff }];
  });
}
