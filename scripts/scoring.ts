import { fetchLeagueInfo, mapLeagueInfo, type LeagueScoring } from "@epl/core";
import { SCORING_LEAGUE } from "./leagues";

// The scoring the paper and the ratings price their own sums by: the `scoring` league's, as the app's `scoring.ts` reads it.

/** Its rules and its names for them; null when Fantrax would not describe them. */
export async function readScoring(): Promise<LeagueScoring | null> {
  const info = await fetchLeagueInfo(SCORING_LEAGUE.leagueId).then(mapLeagueInfo).catch(() => null);
  return info?.scoring == null ? null : { rules: info.scoring, categories: info.scoringCategories };
}
