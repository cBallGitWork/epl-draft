import recorded from "../../../data/leagues/recorded.json";

/** The league recorded under the `stats` role, listing every column at no points so the served
 *  league need not. Named in data, as `npm run stats` names it, so both read the same league. */
export const STATS_LEAGUE = recorded.leagues.find((league) => league.key === recorded.stats)?.leagueId ?? null;
