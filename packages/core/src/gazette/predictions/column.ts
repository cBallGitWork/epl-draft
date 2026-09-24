import type { StoryFace } from "../face";
import type { StorySkit } from "./cargo";
import { pencil, tieKey, type Fault, type LawroDraft } from "./checks";
import type { PredictionCall } from "./pick";
import { mentionAt } from "./prose";
import type { Marked } from "./record";
import type { SquadMan } from "./sides";

// From what the model returned to what the desk files: the draft read on the desk's own keys,
// the two attempts merged section by section, and the calls, scores and pictures put back by code.

/** The model's column as a draft keyed on the desk's ties, pencilled; null when it is no column. */
export function readDraft(raw: unknown, calls: readonly PredictionCall[]): LawroDraft | null {
  const column = raw as { deck?: unknown; body?: unknown; ties?: unknown } | null;
  if (column === null || typeof column !== "object" || !Array.isArray(column.ties)) return null;
  const ties = new Map<string, { line: string; backs: string | null }>();
  for (const tie of column.ties as { homeTeamId?: unknown; awayTeamId?: unknown; line?: unknown; backs?: unknown }[]) {
    // Either way round: a model that swaps home and away has still written about the tie.
    const call = calls.find(
      (each) =>
        (each.homeTeamId === tie?.homeTeamId && each.awayTeamId === tie?.awayTeamId) ||
        (each.homeTeamId === tie?.awayTeamId && each.awayTeamId === tie?.homeTeamId),
    );
    if (call === undefined) continue;
    const key = tieKey(call.homeTeamId, call.awayTeamId);
    if (ties.has(key)) continue;
    ties.set(key, { line: pencil(text(tie.line)), backs: typeof tie.backs === "string" && tie.backs !== "" ? tie.backs : null });
  }
  return { deck: text(column.deck), intro: pencil(text(column.body)), ties };
}

/** Each section from the latest attempt with no hard fault in it; a section hard in every
 *  attempt is left empty, and its tie prints only the desk's prediction. */
export function mergeAttempts(attempts: readonly { draft: LawroDraft; faults: readonly Fault[] }[], calls: readonly PredictionCall[]): LawroDraft {
  const latest = [...attempts].reverse();
  const clean = (section: string) => latest.find(({ faults }) => !faults.some((fault) => fault.section === section && fault.severity === "hard"))?.draft ?? null;
  const ties = new Map<string, { line: string; backs: string | null }>();
  for (const call of calls) {
    const key = tieKey(call.homeTeamId, call.awayTeamId);
    const tie = clean(key)?.ties.get(key);
    ties.set(key, { line: tie?.line ?? "", backs: call.callsTeamId });
  }
  return {
    deck: clean("deck")?.deck ?? "",
    intro: clean("intro")?.intro ?? "",
    ties,
  };
}

/** The column as it files: his words, and everything else the desk's. */
export function assembleLawro(input: {
  draft: LawroDraft;
  calls: readonly PredictionCall[];
  /** The desk's and never his: the column's name and the round. */
  headline: string;
  /** Each tie's two squads by its key, for the man his line names first. */
  men: ReadonlyMap<string, readonly SquadMan[]>;
  record: Marked | null;
  skit: readonly StorySkit[];
  threads: unknown;
}): Record<string, unknown> {
  const { draft, calls } = input;
  return {
    headline: input.headline,
    deck: draft.deck,
    body: draft.intro,
    ties: calls.map((call) => {
      const key = tieKey(call.homeTeamId, call.awayTeamId);
      const line = draft.ties.get(key)?.line ?? "";
      const face = featured(line, input.men.get(key) ?? []);
      return {
        homeTeamId: call.homeTeamId,
        awayTeamId: call.awayTeamId,
        line,
        callsTeamId: call.callsTeamId,
        ...(call.instinct === null ? {} : { instinct: call.instinct }),
        ...(call.score === null ? {} : { score: call.score }),
        ...(face === null ? {} : { face }),
      };
    }),
    threads: input.threads,
    ...(input.record === null ? {} : { record: input.record }),
    ...(input.skit.length === 0 ? {} : { skit: input.skit }),
  };
}

/** The first of the tie's men his line names, for the picture beside it; null when it names none.
 *  Who each man is came off the bridge with his squad: this reads only which of them the prose names. */
export function featured(line: string, men: readonly SquadMan[]): StoryFace | null {
  const named = men
    .map((man) => ({ man, at: mentionAt(line, man.name) }))
    .filter(({ at }) => at !== -1)
    .sort((a, b) => a.at - b.at || b.man.name.length - a.man.name.length);
  return named[0]?.man.face ?? null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
