// `getPlayerNews` → what is being said about the players in this league's pool.
//
// **It ignores `playerId` and answers for the whole pool**, which is the whole
// reason it is worth a read: one 94 KB request carries the latest story for every
// player anybody has news about — 74 of them on 4 Sep 2026 — so a screen about
// one man costs nothing beyond the first tap on any man.
//
// **The story is WHOLE here, and gated on the profile.** `getPlayerProfile`'s
// `latestNews` is one truncated sentence beside "Analysis available to registered
// users". The same story arrives on this endpoint with its full `content`, its
// full `analysis` and a real timestamp, unauthenticated. That is the difference
// between a headline and a report, and it is why the player screen reads this
// rather than the profile's own line.
//
// **`poolType` is required and the value barely matters.** The call is refused
// outright without it — `MISSING_PARAM: poolType, must be 'POOL' or 'ALL' or
// 'WATCH_LIST'` — and `POOL` and `ALL` returned byte-identical 94 KB responses
// while `WATCH_LIST` returned 85 bytes and nothing. Probed 4 Sep 2026.
//
// One story per player, not a history: 74 stories across 74 distinct players.
// A screen may say "the latest" and may not say "his news this season".

/** Only the keys we traverse. Every one is optional: this is a scraped payload
 *  and `raw.ts`'s rule applies to it as much as to the rest of the adapter. */
export interface RawPlayerNews {
  stories?: {
    scorerFantasy?: { scorerId?: string };
    playerNews?: {
      id?: string;
      headlineNoBrief?: string;
      content?: string;
      analysis?: string;
      /** Epoch milliseconds. The one date in this adapter that arrives as a
       *  number rather than as one of Fantrax's unparseable strings. */
      newsDate?: number;
    };
  }[];
}

/** One story about one player, as Fantrax's provider filed it. */
export interface PlayerStory {
  /** Their id for the man, which is our join key. */
  fantraxId: string;
  /** The provider's own headline, already elided with an ellipsis by them. */
  headline: string;
  /** The story itself, whole. */
  content: string;
  /** The provider's reading of what it means for a fantasy manager. Null when
   *  they filed a story without one. */
  analysis: string | null;
  /** Epoch milliseconds, or null. Never turned into a Date here — this file is
   *  pure and a Date is a reading of a clock's timezone. */
  at: number | null;
}

/** Every story in the payload, keyed by nothing and filtered by the caller.
 *
 *  A story with no player or no words is dropped rather than rendered empty: the
 *  join key is the only thing that makes one of these attributable at all. */
export function mapPlayerNews(raw: RawPlayerNews): PlayerStory[] {
  const out: PlayerStory[] = [];
  for (const story of raw.stories ?? []) {
    const fantraxId = story.scorerFantasy?.scorerId;
    const news = story.playerNews;
    const content = text(news?.content) ?? text(news?.headlineNoBrief);
    if (!fantraxId || content === null) continue;
    out.push({
      fantraxId,
      headline: text(news?.headlineNoBrief) ?? content,
      content,
      analysis: text(news?.analysis),
      at: typeof news?.newsDate === "number" ? news.newsDate : null,
    });
  }
  return out;
}

/** Tags out, because Fantrax puts them inside its own strings elsewhere in the
 *  same API and a provider string reaching a template with markup in it is
 *  either printed as angle brackets or trusted. */
function text(value: string | undefined): string | null {
  if (typeof value !== "string") return null;
  const stripped = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return stripped === "" ? null : stripped;
}
