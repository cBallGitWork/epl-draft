import { banned } from "@epl/core";
import { writeColumn } from "./newsroom";
import { sendBack } from "./voice/house";

// The sub-editor's pass: write the column, read it back against the register,
// and send it back once if it reached for a banned phrase.
//
// **This was a warning until 17 Sep 2026, and the argument for that had been
// overtaken.** `write-edition.ts` said refusing "would throw away a good story
// over a surname" — a real fear when it was written, and one `banned.ts` has
// since answered: the match is whole-word with Unicode letter boundaries, so
// "bank" cannot fire on "Bankole". What was left was a warning nobody reads,
// and two published headlines are built on "Banks" because of it.
//
// So the column is sent back ONCE, which is what a sub-editor does. A retry
// costs one call when it fires and nothing when it does not; a refusal costs the
// story. If the rewrite offends again the caller files it anyway and says so —
// a second failure is the writer's answer, not a reason to hang the firing.
//
// **It reads the raw column rather than a filed story**, which is why this sits
// before `file()` rather than around it. The check only needs the words, the
// words are already in the model's own JSON, and filing twice to check twice
// would stamp two different `filedAt` instants on one story.

/** The written surfaces of a column, as one string. The headline is IN it,
 *  unlike `checks.prose()` — the headline is where "bank" did its damage, five
 *  times on one front page, and it is the line every reader sees.
 *
 *  Exported for its test, which is the regression that matters: the headline
 *  being IN the checked text is the whole of this fix. */
export function written(column: Record<string, unknown>): string {
  return ["headline", "deck", "body"]
    .map((key) => column[key])
    .filter((value): value is string => typeof value === "string")
    .join("\n");
}

export async function writeSubedited(
  system: string,
  brief: string,
  /** How the desk reports sending one back. Injected so this file does no I/O
   *  of its own and the orchestrator keeps one voice for its log. */
  say: (message: string) => void,
  kind: string,
): Promise<Record<string, unknown>> {
  const column = await writeColumn(system, brief);
  const offended = banned(written(column));
  if (offended.length === 0) return column;

  say(`  ↩ ${kind} printed ${offended.join(", ")} — sending it back once.`);
  return writeColumn(system, `${brief}\n\n${sendBack(offended)}`);
}
