import { FANTRAX_LEAGUE_ID, FantraxError, type PlayerStory, fetchPoolNews, mapPoolNews } from "@epl/core";
import { leagueCache } from "./leagueCache";
import { orRefusal } from "./refusals";

// The pool's last day of news, read once and cached for every screen on it.
//
// **One read, not one per man.** A team sheet is fifteen players and a
// head-to-head is thirty, and `fetchPlayerStories` is a request per player; this
// endpoint answers the whole pool in one. The trade is that it only knows about
// the last seventeen hours or so — which is the right window for a card read on
// a matchday and the wrong one for a history, so the player screen still reads
// its own.
//
// A news read we cannot make costs the card its news panel and nothing else.

export const readPoolNews = leagueCache("pool-news", async (): Promise<Record<string, PlayerStory>> => {
  const raw = await orRefusal(fetchPoolNews(FANTRAX_LEAGUE_ID));
  return raw instanceof FantraxError ? {} : mapPoolNews(raw);
});

/** The stories for the men on one screen, and nothing else.
 *
 *  The cached read is the whole pool's; a page hands 74 stories to the browser
 *  otherwise, to show at most one of them. */
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
