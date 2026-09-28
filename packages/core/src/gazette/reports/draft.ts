import type { Fault } from "../predictions/checks";
import { escapeRegExp } from "../banned";
import { pencil } from "../predictions/checks";
import { REPORT_PENCIL } from "./words";

// What the writer files for a match-day, read field by field; a match whose pieces fail twice prints the desk's plain line.

export interface ReportSection {
  head: string;
  pitch: string;
  stake: string;
}

export interface ReportPiece {
  standfirst: string;
  account: string;
  sections: ReportSection[];
}

export interface ReportsDraft {
  headline: string;
  /** By fixture code. */
  matches: Map<number, ReportPiece>;
}


/** House corrections with one right answer. */
export function correct(prose: string): string {
  return REPORT_PENCIL.reduce((out, [wrong, right]) => out.replace(wrong, right), pencil(prose));
}

/** A head that breaks the rules twice prints as the man it is about: his surname, named first in the section's football. */
export function plainHead(head: string, pitch: string, surnames: readonly string[], never: (text: string) => boolean): string {
  const clean = head !== "" && head.split(/\s+/u).length <= 5 && !never(head) && surnames.some((name) => head.includes(name));
  if (clean) return head;
  const named = surnames
    .map((name) => ({ name, at: pitch.indexOf(name) }))
    .filter((x) => x.at >= 0)
    .sort((a, b) => a.at - b.at || b.name.length - a.name.length)[0];
  return named?.name ?? head;
}

/** A surname's particle is lower case except where it opens a sentence: "holds Van Hecke" → "holds van Hecke". */
export function particles(prose: string, surnames: readonly string[]): string {
  return surnames
    .filter((name) => /^\p{Ll}/u.test(name))
    .reduce((out, name) => {
      const capital = name.charAt(0).toUpperCase() + name.slice(1);
      return out.replace(new RegExp(`(?<![.!?]\\s)(?<=\\s)${escapeRegExp(capital)}`, "gu"), name);
    }, prose);
}

/** The model's JSON as a draft; anything missing or misshapen is an empty string for the checks to find. */
export function readReportsDraft(raw: Record<string, unknown>, surnames: readonly string[] = []): ReportsDraft {
  const text = (value: unknown) => (typeof value === "string" ? particles(correct(value.trim()), surnames) : "");
  const matches = new Map<number, ReportPiece>();
  for (const entry of Array.isArray(raw.matches) ? raw.matches : []) {
    if (typeof entry !== "object" || entry === null) continue;
    const m = entry as Record<string, unknown>;
    const code = Number(m.fixture);
    if (!Number.isInteger(code)) continue;
    const sections = (Array.isArray(m.sections) ? m.sections : []).flatMap((s): ReportSection[] => {
      if (typeof s !== "object" || s === null) return [];
      const r = s as Record<string, unknown>;
      return [{ head: text(r.head), pitch: text(r.pitch), stake: text(r.stake) }];
    });
    matches.set(code, { standfirst: text(m.standfirst), account: text(m.account), sections });
  }
  return { headline: text(raw.headline), matches };
}

/** The part of a fault's section that names its match: `2645244:account` → 2645244. */
export const matchOf = (section: string) => Number(section.split(":")[0]);

const blocking = (faults: readonly Fault[], code: number) =>
  faults.filter((f) => matchOf(f.section) === code && f.severity !== "warn").length;
const hard = (faults: readonly Fault[], code: number) => faults.some((f) => matchOf(f.section) === code && f.severity === "hard");

/** Per match: the first attempt if it passed; else the rewrite if it has no hard fault and fewer faults than the first;
 *  else the first if it has no hard fault; else neither, and the desk's plain line prints. The fan's flags are never hard. */
export function mergeReports(attempts: readonly { draft: ReportsDraft; faults: readonly Fault[] }[], codes: readonly number[]): ReportsDraft {
  const [first, second] = attempts;
  const matches = new Map<number, ReportPiece>();
  for (const code of codes) {
    const a = first?.draft.matches.get(code);
    const b = second?.draft.matches.get(code);
    if (a !== undefined && blocking(first.faults, code) === 0) matches.set(code, a);
    else if (b !== undefined && !hard(second.faults, code) && (a === undefined || hard(first.faults, code) || blocking(second.faults, code) < blocking(first.faults, code))) matches.set(code, b);
    else if (a !== undefined && !hard(first.faults, code)) matches.set(code, a);
  }
  const faulted = (faults: readonly Fault[], hardOnly: boolean) =>
    faults.some((f) => f.section === "headline" && (hardOnly ? f.severity === "hard" : f.severity !== "warn"));
  const headline =
    first !== undefined && !faulted(first.faults, false) ? first.draft.headline
    : second !== undefined && second.draft.headline !== "" && !faulted(second.faults, true) ? second.draft.headline
    : (first?.draft.headline ?? "");
  return { headline, matches };
}
