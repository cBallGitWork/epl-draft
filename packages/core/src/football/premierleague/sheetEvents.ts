import { plPlayerCodes } from "./teamSheet";
import type { RawPlFixture, RawPlFixtureEvent } from "./raw";

// What each man did in one match, from the fixture DETAIL read's own events.
//
// **Its own file rather than `map.ts`**, which is past CODE_RULES §4's soft
// ceiling and is the goals-and-commentary mapper. `matchFacts.ts` set that
// precedent for the fixture's furniture; this is the same move for its people.
//
// **The source is the find that made the team sheet possible.** Until now the
// minute a man came on came from the sister repo's match log, which covers
// fixtures 1-20 of a season whose shots and touches already cover 1-30 — so the
// match Craig linked, Ipswich 0-2 Liverpool, had no sub notes at all. The
// Premier League's fixture detail carries `events` on **30/30** completed
// fixtures, and it is the read the app already makes, and caches, for team
// sheets. Nothing new is fetched to draw any of this.
//
// **A minute drops its added time**, the same rule `matchGoalMinutes` states: a
// goal in the 47th minute of the first half is a 45th-minute goal on any
// teleprinter, and `"90+1'00"` is read as 90.

/** One man's match, as the sheet marks it.
 *
 *  **`onAt` and `offAt` are both null for two different men** — one who played
 *  the whole match and one who never left the bench — and this type cannot tell
 *  them apart on purpose. `PlTeamSheet` already answers it exactly: he is in
 *  `lineup` or he is in `substitutes`. Folding that in here would be a second
 *  spelling of a fact the sheet states. */
export interface PlManMatch {
  /** Minute he came on. Null for a man who started or never played. */
  onAt: number | null;
  /** Minute he went off. Null for a man who finished or never played. */
  offAt: number | null;
  /** Minute of his booking. Null is the ordinary case — 117 yellows over 30
   *  fixtures against about 660 men who appeared. */
  booked: number | null;
  /** Minute he was sent off. **One in the whole of gameweeks 1-3**, so this is
   *  the rarest field in the app and the one most likely to be drawn wrong
   *  because nobody has seen it. */
  sentOff: number | null;
  /** Minutes he scored, in the order the feed lists them. A penalty is his goal
   *  and appears here; an own goal is not and does not. */
  goals: number[];
  /** Minutes he put one in his own net. Separate from `goals` because crediting
   *  a man with an own goal is the one arithmetic error a scoresheet cannot
   *  survive — 5 of the 85 goals in gameweeks 1-3 were own goals. */
  ownGoals: number[];
}

/** Their own vocabulary. `G` a goal, `O` an own goal, `P` a penalty, `MP` a
 *  missed penalty, `B` a booking, `S` a substitution, `PS`/`PE` the period
 *  marks.
 *
 *  **`MP` is read and dropped, deliberately.** It is a real type carrying a real
 *  man — one row in gameweeks 1-3 — but a missed penalty is not a mark CM's
 *  ratings board carries, and FPL's own per-fixture sheet already publishes
 *  `penaltiesMissed` for the screens that want it. Named here so the next reader
 *  knows it was counted rather than missed. */
const GOAL = "G";
const OWN_GOAL = "O";
const PENALTY = "P";
const BOOKING = "B";
const SUBSTITUTION = "S";

/** The minute a clock label names, with its added time dropped. Null when the
 *  event carries no clock at all, which no `G`/`B`/`S` row did across the 862
 *  events of gameweeks 1-3 — but the field is optional on the wire, and an event
 *  we cannot place in the match is not one we can put beside a name. */
function minuteOf(event: RawPlFixtureEvent): number | null {
  const label = event.clock?.label;
  if (label === undefined) return null;
  const at = Number.parseInt(label, 10);
  return Number.isNaN(at) ? null : at;
}

function blank(): PlManMatch {
  return { onAt: null, offAt: null, booked: null, sentOff: null, goals: [], ownGoals: [] };
}

/** Every man's match, by FPL player `code`.
 *
 *  Keyed on `code` because that is the app's identity currency everywhere else
 *  and it is what `PlSquadMan` carries. A man the bridge cannot place is absent
 *  rather than keyed under a provider id — the same tolerance `PlSquadMan.code`
 *  already states, and `scripts/pl-bridge.ts` reports 0 unresolved of 360.
 *
 *  **A card can belong to nobody.** One of the 118 bookings in gameweeks 1-3
 *  carries a `teamId` and no `personId` — a bench or staff card, Newcastle v
 *  Bournemouth at 71'. It is skipped here rather than guessed at: this map is
 *  about men, and a side's card has no name to sit beside.
 *
 *  Pure. `optaToCode` is injected the way every other mapper here takes it, so
 *  nothing reads a bootstrap or a clock (CODE_RULES §5). */
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
    if (man === null || at === null) continue;

    switch (event.type) {
      case GOAL:
      case PENALTY:
        man.goals.push(at);
        break;
      case OWN_GOAL:
        man.ownGoals.push(at);
        break;
      case BOOKING:
        // `R` is a sending off and `Y` a booking. A second yellow arrives as its
        // own `R` row, so a man can carry both and the two fields are not
        // exclusive. First of each wins: a feed that repeats one should not move
        // the minute a screen has already printed.
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
