import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { mapNews } from "./map";

const FIXTURE = fileURLToPath(new URL("./__fixtures__/bbc-football.xml", import.meta.url));
const xml = readFileSync(FIXTURE, "utf8");

describe("mapNews", () => {
  it("reads the feed we actually captured", () => {
    const items = mapNews(xml);
    // Counted, never quoted: the fixture holds 77 items and five of them are
    // the same articles re-listed, so the mapped count is what survives
    // dedupe rather than a number written down.
    expect(items.length).toBeGreaterThan(60);
    expect(items.length).toBeLessThan(77);

    const [first] = items;
    expect(first.title).toBe("Forest complete £22m Munoz signing from Palace");
    expect(first.summary).toContain("Nottingham Forest complete");
    expect(first.link).toContain("bbc.co.uk/sport/football/articles/");
    expect(first.publishedAt).toBe("2026-08-31T12:30:45.000Z");
  });

  it("keys on the article and not on its place in the feed", () => {
    // The BBC's guid carries a positional fragment — the same article comes
    // back as #0, then #1 as it moves — so a raw-guid key double-covers.
    const items = mapNews(xml);
    expect(items[0].key).not.toContain("#");
    expect(new Set(items.map((item) => item.key)).size).toBe(items.length);
  });

  it("unwraps CDATA and resolves the entities a feed actually uses", () => {
    const items = mapNews(`<rss><channel>
      <item><title><![CDATA[Wolves &amp; Spurs go 1&lt;2]]></title><link>x</link>
      <description>He said &quot;no&quot; &#39;twice&#39;</description></item>
    </channel></rss>`);
    expect(items[0].title).toBe("Wolves & Spurs go 1<2");
    expect(items[0].summary).toBe(`He said "no" 'twice'`);
  });

  it("drops what it cannot use rather than carrying half an item", () => {
    const items = mapNews(`<rss><channel>
      <item><description>No title, no link</description></item>
      <item><title>Titled</title></item>
      <item><title>Whole</title><link>https://x/y</link></item>
    </channel></rss>`);
    expect(items.map((item) => item.title)).toEqual(["Whole"]);
  });

  it("says nothing rather than guessing when the date is unreadable", () => {
    // A wire item we cannot date is one the desk cannot call fresh, and "now"
    // would be the confident wrong answer.
    const items = mapNews(`<rss><channel>
      <item><title>T</title><link>l</link><pubDate>whenever</pubDate></item>
    </channel></rss>`);
    expect(items[0].publishedAt).toBeNull();
  });

  it("answers rubbish with an empty wire", () => {
    expect(mapNews("")).toEqual([]);
    expect(mapNews("<html><body>not a feed</body></html>")).toEqual([]);
  });
});
