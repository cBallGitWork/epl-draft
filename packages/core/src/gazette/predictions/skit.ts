import { strangers } from "../strangers";
import { checkLawro, tieKey, type CheckContext, type Fault, type LawroDraft } from "./checks";
import { CORE_MARK, PAST } from "./past";
import { ngrams, numbersIn, sentences, wordCount } from "./prose";

// The skit writer's edits, each checked on its own and dropped if it fails. He sees the column
// and nothing else, so an edit may change how a sentence lands and never what it says.

export const SHAPES = ["pun", "same-thing-twice", "one-word", "picture", "own-record", "consolation", "shrug"] as const;

export interface SkitEdit {
  where: string;
  shape: string;
  target: string | null;
  before: string;
  after: string;
}

export interface SkitContext {
  check: CheckContext;
  /** Men the brief says are doubts: their sentences are never a joke. */
  doubts: readonly string[];
  /** Shapes and targets he used lately, and the last lines of his recent ties. */
  wornShapes: readonly string[];
  wornTargets: readonly string[];
  lastLines: readonly string[];
}

const NEGATIONS = /\b(?:not|no|never|nothing|nobody|none|without)\b|n['’]t/giu;
const MOST_EDITS = 2;

export function applySkit(raw: unknown, draft: LawroDraft, ctx: SkitContext): { draft: LawroDraft; applied: SkitEdit[]; refused: string[] } {
  const edits = Array.isArray((raw as { edits?: unknown } | null)?.edits) ? ((raw as { edits: unknown[] }).edits) : [];
  const refused: string[] = [];
  const applied: SkitEdit[] = [];
  let current = draft;
  for (const candidate of edits) {
    const edit = read(candidate);
    const why = edit === null ? "not an edit" : applied.length >= MOST_EDITS ? "a third edit" : applied.some((each) => each.where === edit.where) ? "a second edit in one section" : refusal(edit, current, ctx);
    if (why !== null || edit === null) {
      refused.push(`${edit?.where ?? "?"}: ${why}`);
      continue;
    }
    const next = replaced(current, edit);
    const added = newFaults(checkLawro(current, ctx.check), checkLawro(next, ctx.check), edit.where);
    if (added.length > 0) {
      refused.push(`${edit.where}: adds ${added.map((fault) => fault.check).join(", ")}`);
      continue;
    }
    current = next;
    applied.push(edit);
  }
  return { draft: current, applied, refused };
}

function read(raw: unknown): SkitEdit | null {
  const edit = raw as Partial<SkitEdit> | null;
  if (typeof edit?.where !== "string" || typeof edit.before !== "string" || typeof edit.after !== "string") return null;
  if (!SHAPES.includes(edit.shape as (typeof SHAPES)[number])) return null;
  return { where: edit.where, shape: edit.shape as string, target: typeof edit.target === "string" && edit.target !== "" ? edit.target : null, before: edit.before.trim(), after: edit.after.trim() };
}

/** Why an edit may not land, or null when it may. */
function refusal(edit: SkitEdit, draft: LawroDraft, ctx: SkitContext): string | null {
  const section = edit.where === "intro" ? draft.intro : draft.ties.get(edit.where)?.line;
  if (section === undefined) return "no such section";
  const all = sentences(section);
  if (!all.includes(edit.before)) return "not a sentence of the column";
  if (edit.where === "intro" && edit.shape !== "own-record") return "the opening takes only a line against his record";
  const call = ctx.check.calls.find((each) => tieKey(each.homeTeamId, each.awayTeamId) === edit.where);
  if (call?.instinct != null && all.at(-1) !== edit.before) return "a gut call's reason is not a joke";
  if (ctx.doubts.some((name) => edit.before.includes(name))) return "an injury is not a joke";
  if (CORE_MARK.test(edit.before) || PAST.some((line) => line.mark.test(edit.before))) return "his career is not a joke";
  const words = wordCount(edit.after);
  const said = sentences(edit.after);
  const oneLine = said.length === 1 || (said.length === 2 && said[0].endsWith("?") && wordCount(said[1]) === 1);
  if (!oneLine || words > 20 || words > wordCount(edit.before) + 6) return "not one short sentence";
  if (strangers(edit.after, edit.before).length > 0 || strangers(edit.before, edit.after).length > 0) return "the names changed";
  if (!sameFigures(edit.before, edit.after)) return "the figures changed";
  if ((edit.before.match(NEGATIONS) ?? []).length !== (edit.after.match(NEGATIONS) ?? []).length) return "the meaning turned";
  if (ctx.wornShapes.includes(edit.shape)) return "a shape he used last week";
  if (edit.shape === "pun" && (edit.target === null || !edit.after.includes(edit.target) || ctx.wornTargets.includes(edit.target))) return "a worn or missing target";
  const recent = new Set(ctx.lastLines.flatMap((line) => [...ngrams(line, 4, ctx.check.names)]));
  if ([...ngrams(edit.after, 4, ctx.check.names)].some((gram) => recent.has(gram))) return "a line he has used";
  return null;
}

function sameFigures(before: string, after: string): boolean {
  const sorted = (text: string) => numbersIn(text).sort((a, b) => a - b).join(",");
  return sorted(before) === sorted(after);
}

function replaced(draft: LawroDraft, edit: SkitEdit): LawroDraft {
  if (edit.where === "intro") return { ...draft, intro: draft.intro.replace(edit.before, edit.after) };
  const ties = new Map(draft.ties);
  const tie = ties.get(edit.where);
  if (tie !== undefined) ties.set(edit.where, { ...tie, line: tie.line.replace(edit.before, edit.after) });
  return { ...draft, ties };
}

/** Faults the edit brought into its own section. */
function newFaults(before: readonly Fault[], after: readonly Fault[], section: string): Fault[] {
  const seen = new Set(before.filter((fault) => fault.section === section).map((fault) => `${fault.check}|${fault.evidence}`));
  return after.filter((fault) => fault.section === section && fault.severity !== "warn" && !seen.has(`${fault.check}|${fault.evidence}`));
}
