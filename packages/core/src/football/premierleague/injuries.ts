import type { RawPlEvent } from "./raw";
import { clockMinute } from "./fixtureEvents";

// Who went off hurt, and whether a given line says so.
//
// Craig, 11 Sep 2026: *"we would like to include players injured too. we can
// find events of a sub off due to an injury in a game"*, then *"woah injuries! i
// want them ON the commentary and i want them on the overview"*.
//
// **Its own file because it has three callers now**, not because it is long. It
// began inside `assists.ts` when the only consumer was the Line Ups board; the
// commentary row and the scoresheet both want it too, and neither of them has
// anything to do with assists.
//
// **This is the one thing on these screens that lives in Opta's PROSE rather
// than in a field**, so it is worth being explicit about what that does and does
// not mean. The phrase is fixed and the ids are not: `substitution` lines end
// `because of an injury.` on **5 of the 87** substitutions in gameweek 3 —
// counted 11 Sep 2026 — and the two men are in `playerIds` as `[on, off]`,
// checked against the fixture feed's own `ON`/`OFF` rows for the same minute. So
// the TEST is a sentence and the ANSWER is an id: nothing here parses a name out
// of prose, which is what would break the first time a man is called something
// else.
//
// **A second injury signal is counted and refused.** `start delay` carries
// `Delay in match because of an injury X (Club)` — four in the same round — and
// names its man in prose ONLY, with his id nowhere on the event. It is also a
// different fact: treated and played on. Named here so the next reader knows it
// was counted rather than missed.

/** Opta's own wording, which is a fixed clause and not a description somebody
 *  wrote. Loose on the surrounding sentence, exact on the phrase. */
const INJURY = /because of an injury/i;

const SUBSTITUTION = "substitution";

/** Whether a commentary line is a substitution made for an injury.
 *
 *  For the row that draws it: the Match Report and the Overview both print
 *  Opta's sentence, and a change forced by an injury is not the same event as a
 *  manager's decision — the reader wants to see which at a glance rather than
 *  read to the end of the line. */
export function saysInjury(line: { type: string; text: string }): boolean {
  return line.type === SUBSTITUTION && INJURY.test(line.text);
}

/** The men taken off INJURED, by FPL code.
 *
 *  **A substitution with no second id credits nobody.** Half a change is still a
 *  change, but it is not a man to put a mark against. */
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

/** The MINUTE a man went off hurt, by FPL code — for a screen that prints a
 *  clock beside him rather than a mark.
 *
 *  Its own pass rather than a richer return from `injuredOff`, because two of
 *  the three callers want only the set and paying for a map they discard is the
 *  thing CODE_RULES §2 calls bloat. The clock label drops its added time, the
 *  same rule every other minute in this package states. */
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
