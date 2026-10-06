// The one I/O in the news layer: fetch a feed and hand back its text, so the mapper stays pure.

import { statusError } from "../http/errors";
import { politeFetch } from "../http/fetch";

export async function fetchFeed(url: string): Promise<string> {
  const response = await politeFetch(url, { headers: { accept: "application/rss+xml, application/xml" } });
  if (!response.ok) throw statusError("News feed", url, response.status);
  return response.text();
}
