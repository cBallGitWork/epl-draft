import type { StoryKind } from "./story";

// The paper's staff, by kind of story: each named as ISS Pro Evolution named its players, a letter or two off the
// famous journalist known for that kind of piece and never the real name (Craig, 30 Sep 2026; PLATFORM_NOTES). COPY.

/** The house correspondent, for a kind with no staff writer of its own. */
const PAPER_CORRESPONDENT = "Henry Wintor";

/** Lawro's predictions are not here: his column carries his own name, stamped at filing. The line-ups have no byline. */
export const STAFF_WRITERS: Readonly<Partial<Record<StoryKind, string>>> = {
  "match-report": "Phil McNutly",
  "tie-report": "Daniel Tayler",
  "tie-call": "Daniel Tayler",
  "fixture-preview": "Daniel Tayler",
  eleven: "Garth Crookes",
  "power-ranking": "Martin Samual",
  dodgers: "Danny Bakor",
  wire: "Fabrizio Ramono",
  news: "David Ornstien",
  presser: "David Ornstien",
  sheets: "David Ornstien",
};

/** Whose name a story runs under: the one stamped at filing, else its kind's staff writer, else the house's. */
export function writerOf(story: { kind: StoryKind; reporter?: string }): string {
  return story.reporter ?? STAFF_WRITERS[story.kind] ?? PAPER_CORRESPONDENT;
}
