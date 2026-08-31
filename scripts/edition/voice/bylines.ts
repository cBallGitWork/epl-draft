import { LEAGUE_TIMEZONE, type StoryKind } from "@epl/core";

// Who each story runs under, and which named edition it goes out in. COPY,
// all of it, and Craig's to change: homage names ship as strings precisely so
// changing one costs nothing. A kind missing from a table gets the honest
// empty, which the page renders as nothing.

export const STORY_BYLINE: Partial<Record<StoryKind, string>> = {
  "round-report": "The Back Page",
  "round-preview": "The Form Guide",
  "match-report": "The Back Page",
  "fixture-preview": "The Form Guide",
  "tie-call": "The Back Page",
};

/** The edition a filing goes out under — the paper's names for its own
 *  rhythms, stamped from the kind and the day it filed. The reporting kinds
 *  take the day's paper: Saturday's is the Pink 'Un because the stock has
 *  been rosa since 29 Aug and finally earns it. */
export function editionName(kind: StoryKind, filedAt: string): string {
  if (kind === "round-preview" || kind === "predictions") return "The Form Guide";
  if (kind === "fixture-preview" || kind === "news") return "The Team Sheet";
  if (kind === "wire" || kind === "dodgers") return "The Mercato Wire";

  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: LEAGUE_TIMEZONE,
    weekday: "short",
  }).format(new Date(filedAt));
  if (day === "Sat") return "The Pink 'Un";
  if (day === "Sun") return "The Sunday Edition";
  return "The Monday Club";
}
