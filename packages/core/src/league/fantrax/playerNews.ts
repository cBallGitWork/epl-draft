// `getPlayerProfile?tab=NEWS_NOTES` → everything that has been written about one
// player, newest first.
//
// **`tab` is the parameter, and finding it opened five sections.** The payload's
// own `sections` list names `OVERVIEW`, `STATS`, `SPLITS`, `GAME_LOG_FANTASY`,
// `GAME_LOG`, `NEWS_NOTES`, `TRANSACTIONS_FANTASY`, `TEAM_SERVICE_TIME` and
// `TRANSACTIONS`, and only `OVERVIEW` ever came back. `section`, `sectionCode`,
// `view`, `selectedSection`, `displayedSection`, `sectionType`, `contentSection`,
// `pageSection`, `sectionName`, `selectedTab` and `activeSection` were each tried
// and each ignored — the response was byte-identical every time. `tab` is the
// name, probed 4 Sep 2026, and it takes the `code` off that same list.
//
// **This is a HISTORY, where the pool feed was a headline.** `getPlayerNews`
// returns the whole pool's latest — one story per player — and
// `getPlayerProfile`'s `latestNews` returns one sentence of it with the analysis
// behind a login. This returns every story filed about him, each with its full
// body, its full analysis and a real timestamp.

/** Only the keys we traverse. Every one optional: scraped payload, `raw.ts`'s
 *  rule. */
export interface RawNewsSection {
  sectionContent?: {
    NEWS_NOTES?: {
      playerNews?: {
        id?: string;
        headlineNoBrief?: string;
        content?: string;
        analysis?: string;
        /** Epoch milliseconds — the one date in this adapter that is a number
         *  rather than one of Fantrax's unparseable strings. */
        newsDate?: number;
      }[];
    };
  };
}

/** One story about him, as Fantrax's provider filed it. */
export interface PlayerStory {
  /** Their id for it, which is what makes two stories on the same day distinct. */
  id: string;
  /** The provider's own headline. */
  headline: string;
  /** The story itself, whole. */
  content: string;
  /** The provider's reading of what it means for a manager. Null when they filed
   *  a story without one. */
  analysis: string | null;
  /** Epoch milliseconds, or null. Never made a `Date` here — this file is pure
   *  and a `Date` is a reading of a clock's timezone. */
  at: number | null;
}

/** Every story filed about him, newest first.
 *
 *  Sorted rather than trusted: the payload arrives newest-first today and that is
 *  an observation about it, not a promise. A story with no date sinks, because it
 *  cannot be shown to be recent and putting it on top would claim that it is. */
export function mapPlayerStories(raw: RawNewsSection): PlayerStory[] {
  const stories = raw.sectionContent?.NEWS_NOTES?.playerNews ?? [];
  const out: PlayerStory[] = [];
  for (const story of stories) {
    const content = text(story.content) ?? text(story.headlineNoBrief);
    if (content === null) continue;
    out.push({
      id: story.id ?? content,
      headline: text(story.headlineNoBrief) ?? content,
      content,
      analysis: text(story.analysis),
      at: typeof story.newsDate === "number" ? story.newsDate : null,
    });
  }
  return out.sort((a, b) => (b.at ?? -Infinity) - (a.at ?? -Infinity));
}

/** Tags out, because Fantrax puts them inside its own strings elsewhere in this
 *  same API — `<b>test4</b>` is a real cell value on the transactions section —
 *  and a provider string reaching a template with markup in it is either printed
 *  as angle brackets or trusted. */
function text(value: string | undefined): string | null {
  if (typeof value !== "string") return null;
  const stripped = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return stripped === "" ? null : stripped;
}

// `getPlayerNews?poolType=ALL` → the pool's news, and it is a DIFFERENT object
// from the history above.
//
// **It is a WINDOW, not one story per player.** Probed 21 Sep 2026: 74 stories,
// 74 distinct players, newest 07:39 that morning and oldest 14:39 the day
// before — about seventeen hours of the whole pool, newest first, against a pool
// of some 611 men. So a player with no entry is one nothing was filed about
// today, never one with no news; `fetchPlayerStories` is the only route to a
// history.
//
// `maxResults` is ignored — 500 answered the same 74 — so there is no page to
// ask for and the count is simply what there is. Both leagues answered the
// identical 74 on the same second, so this is pool data wearing a league id:
// `poolType` is required and refuses the call without it (`MISSING_PARAM`,
// "Must be 'POOL' or 'ALL' or 'WATCH_LIST'"), and `POOL` and `ALL` returned
// byte-identical payloads.

/** Only the keys we traverse. Every one optional: scraped payload, `raw.ts`'s
 *  rule. */
export interface RawPoolNews {
  stories?: {
    /** The player the story is about. `scorerId` is our `fantraxId`. */
    scorerFantasy?: { scorerId?: string };
    playerNews?: {
      id?: string;
      headlineNoBrief?: string;
      content?: string;
      analysis?: string;
      newsDate?: number;
    };
  }[];
}

/** The latest story about each man, by Fantrax id.
 *
 *  A record and not a `Map`, because this crosses a cache boundary and a `Map`
 *  does not survive serialisation — the same rule `LiveSquadPoints` follows.
 *
 *  **First wins, and that is the newest.** The feed arrives newest-first; a
 *  second story about the same man would be the older one. Nothing in the probe
 *  had two, so this is the rule rather than a case that has been seen. */
export function mapPoolNews(raw: RawPoolNews): Record<string, PlayerStory> {
  const latest: Record<string, PlayerStory> = {};
  for (const row of raw.stories ?? []) {
    const fantraxId = row.scorerFantasy?.scorerId;
    const story = row.playerNews;
    if (typeof fantraxId !== "string" || fantraxId === "" || story === undefined) continue;
    if (latest[fantraxId] !== undefined) continue;
    const content = text(story.content) ?? text(story.headlineNoBrief);
    if (content === null) continue;
    latest[fantraxId] = {
      id: story.id ?? content,
      headline: text(story.headlineNoBrief) ?? content,
      content,
      analysis: text(story.analysis),
      at: typeof story.newsDate === "number" ? story.newsDate : null,
    };
  }
  return latest;
}
