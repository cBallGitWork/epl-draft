import { FANTRAX_LEAGUE_ID, FantraxError, type PlayerStory, fetchPoolNews, mapPoolNews } from "@epl/core";
import { leagueCache } from "./leagueCache";
import { orRefusal } from "./refusals";

// The pool's last day or so of news in one cached read, where a story per man would be a request per man. A refusal
// costs the card its news and nothing else.

export const readPoolNews = leagueCache("pool-news", async (): Promise<Record<string, PlayerStory>> => {
  const raw = await orRefusal(fetchPoolNews(FANTRAX_LEAGUE_ID));
  return raw instanceof FantraxError ? {} : mapPoolNews(raw);
}, () => ({}));

/** The stories for the men on one screen, so the browser is not handed the whole pool's. */
export function newsFor(
  stories: Record<string, PlayerStory>,
  fantraxIds: readonly string[],
): Record<string, PlayerStory> {
  const mine: Record<string, PlayerStory> = {};
  for (const id of fantraxIds) {
    const story = stories[id];
    if (story !== undefined) mine[id] = story;
  }
  return mine;
}
