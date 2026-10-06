import { THREAD_MAX_BEATS, type StoryThread } from "../ledger";

// The memory block every brief carries: live sagas with their last beat, worn ones by subject alone.

/** Retired, or at the beat cap whatever its status says. */
function isWorn(thread: StoryThread): boolean {
  return thread.status === "retired" || thread.beats >= THREAD_MAX_BEATS;
}

export function storylinesBlock(threads: readonly StoryThread[]): string | null {
  if (threads.length === 0) return null;

  const live = threads.filter((thread) => !isWorn(thread));
  const worn = threads.filter(isWorn);

  const blocks: string[] = [];
  if (live.length > 0) {
    blocks.push(
      [
        "PREVIOUS STORYLINES, live. You may advance one ONLY when today's facts genuinely advance it — never invent a development, never advance more than one or two:",
        ...live.map((thread) => `- ${thread.subject}: ${thread.beat}`),
      ].join("\n"),
    );
  }
  if (worn.length > 0) {
    blocks.push(
      [
        "WORN ANGLES. These have run their course. Do NOT write about them again, even in passing:",
        ...worn.map((thread) => `- ${thread.subject}`),
      ].join("\n"),
    );
  }
  return blocks.join("\n\n");
}
