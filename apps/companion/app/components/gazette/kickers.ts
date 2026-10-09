import type { StoryKind } from "@epl/core";

// The standing head each kind runs under, shared by the teaser and the article; a kind missing here prints none.

export const KICKER: Partial<Record<StoryKind, string>> = {
  "match-report": "Match report",
  "draft-report": "Draft report",
  presser: "Team news",
  sheets: "Line-ups",
  "bin-xi": "Top Bins",
};
