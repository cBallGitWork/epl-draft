import type { StoryKind } from "@epl/core";

// The standing head each kind runs under, shared by the teaser and the article; a kind missing here prints none.

export const KICKER: Partial<Record<StoryKind, string>> = {
  "match-report": "Match report",
  "draft-report": "Draft report",
  "fixture-preview": "Tonight",
  "tie-call": "The call",
  "tie-report": "The tie",
  eleven: "Team of the week",
  "power-ranking": "Power rankings",
  wire: "The bin",
  dodgers: "Points dodgers",
  news: "News",
  presser: "Team news",
  sheets: "Line-ups",
  "bin-xi": "Top Bins",
};
