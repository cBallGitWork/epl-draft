import type { RawNewsItem } from "./raw";

// RSS into something typed, by hand.
//
// **No XML dependency, on CODE_RULES §2.** A feed item is five fields inside
// one repeated tag, and the whole reader is forty lines — a parser library
// would be a dependency, a supply chain and a version to keep, bought to save
// a regular expression. If a feed ever needs real XML this is the file that
// says so by failing honestly: an item it cannot read is one it drops.
//
// Tolerant by design. Feeds change shape without telling anybody, and a wire
// we cannot parse must cost the paper a section rather than the run.

export interface NewsItem {
  /** The article's own address, fragment stripped — the ledger's key.
   *
   *  **Not the raw guid.** The BBC re-lists one article under positional
   *  fragments (`…/cn5d7k4nkyvo#0`, then `#1` when it moves up the feed), so
   *  the raw guid double-covers: five of one 77-item sample were the same
   *  articles twice. Probed 31 Aug, recorded in PLATFORM_NOTES. */
  key: string;
  title: string;
  summary: string;
  link: string;
  /** ISO, or null where the feed gave nothing readable. Null is not "now": a
   *  wire item we cannot date is one the desk cannot call fresh. */
  publishedAt: string | null;
}

const ITEM = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;

export function mapNews(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  for (const match of xml.matchAll(ITEM)) {
    const item = fields(match[1]);
    const link = item.link ?? item.guid;
    const title = item.title;
    // An item with no title or no address is not an article we can cover or
    // cite, and there is nothing to be gained by carrying half of one.
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

/** The fragment carries the feed POSITION, not the article, so it is stripped
 *  before the key is taken. */
function keyOf(guid: string): string {
  return guid.split("#")[0];
}

/** First occurrence wins: the feed lists the same article again as it moves,
 *  and the earlier entry is the one already reasoned about. */
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
