// One item as an RSS feed publishes it. Scraped data, treated as untrusted:
// every field optional in spirit, and the mapper is the only place the two
// meet.
//
// This is a THIRD source, and deliberately not a third layer. The football
// layer is FPL and the league layer is Fantrax; a news wire is neither — it is
// copy somebody else wrote, quarantined at the edge, and nothing in the app
// ever keys on it. Its only job is to tell the paper that something happened
// in the real world that the sixteen would want an angle on.

export interface RawNewsItem {
  title?: string;
  link?: string;
  guid?: string;
  description?: string;
  pubDate?: string;
}
