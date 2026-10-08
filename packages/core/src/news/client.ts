// The one I/O in the news layer: fetch a feed and hand back its text, so the mapper stays pure.

import { fetchText } from "../http/get";

export function fetchFeed(url: string): Promise<string> {
  return fetchText(url, "News feed", url, { headers: { accept: "application/rss+xml, application/xml" } });
}
