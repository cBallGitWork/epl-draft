// The one I/O in the news layer: fetch a feed, hand back its text.
//
// Text and not a parsed feed, so the mapper stays pure and testable against a
// captured fixture. Everything about what the bytes MEAN is `map.ts`.

import { statusError } from "../http/errors";
import { politeFetch } from "../http/fetch";

export async function fetchFeed(url: string): Promise<string> {
  const response = await politeFetch(url, { headers: { accept: "application/rss+xml, application/xml" } });
  if (!response.ok) throw statusError("News feed", url, response.status);
  return response.text();
}
