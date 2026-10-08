import type { Fault } from "../predictions/checks";
import { correct, particles, readHeadlines } from "../reports/draft";
import { stringOrEmpty } from "../../untrusted";

// What the writer files for a draft report, read field by field: the headline candidates, and each match-up's
// paragraphs, keyed by its number in the brief. A match-up that fails twice prints the desk's result alone.

/** The writer's paragraphs for one match-up, the first its lede. */
export interface DraftPiece {
  paragraphs: string[];
}

export interface DraftWriting {
  headlines: string[];
  /** Each candidate's two meanings, as the writer claimed them, for the judge to check. */
  meanings: Record<string, string>;
  /** The lead match-up's story in plain words, which the puns turn on. */
  headlineStory: string;
  /** By the match-up's number in the brief, from 1. */
  matchups: Map<number, DraftPiece>;
}

/** The model's JSON as writing; anything missing or misshapen is empty for the checks to find. */
export function readDraftWriting(raw: Record<string, unknown>, surnames: readonly string[] = []): DraftWriting {
  const text = (value: unknown) => particles(correct(stringOrEmpty(value).trim()), surnames);
  const matchups = new Map<number, DraftPiece>();
  for (const entry of Array.isArray(raw.pieces) ? raw.pieces : []) {
    if (typeof entry !== "object" || entry === null) continue;
    const m = entry as Record<string, unknown>;
    const n = Number(m.number);
    if (!Number.isInteger(n)) continue;
    matchups.set(n, { paragraphs: (Array.isArray(m.paragraphs) ? m.paragraphs : []).map(text).filter((p) => p !== "") });
  }
  const { headlines, meanings } = readHeadlines(raw);
  return { headlines, meanings, headlineStory: text(raw.headlineStory), matchups };
}

/** The part of a fault's section that names its match-up: `2:standfirst` → 2. */
export const matchupOf = (section: string) => Number(section.split(":")[0]);

const blocking = (faults: readonly Fault[], n: number) => faults.filter((f) => matchupOf(f.section) === n && f.severity !== "warn").length;
const hard = (faults: readonly Fault[], n: number) => faults.some((f) => matchupOf(f.section) === n && f.severity === "hard");

/** Per match-up: the first attempt if it passed; else the rewrite if it has no hard fault and fewer faults; else the first
 *  if it has no hard fault; else neither, and the desk's result prints alone. */
export function mergeDraft(attempts: readonly { writing: DraftWriting; faults: readonly Fault[] }[], count: number): Map<number, DraftPiece> {
  const [first, second] = attempts;
  const out = new Map<number, DraftPiece>();
  for (let n = 1; n <= count; n++) {
    const a = first?.writing.matchups.get(n);
    const b = second?.writing.matchups.get(n);
    if (a !== undefined && blocking(first.faults, n) === 0) out.set(n, a);
    else if (b !== undefined && !hard(second.faults, n) && (a === undefined || hard(first.faults, n) || blocking(second.faults, n) < blocking(first.faults, n))) out.set(n, b);
    else if (a !== undefined && !hard(first.faults, n)) out.set(n, a);
  }
  return out;
}
