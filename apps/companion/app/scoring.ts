import { FantraxError, type LeagueScoring, fetchLeagueInfo, mapLeagueInfo, scoringOf } from "@epl/core";
import recorded from "../../../data/leagues/recorded.json";
import { leagueCache } from "./leagueCache";
import { orRefusal } from "./refusals";

// The scoring every point the app works out for itself is priced by: the league recorded under the `scoring` role,
// whichever league is served. Fantrax's own points stay the served league's.

export const SCORING_LEAGUE = recorded.leagues.find((league) => league.key === recorded.scoring)?.leagueId ?? null;

/** Its rules and its names for them; null when the role names no league or Fantrax described no scoring. */
export const leagueScoring = leagueCache("league-scoring",
  async (): Promise<LeagueScoring | null> => {
    if (SCORING_LEAGUE === null) return null;
    const raw = await orRefusal(fetchLeagueInfo(SCORING_LEAGUE));
    return raw instanceof FantraxError ? null : scoringOf(mapLeagueInfo(raw));
  },
  () => null,
);
