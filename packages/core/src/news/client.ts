// The one I/O in the news layer: fetch a feed, hand back its text.
//
// Text and not a parsed feed, so the mapper stays pure and testable against a
// captured fixture. Everything about what the bytes MEAN is `map.ts`.

/** The BBC's football wire. Their headlines are the ones the sixteen have
 *  already seen, which is exactly what makes them worth an angle. */
export const BBC_FOOTBALL = "https://feeds.bbci.co.uk/sport/football/rss.xml";

export async function fetchFeed(url: string): Promise<string> {
  const response = await fetch(url, { headers: { accept: "application/rss+xml, application/xml" } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.text();
}
