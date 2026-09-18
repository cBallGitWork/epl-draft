import type { Assignment, PublishedStory } from "@epl/core";

// What a filed story is checked for, before it is committed.
//
// Lifted out of `write-edition.ts` when that file crossed CODE_RULES §4's 300
// hard ceiling. It is a real seam and not a slice at a line number: these three
// answer one question — what does this column claim, and did it bring what it
// promised — while the file they left orchestrates a firing.
//
// `strangers` and `CARGO` WARN and neither refuses. A story that names somebody
// odd or files without its cargo is still a story worth printing, and the day
// the first check ran it accused a real player of not existing.
//
// **The banned list is the one that does not just warn** (17 Sep 2026). It sends
// the column back once and then files whatever comes back — the reasoning is on
// `sendBack` in `voice/house.ts`, and the short of it is that its warning was
// being read by nobody while two headlines built on "Banks" went to print.

/** The kinds whose substance lives in `extras` rather than in the body, and
 *  which member carries it. A kind absent from this table legitimately files
 *  without extras. */
export const CARGO: Partial<Record<Assignment["kind"], "ranks" | "quiz" | "teamNews">> = {
  "power-ranking": "ranks",
  // The Team Sheet IS its rows — the body is an introduction to them. One that
  // files without them is two sentences about a thread that is not there.
  presser: "teamNews",
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
    //
    // **`line`, and not `"text"`.** It read `"text"` for the quotes and the
    // captions until 3 Sep 2026, and neither type ever had a `text` — both held
    // their sentence in `line`, as `StoryRank` does and as this row always
    // correctly did. So the check silently saw neither of them for as long as it
    // existed. Both cargoes have since gone (the captions on Craig's ruling, the
    // quotes with the sketches), so `ranks` is the whole of it; the lesson is
    // kept here because the next cargo added will be read the same way.
    ...sentences(extras.ranks, "line"),
  ];
  // Each part on its own line, and every line is a sentence for the check's
  // purposes — a rank line opens with a capital the way a sentence does.
  return parts.filter((part): part is string => typeof part === "string").join("\n");
}

/** The same, plus the headline — what the BANNED list is checked against.
 *
 *  `prose()` deliberately leaves the headline out, because it is title-case by
 *  construction and every ordinary word in it reports as a stranger. The banned
 *  list has the opposite need: the headline is where "bank" did its damage, five
 *  times on one front page, and it is the one line every reader sees. Two checks
 *  reading two different surfaces, which is why this is a second function rather
 *  than a flag on the first. */
export function headlineAndProse(story: PublishedStory): string {
  return `${story.headline}\n${prose(story)}`;
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

