import type { Fault, Report } from "./predictions/checks";
import { masked, numbersIn } from "./predictions/prose";

// The sub-editor's small tools, shared by every desk's checks.

/** Faults `text` on the first match of `pattern`, quoting it; nothing when it does not match. */
export function faultOn(fault: Report, section: string, check: string, severity: Fault["severity"], pattern: RegExp, text: string): void {
  const said = text.match(pattern)?.[0];
  if (said !== undefined) fault(section, check, severity, said);
}

/** The figures in `text` that `allowed` does not hold, in order. */
export const strayFigures = (text: string, allowed: ReadonlySet<number>): number[] => numbersIn(text).filter((n) => !allowed.has(n));

/** The text with every name blanked to `fill`: " " ends a word at a name, "X" keeps a word in its place. */
export const blanked = (text: string, names: readonly string[], fill: " " | "X" = " "): string => masked(text, names).replace(/\u0000/gu, fill);
