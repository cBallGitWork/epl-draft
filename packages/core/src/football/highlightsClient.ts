import { HIGHLIGHTS_PLAYLIST, YOUTUBE_FEED_BASE } from "../config";
import { statusError } from "../http/errors";
import { politeFetch } from "../http/fetch";

// The one read this feature makes, and it is a public RSS feed.
//
// **No API key and no credential.** `videos.xml?playlist_id=…` is the feed
// YouTube publishes for any playlist; the Data API would need a key and is only
// wanted the day somebody asks for a season's back catalogue rather than the
// latest round. It carries the newest 15 entries.
//
// **Nothing here touches a video.** This reads a list of titles and ids; the
// video itself is played by YouTube's own embedded player, in their iframe, from
// their servers. We neither fetch nor re-host a frame of it.
//
// Server-side only, like every other client in this package. Freshness is the
// caller's business — `plFeed.ts` wraps this on the same thirty seconds as the
// rest, so sixteen managers refreshing cost one request between them.

/** The rights holder's highlights playlist, as the feed's XML.
 *
 *  Returned as TEXT rather than parsed here, which is the split every adapter in
 *  this package makes: I/O in the client, meaning in the mapper. `highlights.ts`
 *  is the mapper and is pure. */
export async function fetchHighlightsFeed(playlist = HIGHLIGHTS_PLAYLIST): Promise<string> {
  const res = await politeFetch(`${YOUTUBE_FEED_BASE}?playlist_id=${playlist}`);
  // Loudly, like the others: a caller that catches this can say highlights are
  // unavailable, where a default would print silence as "no highlights exist".
  if (!res.ok) throw statusError("YouTube playlist", playlist, res.status);
  return await res.text();
}
