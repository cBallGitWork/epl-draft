import { LATE_GOAL_MINUTE, REPORTS } from "../../config";
import { minutesLeft, numeral } from "./minutes";
import { finalScore, goalsBy, isGoal, type MatchEvent } from "./timeline";
import type { ReportMatchInput } from "./types";
import { withClub } from "./men";
import { plural } from "../../format";
import { SIDES, otherSide, type Side } from "../side";

// Facts worked out from the timeline so the writer never does sums: a lead, a burst, a late winner, a conversion rate.

const { burstMinutes: BURST } = REPORTS;
const { most: MOST, more: MORE } = REPORTS.ball;

export const higherFirst = (a: number, b: number) => `${Math.max(a, b)}-${Math.min(a, b)}`;

/** A goal's minute as a report says it: "with 11 minutes left", or its first phrase (the 90th has none left). */
function when(event: MatchEvent): string {
  const left = minutesLeft(event.minute);
  return left !== null && left > 0 && event.at >= 60 ? `with ${numeral(left)} ${plural(left, "minute")} left` : (event.phrases[0] ?? "");
}

/** "once", "twice", "three times". */
export const times = (n: number) => (n === 1 ? "once" : n === 2 ? "twice" : `${numeral(n)} times`);

export function derivedFacts(match: ReportMatchInput, events: readonly MatchEvent[]): string[] {
  const name = (side: Side) => match[side].name;
  const goals = events.filter(isGoal);
  const final = finalScore(events);
  const facts: string[] = [];

  // The biggest lead each side held, when the final margin was smaller.
  for (const side of SIDES) {
    let best: MatchEvent | null = null;
    for (const goal of goals) {
      const lead = (goal.score?.[side] ?? 0) - (goal.score?.[otherSide(side)] ?? 0);
      const bestLead = best === null ? 0 : (best.score?.[side] ?? 0) - (best.score?.[otherSide(side)] ?? 0);
      if (lead > bestLead) best = goal;
    }
    const margin = final[side] - final[otherSide(side)];
    if (best?.score && (best.score[side] - best.score[otherSide(side)]) >= 2 && margin < best.score[side] - best.score[otherSide(side)]) {
      facts.push(`${name(side)} were ${higherFirst(best.score.home, best.score.away)} up ${when(best)}`);
    }
  }

  // Goals by one side close together, in one half, told once per run: first-half added time runs into the second half's clock.
  for (let i = 0; i < goals.length; ) {
    const a = goals[i];
    let j = i;
    while (j + 1 < goals.length && a.side !== null && goals[j + 1].side === a.side && goals[j + 1].half === a.half && goals[j + 1].at > goals[j].at && goals[j + 1].at - a.at <= BURST) j++;
    const span = goals[j].at - a.at;
    if (a.side !== null && j > i) facts.push(`${name(a.side)} scored ${times(j - i + 1)} in ${numeral(span)} ${plural(span, "minute")}`);
    i = j + 1;
  }

  // Who came from behind, and a late winner.
  for (const side of SIDES) {
    const trailed = goals.some((g) => (g.score?.[side] ?? 0) < (g.score?.[otherSide(side)] ?? 0));
    if (trailed && final[side] >= final[otherSide(side)]) facts.push(`${name(side)} came from behind`);
  }
  const winner: Side | null = final.home > final.away ? "home" : final.away > final.home ? "away" : null;
  if (winner !== null) {
    const decider = goals.find((g) => g.side === winner && (g.score?.[winner] ?? 0) === final[otherSide(winner)] + 1);
    if (decider !== undefined && decider.at >= LATE_GOAL_MINUTE) facts.push(`the winner came ${when(decider)}`);
  }

  // The first goal a side let in, if it came late.
  for (const side of SIDES) {
    const first = goals.find((g) => g.side === otherSide(side));
    const late = first?.phrases.find((phrase) => phrase.endsWith("from time")) ?? first?.phrases[0];
    if (first !== undefined && first.at >= LATE_GOAL_MINUTE && late !== undefined) facts.push(`${name(side)}'s clean sheet went ${late}`);
  }

  // A man whose chances added up to a goal and more, with none scored, in words (the paper never prints the figure).
  for (const man of match.men) {
    const scored = goalsBy(goals, man.code) > 0;
    if (!scored && man.expectedGoals >= REPORTS.missed.expectedGoals) facts.push(`${withClub(match, man)} had chances good enough to score and did not`);
  }

  const figures = match.figures;
  if (figures !== null) {
    for (const side of SIDES) {
      const f = figures[side];
      // An own goal is no shot of theirs.
      const shotIn = goals.filter((g) => g.side === side && g.kind !== "own-goal").length;
      if (shotIn > 0 && f.onTarget >= shotIn) facts.push(`${name(side)} scored ${numeral(shotIn)} from ${numeral(f.onTarget)} on target`);
      if (f.clearChances > 0) facts.push(`${name(side)} made ${numeral(f.clearChances)} clear ${plural(f.clearChances, "chance")} and took ${numeral(f.clearChancesScored)}`);
      if (f.possession >= MOST) facts.push(`${name(side)} had most of the ball`);
      else if (f.possession >= MORE) facts.push(`${name(side)} had more of the ball`);
    }
  }
  return facts;
}
