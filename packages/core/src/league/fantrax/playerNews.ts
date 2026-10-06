import { plainText } from "./markup";

// `getPlayerProfile?tab=NEWS_NOTES` → every story filed about one player, each with its body, analysis and timestamp.

/** Only the keys we traverse, every one optional. */
export interface RawNewsSection {
  sectionContent?: {
    NEWS_NOTES?: {
      playerNews?: {
        id?: string;
        headlineNoBrief?: string;
        content?: string;
        analysis?: string;
        /** Epoch milliseconds. */
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
  /** The provider's reading of what it means for a manager; null when filed without one. */
  analysis: string | null;
  /** Epoch milliseconds or null; never a `Date` here, which would read a clock's timezone. */
  at: number | null;
}

/** Every story filed about him, sorted newest first rather than trusted to arrive so; an undated story sinks. */
export function mapPlayerStories(raw: RawNewsSection): PlayerStory[] {
  const stories = raw.sectionContent?.NEWS_NOTES?.playerNews ?? [];
  const out: PlayerStory[] = [];
  for (const story of stories) {
    const content = plainText(story.content) ?? plainText(story.headlineNoBrief);
    if (content === null) continue;
    out.push({
      id: story.id ?? content,
      headline: plainText(story.headlineNoBrief) ?? content,
      content,
      analysis: plainText(story.analysis),
      at: typeof story.newsDate === "number" ? story.newsDate : null,
    });
  }
  return out.sort((a, b) => (b.at ?? -Infinity) - (a.at ?? -Infinity));
}

// `getPlayerNews?poolType=ALL` → the pool's news: a WINDOW of about the last day, newest first, not a story per player.
// No entry means nothing filed lately, not no news; `maxResults` is ignored, and every league gets the same answer.

/** Only the keys we traverse, every one optional. */
export interface RawPoolNews {
  stories?: {
    /** The player the story is about; `scorerId` is our `fantraxId`. */
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

/** The latest story about each man, by Fantrax id: the feed is newest first, so the first wins.
 *  A Record, not a `Map`, because it crosses a cache and a `Map` does not serialise. */
export function mapPoolNews(raw: RawPoolNews): Record<string, PlayerStory> {
  const latest: Record<string, PlayerStory> = {};
  for (const row of raw.stories ?? []) {
    const fantraxId = row.scorerFantasy?.scorerId;
    const story = row.playerNews;
    if (typeof fantraxId !== "string" || fantraxId === "" || story === undefined) continue;
    if (latest[fantraxId] !== undefined) continue;
    const content = plainText(story.content) ?? plainText(story.headlineNoBrief);
    if (content === null) continue;
    latest[fantraxId] = {
      id: story.id ?? content,
      headline: plainText(story.headlineNoBrief) ?? content,
      content,
      analysis: plainText(story.analysis),
      at: typeof story.newsDate === "number" ? story.newsDate : null,
    };
  }
  return latest;
}
