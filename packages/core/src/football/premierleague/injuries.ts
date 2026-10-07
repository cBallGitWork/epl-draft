import type { RawPlEvent } from "./raw";
import { clockMinute } from "./fixtureEvents";

// Who went off hurt: a substitution whose prose says "because of an injury", answered by its `[on, off]` ids, never
// a name. `start delay` names its man in prose only, so it is not read.

/** Opta's fixed clause: loose on the sentence around it, exact on the phrase. */
const INJURY = /because of an injury/i;

const SUBSTITUTION = "substitution";

/** Whether a commentary line is a substitution made for an injury. */
export function saysInjury(line: { type: string; text: string }): boolean {
  return line.type === SUBSTITUTION && INJURY.test(line.text);
}

/** The men taken off injured, by FPL code; a substitution with no second id credits nobody. */
export function injuredOff(
  events: readonly RawPlEvent[],
  codes: ReadonlyMap<number, number>,
): Set<number> {
  const hurt = new Set<number>();
  for (const event of events) {
    if (!saysInjury(event)) continue;
    const off = event.playerIds?.[1];
    if (off === undefined) continue;
    const code = codes.get(off);
    if (code !== undefined) hurt.add(code);
  }
  return hurt;
}

/** The minute each man went off hurt, by FPL code, added time dropped. */
export function injuryMinutes(
  events: readonly RawPlEvent[],
  codes: ReadonlyMap<number, number>,
): Map<number, number> {
  const when = new Map<number, number>();
  for (const event of events) {
    if (!saysInjury(event)) continue;
    const off = event.playerIds?.[1];
    const minute = clockMinute(event.time?.label);
    if (off === undefined || minute === null) continue;
    const code = codes.get(off);
    if (code !== undefined) when.set(code, minute);
  }
  return when;
}
