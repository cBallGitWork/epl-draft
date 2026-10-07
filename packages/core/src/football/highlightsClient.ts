import { HIGHLIGHTS_PLAYLIST, YOUTUBE_FEED_BASE } from "../config";
import { statusError } from "../http/errors";
import { politeFetch } from "../http/fetch";

// YouTube's public playlist feed (no key, newest 15 entries): titles and ids only, never a video. Server-side only.

/** The highlights playlist's feed as raw XML; `highlights.ts` parses it. */
export async function fetchHighlightsFeed(playlist = HIGHLIGHTS_PLAYLIST): Promise<string> {
  const res = await politeFetch(`${YOUTUBE_FEED_BASE}?playlist_id=${playlist}`);
  // Throws rather than defaults, so a caller can say "unavailable" rather than "no highlights exist".
  if (!res.ok) throw statusError("YouTube playlist", playlist, res.status);
  return await res.text();
}
