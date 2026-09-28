import { plPlayerCodes } from "./teamSheet";
import { GOAL, OWN_GOAL, PENALTY, minuteOf } from "./fixtureEvents";
import type { RawPlFixture } from "./raw";

// A side's GOALS, off the fixture detail's own events.
//
// **Split out of `sheetEvents.ts` on 11 Sep 2026**, which had reached 379 lines
// against CODE_RULES §4's hard ceiling of 300 — `goalGroups` was the addition
// that made it worth doing rather than the reason it was over. The seam is what
// the events are read FOR: that file answers what happened to one MAN, this one
// answers what happened to the SIDE, and `plSubstitutions`' own docblock already
// records that the two questions cannot be answered off one shape.
//
// `assists.ts` next door carries the third reading — the assists FPL pays that
// Opta does not place — and takes `PlGoal` from here.

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
  /** A penalty scored; absent where the source did not say. */
  penalty?: boolean;
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
      penalty: event.type === PENALTY,
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
 *  **This is the SECOND thing a caller tries, since 11 Sep 2026.** Arithmetic on
 *  its own cannot reach the case above, and `assists.ts` can: the commentary
 *  carries the penalty won, the shot that forced an own goal and the block that
 *  left a rebound as events, so it proposes a whole assignment and has FPL's own
 *  counts confirm it. Man Utd 5-2 Ipswich is the fixture that needed it — three
 *  men each short by one against three unexplained goals, where this function
 *  correctly credits nobody. It runs when that proposal does not verify, which
 *  is exactly the ground it always covered.
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

/** One SCORER's contribution to a side, with every goal he got folded into it.
 *
 *  Craig, 11 Sep 2026, on seeing Isak twice with Gakpo under each: *"isak can
 *  have one row only for both goals… both assists can be one row too if its
 *  both. if it was 2 players, just show two assists row."* And then, on the
 *  build that dropped the assister's clock to make the point: an assister row
 *  carries the minutes of the goals he made, so two assisters under one scorer
 *  read `6'` and `9'` rather than sharing a figure that cannot say which was
 *  whose.
 *
 *  **This is the inverse of the move made on 10 Sep and it is not a reversal of
 *  it.** That day's change was from a list of MEN to a list of GOALS, because a
 *  man-row gave a scorer and an assister the same ink and nothing told them
 *  apart. The scorer and the assister still live on different lines, in
 *  different ink, at different sizes — what folds here is only the repetition of
 *  ONE MAN'S NAME above his own second goal, which said nothing the minute
 *  beside it had not.
 *
 *  **A man's own goal never joins his real ones.** They are credited to
 *  different sides and `PlGoal.own` is the flag; keying on the pair keeps a
 *  hypothetical scorer-and-own-goal afternoon as two rows, which is what it was.
 *
 *  **An unplaced scorer gets a row to himself.** `scorer` is null for a man the
 *  bridge could not code, and two nulls are two different men — folding them
 *  would invent one player who scored both. */
export interface PlGoalGroup {
  /** FPL code, or null for a man the bridge could not place. */
  scorer: number | null;
  own: boolean;
  /** His minutes, oldest first. Never empty. */
  minutes: number[];
  /** The DISTINCT men who set them up, in the order the goals came, **each with
   *  the minutes of the goals HE made**. One entry when the same man laid on
   *  both, two when it was two — and empty when Opta credited nobody, which is
   *  20 of 76 goals.
   *
   *  **The minutes are his, not the group's** (Craig, 11 Sep 2026, on a first
   *  build that gave the assister no clock at all: with two assisters on one
   *  scorer, `6'` against Gakpo and `9'` against Muñoz is the only thing that
   *  says which man made which). They are a subset of `minutes` above and
   *  always in the same order. */
  assisters: { code: number; minutes: number[] }[];
}

/** One side's goals folded to one row per scorer, oldest goal first.
 *
 *  Pure, order-preserving, and it takes the goals a caller already holds — the
 *  same shape `creditedGoals` hands back, so the two compose in that order. */
export function goalGroups(goals: readonly PlGoal[]): PlGoalGroup[] {
  const groups: PlGoalGroup[] = [];
  const at = new Map<string, PlGoalGroup>();

  for (const goal of goals) {
    // A null scorer is keyed by the goal's own minute so two unknowns stay two
    // rows; a coded one is keyed by the man and whether it went in his own net.
    const key = goal.scorer === null ? `?${goal.minute}` : `${goal.scorer}:${goal.own}`;
    let group = at.get(key);
    if (group === undefined) {
      group = { scorer: goal.scorer, own: goal.own, minutes: [], assisters: [] };
      at.set(key, group);
      groups.push(group);
    }
    group.minutes.push(goal.minute);
    if (goal.assister !== null) {
      const already = group.assisters.find((man) => man.code === goal.assister);
      if (already === undefined) {
        group.assisters.push({ code: goal.assister, minutes: [goal.minute] });
      } else already.minutes.push(goal.minute);
    }
  }

  return groups;
}
