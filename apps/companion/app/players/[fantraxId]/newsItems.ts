import type { PlayerStory } from "@epl/core";

// Everything written about him this football year, as an inbox.
//
// **`newsItems.ts`, not `inbox.ts`, and the reason is the filesystem.** macOS is
// case-insensitive, so a model beside its component collides — `Inbox.tsx` and
// `inbox.ts` are one path to it, and tsc reports "differs only in casing" from
// inside the program it has already loaded twice. `MatchLog.tsx` and
// `matchRows.ts` are the same pairing for the same reason.
//
// **Fantrax's stories and nothing else** (Craig, 4 Sep 2026: "Remove the FPL
// part"). FPL publishes one availability line, which is a STATE — whether he can
// play — and not a story about him; it belongs to the badge and the pitch, where
// `availabilityOf` already answers it. Mixing a state into a list of dated
// reports made the newest item a sentence saying nothing had happened.
//
// The history is `getPlayerProfile?tab=NEWS_NOTES`. Suzuki's runs from his
// transfer from Parma on 19 August to his debut against Arsenal on 1 September.

export interface NewsItem {
  /** Fantrax's own id for the story, so two on one day stay distinct. */
  id: string;
  /** The line a reader scans. */
  headline: string;
  /** The whole of it. */
  body: string;
  /** The provider's reading of what it means for a manager. Often absent. */
  analysis: string | null;
  /** Epoch milliseconds, or null. Sorted on, so a dateless item sinks. */
  at: number | null;
}

/** His items, newest first (Craig, 4 Sep 2026: "Most recent for news and
 *  transfers should be at the top").
 *
 *  A dateless item goes last rather than first: it cannot be shown to be recent,
 *  and putting it at the top would be claiming that it is. */
export function inbox(stories: readonly PlayerStory[]): NewsItem[] {
  return stories
    .map((story) => ({
      id: story.id,
      headline: whole(story.headline, story.content),
      body: story.content,
      analysis: story.analysis,
      at: story.at,
    }))
    .sort((a, b) => (b.at ?? -Infinity) - (a.at ?? -Infinity));
}

/** The note after its headline, as paragraphs: the rest of the story, then the provider's analysis. */
export function noteBody(item: NewsItem): string[] {
  const rest = item.body.startsWith(item.headline) ? item.body.slice(item.headline.length).trim() : item.body;
  return [rest, item.analysis].filter((part): part is string => part !== null && part.trim() !== "");
}

/** The whole story as paragraphs, said once: its text (after the headline where it does not open with it), then the analysis. */
export function storyText(item: NewsItem): string[] {
  const opening = item.body.startsWith(item.headline) ? [] : [item.headline];
  return [...opening, item.body, item.analysis ?? ""].filter((part) => part.trim() !== "");
}

/** When it was filed, as an ISO string for the London formatters, or null for a dateless note. */
export function filedAt(item: NewsItem): string | null {
  return item.at === null ? null : new Date(item.at).toISOString();
}

/** Fantrax's headline, or the story's whole first sentence where they cut it at "...". */
function whole(headline: string, content: string): string {
  const cut = headline.trim().replace(/(\.\.\.|…)$/, "").trim();
  if (cut === headline.trim() || !content.startsWith(cut)) return headline;
  const end = content.indexOf(". ", cut.length);
  return end === -1 ? content.trim() : content.slice(0, end + 1);
}
