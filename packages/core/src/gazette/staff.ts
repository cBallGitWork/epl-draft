import type { StoryKind } from "./story";

// The paper's staff, by kind of story: each the famous journalist known for that kind of piece, mangled as ISS Pro
// Evolution mangled its players, letters swapped or changed in both names and never the real one (PLATFORM_NOTES). COPY.

/** The house correspondent, for a kind with no staff writer of its own. */
const PAPER_CORRESPONDENT = "Hendry Wimter";

/** Each staff writer and his beat. Lawro's predictions are not here: his column carries his own name, stamped at filing. */
const STAFF: readonly (readonly [writer: string, beat: readonly StoryKind[]])[] = [
  ["Phill McLunty", ["match-report"]],
  ["Danial Talyor", ["draft-report"]],
  ["Garf Crookes", ["bin-xi"]],
  ["Davide Onrstein", ["presser", "sheets", "predicted-xi"]],
  ["Fabrisio Romeno", ["trade"]],
];

/** The staff writer each kind runs under. */
export const STAFF_WRITERS: Readonly<Partial<Record<StoryKind, string>>> = Object.fromEntries(
  STAFF.flatMap(([writer, beat]) => beat.map((kind) => [kind, writer])),
);

/** Whose name a story runs under: the one stamped at filing, else its kind's staff writer, else the house's. */
export function writerOf(story: { kind: StoryKind; reporter?: string }): string {
  return story.reporter ?? STAFF_WRITERS[story.kind] ?? PAPER_CORRESPONDENT;
}
