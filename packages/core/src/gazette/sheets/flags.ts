import { SHEETS } from "../../config";
import type { PlayerStory } from "../../league/fantrax/playerNews";
import type { Sheet, SheetMan } from "./sheet";

// Starters worth a line on sight: a club with no match this round, a man Fantrax's news has
// something on, and a man who may not start for his club. Each is a read, never a judgement.

export type StarterFlag =
  | { kind: "no-fixture"; man: SheetMan }
  | { kind: "news"; man: SheetMan; story: PlayerStory }
  /** Listed unavailable with no Fantrax story as recent as the listing: the status alone, in a word. */
  | { kind: "unavailable"; man: SheetMan }
  | { kind: "may-not-start"; man: SheetMan };

export interface FlagInput {
  /** FPL club ids with a match in this round. */
  playing: ReadonlySet<number>;
  /** Fantrax's latest story on him, already limited to recent ones; null when there is none. */
  news: (man: SheetMan) => PlayerStory | null;
  /** Whether his club is expected to start him; null when there is no reading for his club. */
  predicted: (man: SheetMan) => boolean | null;
}

/** In reading order: a blank first, because a starter with no match cannot score at all. */
export function starterFlags(sheet: Sheet, input: FlagInput): StarterFlag[] {
  const blank = sheet.starters.filter((man) => !input.playing.has(man.player.clubId));
  const playing = sheet.starters.filter((man) => input.playing.has(man.player.clubId));
  // Men listed unavailable first, then the freshest story.
  const news = playing
    .flatMap((man): StarterFlag[] => {
      const story = current(man, input.news(man));
      if (story !== null) return [{ kind: "news" as const, man, story }];
      return man.player.status === "a" ? [] : [{ kind: "unavailable" as const, man }];
    })
    .sort((a, b) => Number(a.man.player.status === "a") - Number(b.man.player.status === "a") || at(b) - at(a))
    .slice(0, SHEETS.news);
  return [
    ...blank.map((man) => ({ kind: "no-fixture" as const, man })),
    ...news,
    ...playing
      .filter((man) => input.predicted(man) === false && !news.some((each) => each.man === man))
      .map((man) => ({ kind: "may-not-start" as const, man })),
  ];
}

/** A story older than his latest listing is about a man who has since changed (a loan, a ban), so
 *  it is not the news; the listing's date comes from the football layer, its words never do. */
function current(man: SheetMan, story: PlayerStory | null): PlayerStory | null {
  if (story === null || man.player.status === "a" || man.player.newsAdded === null) return story;
  const listed = Date.parse(man.player.newsAdded);
  return Number.isNaN(listed) || (story.at ?? 0) >= listed ? story : null;
}

function at(flag: StarterFlag): number {
  return flag.kind === "news" ? (flag.story.at ?? 0) : 0;
}
