import { unstable_cache } from "next/cache";
import { fetchPlTeamStats, fetchPlTeams, plClubSeason, type PlClubSeason, type RawPlTeamStats } from "@epl/core";
import { CLUB_SEASON_REVALIDATE } from "../../config";

/** Every club's season off the Premier League: the list, then one read per club, cached as one. */
const plClubStats = unstable_cache(
  async (): Promise<RawPlTeamStats[]> => {
    const teams = await fetchPlTeams();
    return Promise.all(teams.content.map((team) => fetchPlTeamStats(team.id)));
  },
  ["pl-club-stats"],
  { revalidate: CLUB_SEASON_REVALIDATE },
);

/** The clubs' seasons, or none when the Premier League will not answer: their columns then print a dash. */
export async function clubSeasons(): Promise<PlClubSeason[]> {
  try {
    return (await plClubStats()).flatMap((raw) => plClubSeason(raw) ?? []);
  } catch {
    return [];
  }
}
