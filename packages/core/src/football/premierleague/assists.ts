import { assistsPlaced, type PlGoal } from "./goals";
import type { RawPlEvent } from "./raw";
import { clockMinute } from "./fixtureEvents";
import { codeOf } from "./teamSheet";

// The assists FPL pays that Opta's pass-only `assistId` never places: a penalty won, a shot forcing an own goal,
// a rebound. Proposed from the commentary's event order; `streamCredited` keeps them only if FPL's counts agree.

/** Opta's textstream vocabulary: lower case and spaced, unlike the fixture feed's single letters. */
const GOAL = "goal";
const PENALTY_GOAL = "penalty goal";
const OWN_GOAL = "own goal";
const PENALTY_WON = "penalty won";

/** An attempt that can leave a goal behind it. `post` is the woodwork; FPL pays
 *  the rebound off all four. */
const ATTEMPTS = new Set(["miss", "attempt blocked", "attempt saved", "post"]);

/** One goal as the commentary tells it; `scorer` and `assister` are FPL codes, null where the bridge cannot place him. */
export interface StreamCredit {
  minute: number;
  scorer: number | null;
  assister: number | null;
}

/** A textstream label's minute (`"56"`, `"90+1"`), added time dropped as `plGoals` drops it. */
function minuteOf(event: RawPlEvent): number | null {
  return clockMinute(event.time?.label);
}

/** Every goal in the commentary with the assister FPL's rules imply. An own goal or rebound takes the attempt
 *  IMMEDIATELY before it; a penalty takes the most recent `penalty won`, however far back. */
export function streamCredits(
  events: readonly RawPlEvent[],
  codes: ReadonlyMap<number, number>,
): StreamCredit[] {
  const credits: StreamCredit[] = [];
  const code = (id: number | undefined): number | null => codeOf(codes, id);

  // The attempt immediately before the event being read, and the last penalty won at any point before it.
  let lastAttempt: RawPlEvent | null = null;
  let lastPenaltyWon: RawPlEvent | null = null;

  for (const event of events) {
    if (event.type === PENALTY_WON) {
      lastPenaltyWon = event;
      lastAttempt = null;
      continue;
    }
    if (ATTEMPTS.has(event.type)) {
      lastAttempt = event;
      continue;
    }

    const scoring =
      event.type === GOAL || event.type === PENALTY_GOAL || event.type === OWN_GOAL;
    if (!scoring) {
      lastAttempt = null;
      continue;
    }

    const minute = minuteOf(event);
    const [first, second] = event.playerIds ?? [];
    if (minute !== null) {
      credits.push({
        minute,
        // An own goal's `playerIds` is one man, the one who put it in his own net, as `PlGoal.scorer` has it.
        scorer: code(first),
        assister: assisterOf(event, second, lastAttempt, lastPenaltyWon, code),
      });
    }
    lastAttempt = null;
  }

  return credits;
}

/** Who FPL credits for one goal: the penalty's winner, else Opta's pass, else the attempt immediately before. */
function assisterOf(
  event: RawPlEvent,
  passer: number | undefined,
  lastAttempt: RawPlEvent | null,
  lastPenaltyWon: RawPlEvent | null,
  code: (id: number | undefined) => number | null,
): number | null {
  if (event.type === PENALTY_GOAL) return code(lastPenaltyWon?.playerIds?.[0]);
  if (passer !== undefined) return code(passer);
  // No pass: the man whose attempt came immediately before, or null for an ordinary unassisted goal.
  return code(lastAttempt?.playerIds?.[0]);
}

/** A side's goals with the commentary's assisters, kept only if every man's total then equals what FPL paid him.
 *  All or nothing, null on rejection; matched on minute AND scorer, since two goals can share a minute. */
export function streamCredited(
  goals: readonly PlGoal[],
  credits: readonly StreamCredit[],
  fplAssists: ReadonlyMap<number, number>,
): PlGoal[] | null {
  if (goals.length === 0) return null;

  const proposed = goals.map((goal) => {
    if (goal.assister !== null) return goal;
    const said = credits.find(
      (credit) => credit.minute === goal.minute && credit.scorer === goal.scorer,
    );
    return said?.assister == null ? goal : { ...goal, assister: said.assister };
  });

  const placed = assistsPlaced(proposed);

  const names = new Set([...placed.keys(), ...fplAssists.keys()]);
  for (const name of names) {
    if ((placed.get(name) ?? 0) !== (fplAssists.get(name) ?? 0)) return null;
  }

  return proposed;
}
