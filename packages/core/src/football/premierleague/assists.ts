import { assistsPlaced, type PlGoal } from "./goals";
import type { RawPlEvent } from "./raw";

// The three assists FPL pays and Opta does not place.
//
// **The defect this answers, in one fixture.** Man Utd 5-2 Ipswich, gameweek 2:
// FPL pays five assists for five Man Utd goals — Cunha 2, Maguire 1, Fernandes 1,
// Mbeumo 1 — and the fixture feed places two of them. The scoresheet showed those
// two and dropped three, because `creditedGoals` resolves only when exactly one
// man is short, and here three men were each short by one against three
// unexplained goals (Craig, 11 Sep 2026: *"try find brunos assists, mbuemo had 1,
// why did we miss that?… greaves og had a assist, try work that out yourself"*).
//
// **Why Opta places none of the three: they are not passes.** FPL's own rules
// pay an assist for three things beyond the ball that was played:
//
//   - **winning a penalty** that is then converted;
//   - **forcing an own goal** with a shot or a cross;
//   - **a shot blocked, saved or off the woodwork** that is scored from the
//     rebound.
//
// Opta's `assistId` is the pass, so it is absent on all three by construction —
// counted 10 Sep 2026 at 0 of 5 own goals and 0 of 4 penalties. The gap is not a
// hole in the feed; it is two different definitions of the word.
//
// **And the commentary has all three as EVENTS.** The textstream this app
// already fetches and caches for the Match Report carries `penalty won` as its
// own type with the man in `playerIds`, and it carries every attempt — `miss`,
// `attempt blocked`, `attempt saved`, `post` — in order, so the shot before a
// goal or an own goal is the event immediately before it. Nothing new is
// fetched to read any of this.
//
// **Proposed, never asserted.** Two of the three legs rest on event ORDER rather
// than a published field, so this module hands the caller a proposal and
// `streamCredited` below throws the whole thing away unless FPL's own per-man
// counts agree with it exactly. A mis-paired assist is the confident wrong
// statement DESIGN §7 refuses, and a proposal that two independent sources
// confirm is the opposite of a guess.

/** Opta's textstream vocabulary — lower case and spaced, unlike the fixture
 *  feed's single letters. */
const GOAL = "goal";
const PENALTY_GOAL = "penalty goal";
const OWN_GOAL = "own goal";
const PENALTY_WON = "penalty won";

/** An attempt that can leave a goal behind it. `post` is the woodwork; FPL pays
 *  the rebound off all four. */
const ATTEMPTS = new Set(["miss", "attempt blocked", "attempt saved", "post"]);

/** One goal as the commentary tells it, with the man FPL's rules would credit.
 *
 *  `scorer` and `assister` are FPL codes, or null for a man the bridge could not
 *  place — the same tolerance every mapper here states. */
export interface StreamCredit {
  minute: number;
  scorer: number | null;
  assister: number | null;
}

/** The minute a textstream label names, added time dropped — the same rule
 *  `plGoals` states, so the two agree on which minute a goal happened in.
 *  A label is `"56"` or `"90+1"` here, where the fixture feed writes `"56'00"`. */
function minuteOf(event: RawPlEvent): number | null {
  const label = event.time?.label;
  if (label === undefined) return null;
  const at = Number.parseInt(label, 10);
  return Number.isNaN(at) ? null : at;
}

/** Every goal in the commentary with the assister FPL's rules imply.
 *
 *  Walks in order, because order is the evidence: the shot that forces an own
 *  goal or leaves a rebound is the attempt IMMEDIATELY before the goal, and
 *  requiring it to be immediate is what keeps a shot from four minutes earlier
 *  off a name. The penalty is the one that may look back further — a penalty is
 *  won at 59' and taken at 61' — so it takes the most recent `penalty won`,
 *  which is also the right answer when an earlier one was missed.
 *
 *  Pure: `codes` is injected the way every mapper here takes it, and nothing
 *  reads a clock or a network (CODE_RULES §5). */
export function streamCredits(
  events: readonly RawPlEvent[],
  codes: ReadonlyMap<number, number>,
): StreamCredit[] {
  const credits: StreamCredit[] = [];
  const code = (id: number | undefined): number | null =>
    id === undefined ? null : (codes.get(id) ?? null);

  // The attempt immediately before the event being read, and the last penalty
  // won at any point before it.
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
        // **An own goal's `playerIds` names the man who put it in his own net**,
        // which is the same man `PlGoal.scorer` carries for it. One entry, never
        // two: counted on the recorded fixture, the own goal has `playerIds`
        // of length 1 where every assisted goal has 2.
        scorer: code(first),
        assister: assisterOf(event, second, lastAttempt, lastPenaltyWon, code),
      });
    }
    lastAttempt = null;
  }

  return credits;
}

/** Who FPL credits for one goal in the commentary.
 *
 *  The pass wins when Opta placed one — the textstream's second `playerIds`
 *  entry is that man, and no inference beats a published field. Everything below
 *  it is the three rules FPL adds. */
function assisterOf(
  event: RawPlEvent,
  passer: number | undefined,
  lastAttempt: RawPlEvent | null,
  lastPenaltyWon: RawPlEvent | null,
  code: (id: number | undefined) => number | null,
): number | null {
  if (event.type === PENALTY_GOAL) return code(lastPenaltyWon?.playerIds?.[0]);
  if (passer !== undefined) return code(passer);
  // An own goal, or a goal with no pass behind it: the man whose attempt came
  // immediately before. Null when nothing did, which is an unassisted goal and
  // the ordinary case.
  return code(lastAttempt?.playerIds?.[0]);
}

/** One side's goals with the commentary's assisters filled in — but only when
 *  FPL's own arithmetic confirms the whole proposal.
 *
 *  **The confirmation is the point, and it is deliberately all-or-nothing.**
 *  Build what the proposal would credit each man, and compare it to what FPL
 *  paid each man for this fixture. Equal on every name, and two sources that
 *  define an assist differently and count it separately have arrived at the same
 *  answer — which is evidence, not a guess. Different anywhere, and the whole
 *  assignment is dropped rather than part-applied: a proposal that is wrong
 *  about one goal gives no reason to trust it about the next, and `creditedGoals`
 *  is still there to resolve the single-claimant case behind it.
 *
 *  Returns null on rejection rather than the goals unchanged, so a caller has to
 *  say what it does instead instead of silently getting today's answer.
 *
 *  **Matched on the minute AND the scorer**, because two goals can share a
 *  minute and a scoresheet that swaps two assisters within one minute is exactly
 *  the error this module exists to avoid. */
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
