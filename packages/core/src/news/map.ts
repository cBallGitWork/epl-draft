import type { RawNewsItem } from "./raw";

// RSS into something typed, by hand and without an XML dependency. An item it cannot read is dropped, never the run.

export interface NewsItem {
  /** The article's address, the ledger's key: never the raw guid, whose `#0`, `#1` fragment is the feed position. */
  key: string;
  title: string;
  summary: string;
  link: string;
  /** ISO, or null where the feed gave nothing readable; never "now", as an undated item cannot be called fresh. */
  publishedAt: string | null;
}

const ITEM = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;

export function mapNews(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  for (const match of xml.matchAll(ITEM)) {
    const item = fields(match[1]);
    const link = item.link ?? item.guid;
    const title = item.title;
    // An item with no title or no address is not an article we can cover.
    if (title === undefined || title === "" || link === undefined || link === "") continue;

    items.push({
      key: keyOf(item.guid ?? link),
      title,
      summary: item.description ?? "",
      link,
      publishedAt: instant(item.pubDate),
    });
  }
  return dedupe(items);
}

/** The guid less its fragment, which carries the feed POSITION, not the article. */
function keyOf(guid: string): string {
  return guid.split("#")[0];
}

/** First occurrence wins: the feed lists an article again as it moves. */
function dedupe(items: readonly NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.key)) return false;
    seen.add(item.key);
    return true;
  });
}

function fields(block: string): RawNewsItem {
  const read = (tag: string): string | undefined => {
    const found = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(block);
    if (found === null) return undefined;
    return text(found[1]);
  };
  return {
    title: read("title"),
    link: read("link"),
    guid: read("guid"),
    description: read("description"),
    pubDate: read("pubDate"),
  };
}

/** CDATA unwrapped, entities resolved, whitespace collapsed. Only the five
 *  entities a feed actually uses — an exhaustive table would be a parser. */
function text(raw: string): string {
  return raw
    .replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function instant(raw: string | undefined): string | null {
  if (raw === undefined) return null;
  const at = Date.parse(raw);
  return Number.isNaN(at) ? null : new Date(at).toISOString();
}
