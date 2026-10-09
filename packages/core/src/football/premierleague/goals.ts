import { codeOf, plPlayerCodes } from "./teamSheet";
import { GOAL, OWN_GOAL, PENALTY, minuteOf } from "./fixtureEvents";
import type { RawPlFixture } from "./raw";

// A side's GOALS off the fixture detail's own events; `sheetEvents.ts` answers what happened to one man.

/** One goal as a scoresheet needs it. `teamId` is the side CREDITED, which for an own goal is the beneficiary. */
export interface PlGoal {
  minute: number;
  /** The added time on the clock ("90+4'00" → 4); absent for a goal inside the ninety. */
  added?: number;
  teamId: number;
  /** FPL codes, or null where the bridge could not place him. */
  scorer: number | null;
  /** Opta's assister, null when it credited nobody, as on every own goal and penalty. */
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
    const added = Number(/^\d+\+(\d+)/u.exec(event.clock?.label ?? "")?.[1] ?? 0);
    goals.push({
      minute,
      ...(added > 0 ? { added } : {}),
      teamId: event.teamId,
      scorer: codeOf(codes, event.personId),
      assister: codeOf(codes, event.assistId),
      own: event.type === OWN_GOAL,
      penalty: event.type === PENALTY,
    });
  }

  return goals.sort((a, b) => a.minute - b.minute);
}

/** How many of these goals each man is already placed on as the assister. */
export function assistsPlaced(goals: readonly PlGoal[]): Map<number, number> {
  const placed = new Map<number, number>();
  for (const goal of goals) {
    if (goal.assister !== null) placed.set(goal.assister, (placed.get(goal.assister) ?? 0) + 1);
  }
  return placed;
}

/** A side's goals with an assister filled in only when one man's FPL shortfall equals its unexplained goals.
 *  Any ambiguity credits nobody. The last thing `creditSide` tries, after the stats league's kinds and `assists.ts`. */
export function creditedGoals(
  goals: readonly PlGoal[],
  fplAssists: ReadonlyMap<number, number>,
): PlGoal[] {
  const placed = assistsPlaced(goals);

  const unexplained = goals.filter((goal) => goal.assister === null);

  // Who FPL pays more than Opta placed, and by how much.
  const short: { code: number; need: number }[] = [];
  for (const [code, paid] of fplAssists) {
    const need = paid - (placed.get(code) ?? 0);
    if (need > 0) short.push({ code, need });
  }

  // Only one claimant short by exactly the unexplained goals resolves; anything else stays as the feed gave it.
  const resolves =
    short.length === 1 && short[0].need === unexplained.length && unexplained.length > 0;

  return goals.map((goal) =>
    resolves && goal.assister === null ? { ...goal, assister: short[0].code } : goal,
  );
}

/** One scorer's goals folded into one row. A man's own goal never joins his real ones, and an unplaced
 *  scorer gets a row per goal: two nulls are two different men. */
export interface PlGoalGroup {
  /** FPL code, or null for a man the bridge could not place. */
  scorer: number | null;
  own: boolean;
  /** His minutes, oldest first. Never empty. */
  minutes: number[];
  /** The distinct men who set them up, in goal order, each with the minutes of the goals HE made (a subset of
   *  `minutes`, same order). Empty when Opta credited nobody. */
  assisters: { code: number; minutes: number[] }[];
}

/** One side's goals folded to one row per scorer, oldest goal first; composes after `creditedGoals`. */
export function goalGroups(goals: readonly PlGoal[]): PlGoalGroup[] {
  const groups: PlGoalGroup[] = [];
  const at = new Map<string, PlGoalGroup>();

  for (const [index, goal] of goals.entries()) {
    // A null scorer keys on the goal itself so two unknowns stay two rows, even in one minute; a coded one on the man and the net.
    const key = goal.scorer === null ? `?${index}` : `${goal.scorer}:${goal.own}`;
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
