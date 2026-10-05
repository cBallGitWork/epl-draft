import { londonWeekday, londonWeekdayLong, type StoryKind } from "@epl/core";

// Who each story runs under, and which named edition it goes out in. COPY,
// all of it, and Craig's to change: homage names ship as strings precisely so
// changing one costs nothing. A kind missing from a table gets the honest
// empty, which the page renders as nothing.

export const STORY_BYLINE: Partial<Record<StoryKind, string>> = {
  "match-report": "The Back Page",
  "draft-report": "The Dugout",
  "fixture-preview": "The Form Guide",
  "tie-call": "The Back Page",
  eleven: "The Selector",
  "power-ranking": "The Pecking Order",
  dodgers: "Own Goals & Gaffs",
  wire: "The Bin",
  news: "The Wire",
  presser: "The Team Sheet",
  "predicted-xi": "The Line-Ups",
  sheets: "The Team Sheets",
  "bin-xi": "Top Bins",
};

/** The columnists who write under their own name, stamped at filing, rather than a staff writer's (`gazette/staff.ts`).
 *  Lawro's is Mark Lawrenson's, by Craig's decision of 24 Sep 2026 (PLATFORM_NOTES). */
export const COLUMNIST: Partial<Record<StoryKind, string>> = {
  predictions: "Mark Lawrenson",
  "season-rankings": "Mark Lawrenson",
};

/** The edition a filing goes out under — the paper's names for its own
 *  rhythms, stamped from the kind and the day it filed. The reporting kinds
 *  take the day's paper: Saturday's is the Pink 'Un because the stock has
 *  been rosa since 29 Aug and finally earns it. */
export function editionName(kind: StoryKind, filedAt: string, playedOn?: string): string {
  // Named for the day the matches were played, not the day it filed, and no real paper's name (Craig, 28 Sep 2026):
  // Saturday's matches are the "Saturday Prem Report" even when it files on Sunday morning.
  if (kind === "match-report") return `${londonWeekdayLong(playedOn ?? filedAt)} Prem Report`;
  if (kind === "draft-report") return `${londonWeekdayLong(playedOn ?? filedAt)} Draft Report`;
  if (kind === "predictions" || kind === "season-rankings" || kind === "predicted-xi") return "The Form Guide";
  if (kind === "fixture-preview" || kind === "news" || kind === "presser") return "The Team Sheet";
  if (kind === "wire" || kind === "dodgers") return "The Mercato Wire";
  if (kind === "eleven" || kind === "power-ranking") return "The Monday Club";
  // The night the bins go out: waivers are collected on Wednesday.
  if (kind === "bin-xi") return "Bins Out";

  const day = londonWeekday(filedAt);
  if (day === "Sat") return "The Pink 'Un";
  if (day === "Sun") return "The Sunday Edition";
  return "The Monday Club";
}
