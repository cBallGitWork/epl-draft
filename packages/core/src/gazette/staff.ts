import type { StoryKind } from "./story";

// The paper's staff, by kind of story: each named as ISS Pro Evolution named its players, a letter or two off the
// famous journalist known for that kind of piece and never the real name (Craig, 30 Sep 2026; PLATFORM_NOTES). COPY.

/** The house correspondent, for a kind with no staff writer of its own. */
const PAPER_CORRESPONDENT = "Henry Wintor";

/** Each staff writer and his beat. Lawro's predictions are not here: his column carries his own name, stamped at filing. */
const STAFF: readonly (readonly [writer: string, beat: readonly StoryKind[]])[] = [
  ["Phil McNutly", ["match-report"]],
  ["Daniel Tayler", ["tie-report", "tie-call", "fixture-preview"]],
  ["Garth Crookes", ["eleven"]],
  ["Martin Samual", ["power-ranking"]],
  ["Danny Bakor", ["dodgers"]],
  ["Fabrizio Ramono", ["wire"]],
  ["David Ornstien", ["news", "presser", "sheets"]],
];

/** The staff writer each kind runs under. */
export const STAFF_WRITERS: Readonly<Partial<Record<StoryKind, string>>> = Object.fromEntries(
  STAFF.flatMap(([writer, beat]) => beat.map((kind) => [kind, writer])),
);

/** Whose name a story runs under: the one stamped at filing, else its kind's staff writer, else the house's. */
export function writerOf(story: { kind: StoryKind; reporter?: string }): string {
  return story.reporter ?? STAFF_WRITERS[story.kind] ?? PAPER_CORRESPONDENT;
}
