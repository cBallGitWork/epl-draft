import { codeOf, plPlayerCodes } from "./teamSheet";
import { BOOKING, GOAL, OWN_GOAL, PENALTY, SUBSTITUTION, minuteOf } from "./fixtureEvents";
import type { RawPlFixture } from "./raw";

// What each man did in one match, from the fixture DETAIL read's own events.

/** One man's match as the sheet marks it. Null `onAt` and `offAt` fit both a full ninety and an unused sub:
 *  `PlTeamSheet`'s `lineup` or `substitutes` tells them apart. */
export interface PlManMatch {
  /** Minute he came on. Null for a man who started or never played. */
  onAt: number | null;
  /** Minute he went off. Null for a man who finished or never played. */
  offAt: number | null;
  /** Minute of his booking; null is the ordinary case. */
  booked: number | null;
  /** Minute he was sent off: rare enough that nobody has seen it drawn. */
  sentOff: number | null;
  /** Minutes he scored, in the feed's order. A penalty is his goal; an own goal is not. */
  goals: number[];
  /** Minutes of the goals he SET UP, by Opta's narrower assist: never print these as all of FPL's count. */
  assists: number[];
  /** Minutes he put one in his own net, kept apart from `goals` so no man is credited with one. */
  ownGoals: number[];
}

function blank(): PlManMatch {
  return {
    onAt: null,
    offAt: null,
    booked: null,
    sentOff: null,
    goals: [],
    assists: [],
    ownGoals: [],
  };
}

/** Every man's match by FPL `code`; a man the bridge cannot place is absent.
 *  A card with no `personId` (a bench or staff card) has no man and is skipped. */
export function plManMatches(
  fixture: RawPlFixture,
  optaToCode: Map<string, number>,
): Map<number, PlManMatch> {
  const codes = plPlayerCodes(fixture, optaToCode);
  const men = new Map<number, PlManMatch>();

  const forCode = (personId: number | undefined): PlManMatch | null => {
    if (personId === undefined) return null;
    const code = codes.get(personId);
    if (code === undefined) return null;
    const existing = men.get(code);
    if (existing !== undefined) return existing;
    const fresh = blank();
    men.set(code, fresh);
    return fresh;
  };

  for (const event of fixture.events ?? []) {
    const man = forCode(event.personId);
    const at = minuteOf(event);
    if (at === null) continue;

    // The assister is credited at the goal's own clock; he is never the `personId`.
    if (event.type === GOAL && event.assistId !== undefined) {
      forCode(event.assistId)?.assists.push(at);
    }
    if (man === null) continue;

    switch (event.type) {
      case GOAL:
      case PENALTY:
        man.goals.push(at);
        break;
      case OWN_GOAL:
        man.ownGoals.push(at);
        break;
      case BOOKING:
        // `R` sending off, `Y` booking; a second yellow is its own `R` row, so a man may carry both. First wins.
        if (event.description === "R") man.sentOff ??= at;
        else man.booked ??= at;
        break;
      case SUBSTITUTION:
        if (event.description === "ON") man.onAt ??= at;
        else if (event.description === "OFF") man.offAt ??= at;
        break;
    }
  }

  return men;
}

/** One change: who came on, who came off, and when. */
export interface PlSubstitution {
  minute: number;
  /** FPL codes, or null for a man the bridge could not place; the pair is kept either way. */
  on: number | null;
  off: number | null;
}

/** Every substitution, oldest first, paired by the feed's ORDER: each `ON` row is followed by its own `OFF`.
 *  `plManMatches` loses that order, and three changes at one minute would pair wrongly. A pair that disagrees is dropped. */
export function plSubstitutions(
  fixture: RawPlFixture,
  optaToCode: Map<string, number>,
): PlSubstitution[] {
  const codes = plPlayerCodes(fixture, optaToCode);
  const rows = (fixture.events ?? []).filter((event) => event.type === SUBSTITUTION);
  const swaps: PlSubstitution[] = [];

  for (let n = 0; n + 1 < rows.length; n += 2) {
    const [on, off] = [rows[n], rows[n + 1]];
    if (on.description !== "ON" || off.description !== "OFF") continue;
    const minute = minuteOf(on);
    if (minute === null || minuteOf(off) !== minute) continue;
    swaps.push({
      minute,
      on: codeOf(codes, on.personId),
      off: codeOf(codes, off.personId),
    });
  }

  return swaps.sort((a, b) => a.minute - b.minute);
}
