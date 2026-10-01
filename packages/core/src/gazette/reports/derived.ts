import { REPORTS } from "../../config";
import { minutesLeft, numeral } from "./minutes";
import { finalScore, goalsBy, isGoal, type MatchEvent } from "./timeline";
import type { ReportMatchInput, Side } from "./types";
import { plural } from "../../format";

// Facts worked out from the timeline so the writer never does sums: a lead, a burst, a late winner, a conversion rate.

const { burstMinutes: BURST, lateMinute: LATE, cleanSheetLostFrom: CLEAN_SHEET_LOST } = REPORTS;
const { most: MOST, more: MORE } = REPORTS.ball;

const other = (side: Side): Side => (side === "home" ? "away" : "home");
export const higherFirst = (a: number, b: number) => `${Math.max(a, b)}-${Math.min(a, b)}`;

/** A goal's minute as a report says it: "with 11 minutes left", or its first phrase. */
function when(event: MatchEvent): string {
  const left = minutesLeft(event.minute);
  return left !== null && event.at >= 60 ? `with ${numeral(left)} ${plural(left, "minute")} left` : (event.phrases[0] ?? "");
}

export function derivedFacts(match: ReportMatchInput, events: readonly MatchEvent[]): string[] {
  const name = (side: Side) => match[side].name;
  const goals = events.filter(isGoal);
  const final = finalScore(events);
  const facts: string[] = [];

  // The biggest lead each side held, when the final margin was smaller.
  for (const side of ["home", "away"] as const) {
    let best: MatchEvent | null = null;
    for (const goal of goals) {
      const lead = (goal.score?.[side] ?? 0) - (goal.score?.[other(side)] ?? 0);
      const bestLead = best === null ? 0 : (best.score?.[side] ?? 0) - (best.score?.[other(side)] ?? 0);
      if (lead > bestLead) best = goal;
    }
    const margin = final[side] - final[other(side)];
    if (best?.score && (best.score[side] - best.score[other(side)]) >= 2 && margin < best.score[side] - best.score[other(side)]) {
      facts.push(`${name(side)} were ${higherFirst(best.score.home, best.score.away)} up ${when(best)}`);
    }
  }

  // Two goals by one side close together.
  for (let i = 1; i < goals.length; i++) {
    const [a, b] = [goals[i - 1], goals[i]];
    if (a.side !== null && a.side === b.side && b.at - a.at <= BURST && b.at > a.at) {
      facts.push(`${name(a.side)} scored twice in ${numeral(b.at - a.at)} minutes`);
    }
  }

  // Who came from behind, and a late winner.
  for (const side of ["home", "away"] as const) {
    const trailed = goals.some((g) => (g.score?.[side] ?? 0) < (g.score?.[other(side)] ?? 0));
    if (trailed && final[side] >= final[other(side)]) facts.push(`${name(side)} came from behind`);
  }
  const winner: Side | null = final.home > final.away ? "home" : final.away > final.home ? "away" : null;
  if (winner !== null) {
    const decider = goals.find((g) => g.side === winner && (g.score?.[winner] ?? 0) === final[other(winner)] + 1);
    if (decider !== undefined && decider.at >= LATE) facts.push(`the winner came ${when(decider)}`);
  }

  // The first goal a side let in, if it came late.
  for (const side of ["home", "away"] as const) {
    const first = goals.find((g) => g.side === other(side));
    const late = first?.phrases.find((phrase) => phrase.endsWith("from time")) ?? first?.phrases[0];
    if (first !== undefined && first.at >= CLEAN_SHEET_LOST && late !== undefined) facts.push(`${name(side)}'s clean sheet went ${late}`);
  }

  // A man whose chances added up to a goal and more, with none scored, in words (the paper never prints the figure).
  for (const man of match.men) {
    const scored = goalsBy(goals, man.code) > 0;
    if (!scored && man.expectedGoals >= REPORTS.missed.expectedGoals) facts.push(`${man.name} (${name(man.side)}) had chances good enough to score and did not`);
  }

  const figures = match.figures;
  if (figures !== null) {
    for (const side of ["home", "away"] as const) {
      const f = figures[side];
      if (final[side] > 0 && f.onTarget >= final[side]) facts.push(`${name(side)} scored ${numeral(final[side])} from ${numeral(f.onTarget)} on target`);
      if (f.clearChances > 0) facts.push(`${name(side)} made ${numeral(f.clearChances)} clear ${plural(f.clearChances, "chance")} and took ${numeral(f.clearChancesScored)}`);
      if (f.possession >= MOST) facts.push(`${name(side)} had most of the ball`);
      else if (f.possession >= MORE) facts.push(`${name(side)} had more of the ball`);
    }
  }
  return facts;
}
