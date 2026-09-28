import { streamCredited, type StreamCredit } from "./assists";
import { assistsPlaced, creditedGoals, type PlGoal } from "./goals";

// The fantasy assists whose KIND names the goal they made, off the stats league's per-gameweek counts.

/** One man's gameweek: the assists that fix their goal, and his own direct free-kick goals. */
export interface AssistKinds {
  penaltyWon: number;
  ownGoalForced: number;
  /** A direct free kick won, by a foul or a handball, and scored. */
  freeKickWon: number;
  freeKickGoals: number;
}

type Kind = Exclude<keyof AssistKinds, "freeKickGoals">;

/** A goal of each kind, told apart by what the feed says and by its scorer's free-kick count. */
const KINDS: { kind: Kind; is: (goal: PlGoal, freeKicker: (code: number | null) => boolean) => boolean }[] = [
  { kind: "ownGoalForced", is: (goal) => goal.own },
  { kind: "penaltyWon", is: (goal) => !goal.own && goal.penalty === true },
  { kind: "freeKickWon", is: (goal, freeKicker) => !goal.own && goal.penalty !== true && freeKicker(goal.scorer) },
];

/** One side's goals with every assist whose kind fixes its goal filled in.
 *  Only a sole claimant FPL paid in THIS match, owed enough to cover every such goal, is credited. */
export function kindCredited(
  goals: readonly PlGoal[],
  kinds: ReadonlyMap<number, AssistKinds>,
  paid: ReadonlyMap<number, number>,
): PlGoal[] {
  const out = [...goals];
  // A scorer's open goals are all free kicks only when he has no more of them unplaced than he scored.
  const open = new Map<number, number>();
  for (const goal of out) {
    if (goal.assister !== null || goal.own || goal.penalty === true || goal.scorer === null) continue;
    open.set(goal.scorer, (open.get(goal.scorer) ?? 0) + 1);
  }
  const freeKicker = (code: number | null) =>
    code !== null && (open.get(code) ?? 0) <= (kinds.get(code)?.freeKickGoals ?? 0);

  for (const { kind, is } of KINDS) {
    const targets = out.flatMap((goal, at) => (goal.assister === null && is(goal, freeKicker) ? [at] : []));
    if (targets.length === 0) continue;
    const placed = assistsPlaced(out);
    const claimants = [...paid].filter(
      ([code, count]) => (kinds.get(code)?.[kind] ?? 0) > 0 && count > (placed.get(code) ?? 0),
    );
    if (claimants.length !== 1) continue;
    const [code, count] = claimants[0];
    const room = Math.min(kinds.get(code)?.[kind] ?? 0, count - (placed.get(code) ?? 0));
    if (targets.length > room || targets.some((at) => out[at].scorer === code)) continue;
    for (const at of targets) out[at] = { ...out[at], assister: code };
  }
  return out;
}

/** One side's assisters: the kinds first, then the commentary if FPL confirms it, then FPL's arithmetic. */
export function creditSide(
  goals: readonly PlGoal[],
  credits: readonly StreamCredit[],
  kinds: ReadonlyMap<number, AssistKinds>,
  paid: ReadonlyMap<number, number>,
): PlGoal[] {
  const typed = kindCredited(goals, kinds, paid);
  return streamCredited(typed, credits, paid) ?? creditedGoals(typed, paid);
}
