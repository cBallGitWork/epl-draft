import type { Assignment, PublishedStory } from "@epl/core";

// What a filed story is checked for, before it is committed.
//
// Lifted out of `write-edition.ts` when that file crossed CODE_RULES §4's 300
// hard ceiling. It is a real seam and not a slice at a line number: these three
// answer one question — what does this column claim, and did it bring what it
// promised — while the file they left orchestrates a firing.
//
// Both checks WARN and neither refuses. A story that names somebody odd or
// files without its cargo is still a story worth printing, and the day the
// first check ran it accused a real player of not existing.

/** The kinds whose substance lives in `extras` rather than in the body, and
 *  which member carries it. A kind absent from this table legitimately files
 *  without extras. */
export const CARGO: Partial<Record<Assignment["kind"], "quotes" | "ranks" | "captions" | "quiz">> = {
  "power-ranking": "ranks",
  eleven: "captions",
  presser: "quotes",
  studio: "quotes",
};

/** Every written surface of a filed story, as one string to check names in.
 *  The body is not all of it: the tie lines carried half of the first
 *  hallucination this caught, and the ranks and captions are prose too. */
export function prose(story: PublishedStory): string {
  const extras = story.extras ?? {};
  const parts: unknown[] = [
    // Not the headline: it is title-case by construction, so every ordinary
    // word in it reports as a stranger. A fabricated footballer does his
    // damage in the sentence-case prose underneath.
    story.deck,
    story.body,
    ...(story.ties ?? []).map((tie) => tie.line),
    // The WRITTEN member of each cargo row and never the row itself: a rank
    // carries a teamId, and stringifying the object put "Id" and "teamId"
    // into the checked text as though the column had named a footballer.
    ...sentences(extras.ranks, "line"),
    ...sentences(extras.captions, "text"),
    ...sentences(extras.quotes, "text"),
  ];
  // Each part on its own line, and every line is a sentence for the check's
  // purposes — a rank line opens with a capital the way a sentence does.
  return parts.filter((part): part is string => typeof part === "string").join("\n");
}

/** The written sentence out of each cargo row, by whichever key holds it.
 *  Anything that is not a string is dropped rather than stringified. */
function sentences(rows: unknown, ...keys: string[]): string[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => {
    if (typeof row === "string") return [row];
    if (row === null || typeof row !== "object") return [];
    const record = row as Record<string, unknown>;
    return keys.map((key) => record[key]).filter((value): value is string => typeof value === "string");
  });
}

