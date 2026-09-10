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
  /** Minutes of the goals he SET UP, which is the goal's own clock — an assist
   *  happens when the ball goes in.
   *
   *  **Opta's assist, which is narrower than the fantasy one.** Counted 10 Sep
   *  2026 across gameweeks 1-3: `assistId` is on **56 of the 76** `G` events and
   *  on none of the 5 own goals or 4 penalties, which is right — nobody assists
   *  an own goal and a penalty is won rather than laid on. FPL pays an assist
   *  for things Opta does not credit, so a man's FPL assist count can exceed
   *  what is placed here. A caller must not print a partial list of minutes as
   *  though it were the whole of his afternoon; `Scoresheet` carries that rule. */
  assists: number[];
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
    if (at === null) continue;

    // The assister is credited at the goal's own clock, and separately from the
    // scorer — the two are different men and only one of them is `personId`.
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

/** One change: who came on, who came off, and when. */
export interface PlSubstitution {
  minute: number;
  /** FPL codes, or null for a man the bridge could not place. He is still half
   *  of a real substitution, so the pair is kept and the name is the caller's
   *  problem — dropping it would lose the other man too. */
  on: number | null;
  off: number | null;
}

/** Every substitution in the match, paired, oldest first.
 *
 *  **The pairing is the feed's ORDER and nothing else, which is why this cannot
 *  be done from `plManMatches`.** That map is per-man and loses the sequence; a
 *  caller left with it can only pair on the minute, and three changes made at
 *  once — Liverpool at 71' in the recorded fixture — then pair arbitrarily.
 *  Drawn that way the report said Flemming came on for Maeda when he came on for
 *  Emersonn: two true men, one false sentence.
 *
 *  The invariant, counted 10 Sep 2026 across the 30 completed fixtures of
 *  gameweeks 1-3: **269 of 269** adjacent `S` pairs are an `ON` immediately
 *  followed by its own `OFF`, every pair agrees on both the minute and the
 *  `teamId`, and no fixture has an odd number of `S` rows. So consecutive pairs
 *  are partners, and the two guards below are cheap insurance on a shape that
 *  has never yet broken rather than defensive noise.
 *
 *  A pair that disagrees about its minute is dropped rather than guessed at. */
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
      on: on.personId === undefined ? null : (codes.get(on.personId) ?? null),
      off: off.personId === undefined ? null : (codes.get(off.personId) ?? null),
    });
  }

  return swaps.sort((a, b) => a.minute - b.minute);
}

/** One goal, as a scoresheet needs it.
 *
 *  **`teamId` is the side CREDITED, which for an own goal is the beneficiary.**
 *  Thiaw is a Newcastle player and his own goal against Bournemouth carries
 *  `teamId: 127` — Bournemouth's. That is the right answer for "whose goal was
 *  it" and the wrong one for "whose player was he", and `plManMatches` files the
 *  man himself under `ownGoals` for exactly that reason. */
export interface PlGoal {
  minute: number;
  teamId: number;
  /** FPL codes, or null where the bridge could not place him. */
  scorer: number | null;
  /** Opta's assister, absent on 20 of 76 goals and on every own goal and
   *  penalty. */
  assister: number | null;
  own: boolean;
}

/** Every goal in the match, oldest first. */
export function plGoals(fixture: RawPlFixture, optaToCode: Map<string, number>): PlGoal[] {
  const codes = plPlayerCodes(fixture, optaToCode);
  const goals: PlGoal[] = [];

  for (const event of fixture.events ?? []) {
    if (event.type !== GOAL && event.type !== PENALTY && event.type !== OWN_GOAL) continue;
    const minute = minuteOf(event);
    if (minute === null || event.teamId === undefined) continue;
    goals.push({
      minute,
      teamId: event.teamId,
      scorer: event.personId === undefined ? null : (codes.get(event.personId) ?? null),
      assister: event.assistId === undefined ? null : (codes.get(event.assistId) ?? null),
      own: event.type === OWN_GOAL,
    });
  }

  return goals.sort((a, b) => a.minute - b.minute);
}

/** One side's goals with their assisters filled in, reconciled against FPL.
 *
 *  **The fantasy assist is broader than Opta's, and the gap is derivable rather
 *  than guessable.** FPL pays an assist for the pass before an OWN GOAL and for
 *  the shot that forced it; Opta credits nobody on either. Newcastle 2-2
 *  Bournemouth is the case: Opta places no assister on either Bournemouth goal,
 *  and FPL gives Alex Scott two — one on Tavernier's 9th-minute goal, one on
 *  Thiaw's own goal at 35'. Both of that side's goals are unexplained and one man
 *  claims both, so both are his and nothing is being guessed at.
 *
 *  **It refuses the moment it is ambiguous.** If two men on a side each want one
 *  more assist and the side has two unexplained goals, no arithmetic says which
 *  man laid on which — so neither is credited and the caller shows what it knows.
 *  A mis-paired assist is the confident wrong statement DESIGN §7 refuses.
 *
 *  Returns the goals unchanged apart from the assisters it could resolve, so a
 *  caller renders GOALS and never has to join a man back to one.
 *
 *  Pure, and takes plain data from both providers rather than reaching for
 *  either: the caller already holds a side's goals and FPL's per-man counts. */
export function creditedGoals(
  goals: readonly PlGoal[],
  fplAssists: ReadonlyMap<number, number>,
): PlGoal[] {
  const placed = new Map<number, number>();
  for (const goal of goals) {
    if (goal.assister === null) continue;
    placed.set(goal.assister, (placed.get(goal.assister) ?? 0) + 1);
  }

  const unexplained = goals.filter((goal) => goal.assister === null);

  // Who FPL pays more than Opta placed, and by how much.
  const short: { code: number; need: number }[] = [];
  for (const [code, paid] of fplAssists) {
    const need = paid - (placed.get(code) ?? 0);
    if (need > 0) short.push({ code, need });
  }

  // One claimant whose shortfall is exactly the side's unexplained goals is the
  // only case that resolves. Anything else is left as the feed gave it.
  const resolves =
    short.length === 1 && short[0].need === unexplained.length && unexplained.length > 0;

  return goals.map((goal) =>
    resolves && goal.assister === null ? { ...goal, assister: short[0].code } : goal,
  );
}
