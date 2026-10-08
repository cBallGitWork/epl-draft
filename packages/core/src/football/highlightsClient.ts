import { HIGHLIGHTS_PLAYLIST, YOUTUBE_FEED_BASE } from "../config";
import { fetchText } from "../http/get";

// YouTube's public playlist feed (no key, newest 15 entries): titles and ids only, never a video. Server-side only.

/** The highlights playlist's feed as raw XML; `highlights.ts` parses it. */
export function fetchHighlightsFeed(playlist = HIGHLIGHTS_PLAYLIST): Promise<string> {
  // Throws rather than defaults, so a caller can say "unavailable" rather than "no highlights exist".
  return fetchText(`${YOUTUBE_FEED_BASE}?playlist_id=${playlist}`, "YouTube playlist", playlist);
}
