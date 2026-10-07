// One item as an RSS feed publishes it: untrusted scraped copy, every field optional, read only by the mapper.

export interface RawNewsItem {
  title?: string;
  link?: string;
  guid?: string;
  description?: string;
  pubDate?: string;
}
