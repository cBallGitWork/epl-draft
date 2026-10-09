import type { MomentKind } from "../../football/premierleague/moments";
import type { PlShot } from "../../football/premierleague/momentWords";
import { clock, minutePhrases } from "./minutes";
import type { ReportMan, ReportMatchInput } from "./types";
import { otherSide, type Side } from "../side";

// One match's moments with their men resolved, their side known and the score carried: the spine of every fact after it.

export interface MatchEvent {
  minute: string;
  /** Minute plus added time, for gaps between moments; never printed. */
  at: number;
  half: 1 | 2;
  kind: MomentKind;
  /** The side the moment counts FOR: a goal's side, an own goal's beneficiary, a booked man's own side. */
  side: Side | null;
  man: ReportMan | null;
  other: ReportMan | null;
  shot: PlShot | null;
  injury: boolean;
  varCall: string | null;
  addedMinutes: number | null;
  /** The score after a goal; null on every other moment. */
  score: { home: number; away: number } | null;
  phrases: string[];
}

const GOALS: ReadonlySet<MomentKind> = new Set(["goal", "penalty-goal", "own-goal"]);
const SHOTS: ReadonlySet<MomentKind> = new Set(["goal", "penalty-goal", "saved", "missed", "blocked", "woodwork", "penalty-missed", "penalty-saved"]);
const ON_TARGET: ReadonlySet<MomentKind> = new Set(["goal", "penalty-goal", "saved", "penalty-saved"]);
const CHANGES: ReadonlySet<MomentKind> = new Set(["substitution"]);

export const isGoal = (event: MatchEvent) => GOALS.has(event.kind);
/** Goals he scored, own goals aside. */
export const goalsBy = (events: readonly MatchEvent[], code: number) =>
  events.filter((e) => isGoal(e) && e.kind !== "own-goal" && e.man?.code === code).length;
/** Goals he set up. */
export const assistsBy = (events: readonly MatchEvent[], code: number) => events.filter((e) => isGoal(e) && e.other?.code === code).length;
/** A red card, straight or a second yellow. */
export const isDismissal = (kind: MomentKind) => kind === "sent-off" || kind === "second-yellow";

/** The match in order. A moment about a man we cannot place is kept only when it is about nobody (added time, the whistles). */
export function matchEvents(match: ReportMatchInput): MatchEvent[] {
  const byCode = new Map(match.men.map((man) => [man.code, man]));
  const find = (code: number | null) => (code === null ? null : (byCode.get(code) ?? null));
  const score = { home: 0, away: 0 };
  const events: MatchEvent[] = [];
  for (const moment of match.moments) {
    const man = find(moment.men[0]);
    const nobody = moment.kind === "added-time" || moment.kind === "half-time" || moment.kind === "full-time";
    if (man === null && !nobody) continue;
    const side = man === null ? null : moment.kind === "own-goal" || moment.kind === "penalty-conceded" ? otherSide(man.side) : man.side;
    let after: MatchEvent["score"] = null;
    if (GOALS.has(moment.kind) && side !== null) {
      score[side] += 1;
      after = { ...score };
    }
    const at = clock(moment.minute);
    events.push({
      minute: moment.minute,
      at: at === null ? 0 : at.minute + at.added,
      half: moment.half,
      kind: moment.kind,
      side,
      man,
      other: find(moment.men[1]),
      shot: moment.shot,
      injury: moment.injury,
      varCall: moment.varCall,
      addedMinutes: moment.addedMinutes,
      score: after,
      phrases: minutePhrases(moment.minute, CHANGES.has(moment.kind)),
    });
  }
  return events;
}

export interface ManCounts {
  shots: number;
  onTarget: number;
  /** Shots he set up, the "Assisted by" on any attempt that was not a penalty. */
  chancesMade: number;
  woodwork: number;
  /** Corners and set pieces he delivered that ended in a shot. */
  deliveries: number;
}

const zero = (): ManCounts => ({ shots: 0, onTarget: 0, chancesMade: 0, woodwork: 0, deliveries: 0 });

/** Each man's counts in this match, by FPL code; a man who played and did none of it is all noughts. */
export function manCounts(events: readonly MatchEvent[], men: readonly ReportMan[]): Map<number, ManCounts> {
  const counts = new Map(men.map((man) => [man.code, zero()]));
  for (const event of events) {
    if (!SHOTS.has(event.kind)) continue;
    const shooter = event.man === null ? undefined : counts.get(event.man.code);
    if (shooter !== undefined) {
      shooter.shots += 1;
      if (ON_TARGET.has(event.kind)) shooter.onTarget += 1;
      if (event.kind === "woodwork") shooter.woodwork += 1;
    }
    const maker = event.other === null ? undefined : counts.get(event.other.code);
    if (maker !== undefined && event.shot?.situation !== "penalty") {
      maker.chancesMade += 1;
      if (event.shot?.situation === "corner" || event.shot?.situation === "set piece") maker.deliveries += 1;
    }
  }
  return counts;
}

/** The final score as the goals add it up, which the fixture's own score must match. */
export function finalScore(events: readonly MatchEvent[]): { home: number; away: number } {
  const last = [...events].reverse().find((event) => event.score !== null);
  return last?.score ?? { home: 0, away: 0 };
}
