import { fetchFixtures, type Club } from "@epl/core";

// The round's fixtures as club pairs, for the columns that print a match rather
// than report one.

/** Two clubs and when they play. */
interface RoundTie {
  home: Club;
  away: Club;
  kickoff: string;
}

/** The round's ties, in FPL's own order. A match whose clubs or kickoff FPL has
 *  not published is dropped; it cannot be printed either way. */
export async function roundTies(
  gameweek: number,
  clubs: ReadonlyMap<number, Club>,
): Promise<RoundTie[]> {
  // `team_h`/`team_a` are FPL's per-season ids, which is what `Club.id` carries.
  const byId = new Map([...clubs.values()].map((club) => [club.id, club]));
  const fixtures = await fetchFixtures(gameweek).catch(() => []);
  return fixtures.flatMap((fixture) => {
    const home = byId.get(fixture.team_h);
    const away = byId.get(fixture.team_a);
    const kickoff = fixture.kickoff_time;
    return home === undefined || away === undefined || kickoff === null
      ? []
      : [{ home, away, kickoff }];
  });
}
