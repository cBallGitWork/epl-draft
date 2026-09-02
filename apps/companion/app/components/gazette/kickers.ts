import type { StoryKind } from "@epl/core";

// The standing head each kind runs under. Copy, and a kind missing here prints
// no kicker rather than a wrong one.
//
// Its own file because the teaser on the front page and the article page behind
// it print the same word over the same story, and two hand-kept copies of a
// fourteen-entry table is the drift `shell/sections.ts` exists to prevent.

export const KICKER: Partial<Record<StoryKind, string>> = {
  "round-preview": "The preview",
  "round-report": "The report",
  "match-report": "Match report",
  "fixture-preview": "Tonight",
  "tie-call": "The call",
  "tie-report": "Tie by tie",
  predictions: "Predictions",
  eleven: "Team of the week",
  "power-ranking": "Power rankings",
  wire: "The bin",
  dodgers: "Points dodgers",
  presser: "The press room",
  studio: "The studio",
  news: "News",
};
