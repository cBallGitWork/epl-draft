import { REPORTS } from "../../config";
import { londonDayAndDate } from "../../time";
import { eventLine, manLine } from "./briefLines";
import type { MatchDesk } from "./desk";
import { played } from "./men";
import { isGoal } from "./timeline";

// The facts one match-day report may use and nothing else, one block per match keyed by its fixture code. Each fact is
// handed once and marked with the part it belongs to, so the standfirst, the account and the sections cannot repeat each other.

export function matchBlock(desk: MatchDesk): string {
  const { match, events, counts, standing, facts, opening, described, misses, budget, nominees, lead } = desk;
  const f = match.fixture;
  const club = (side: "home" | "away") => {
    const c = match[side];
    return `${c.name}${c.shorts.length === 0 ? "" : ` (or ${c.shorts.join(" or ")})`}${c.manager === null ? "" : `, managed by ${c.manager}`}`;
  };
  const goals = events.filter(isGoal);
  const missed = new Set(misses);
  const decisiveSubs = new Set(match.men.filter((m) => !m.started && goals.some((g) => g.man?.code === m.code || g.other?.code === m.code)).map((m) => m.code));
  const table = (["home", "away"] as const).flatMap((side) => (standing[side] === null ? [] : [`- ${match[side].name}: ${standing[side]!.lines.join("; ")}`]));
  const [least, most] = budget.account;
  const [sectionLeast, sectionMost] = REPORTS.sectionWords;
  return [
    `MATCH ${f.code}${lead ? ", THE LEAD" : ""}: ${match.home.name} ${f.homeScore}-${f.awayScore} ${match.away.name}${match.halfTime === null ? "" : `, ${match.halfTime.home}-${match.halfTime.away} at half-time`}.`,
    `The clubs: ${club("home")}; ${club("away")}.`,
    [`THE TABLE, for the standfirst and nowhere else in this match:`, ...table].join("\n"),
    `OPEN THE ACCOUNT ON: ${opening}.`,
    `LENGTH: standfirst ${REPORTS.standfirstWords} words at most; account ${least} to ${most} words; ${budget.sections} section${budget.sections === 1 ? "" : "s"} of ${sectionLeast} to ${sectionMost} words each.`,
    [
      "WHAT HAPPENED, in order. Each line gives the minute phrases you may use in brackets; use one or none, never a figure of your own:",
      ...events.flatMap((event) => {
        const line = eventLine(match, event, event === described, decisiveSubs, missed);
        return line === null ? [] : [`- ${line}`];
      }),
    ].join("\n"),
    facts.length === 0 ? null : ["WORKED OUT FOR YOU, true as written:", ...facts.map((fact) => `- ${fact}`)].join("\n"),
    [
      `THE SECTIONS: choose ${budget.sections} of these men. For each, tell what he did that the account does not, then his STAKE in your own words:`,
      ...nominees.slice(0, budget.sections + REPORTS.spareNominees).map((n) => `- ${n.man.name} (${match[n.man.side].name}): ${manLine(n.man, counts.get(n.man.code), events)}. STAKE: ${n.stake}.`),
    ].join("\n"),
    `EVERY MAN YOU MAY NAME, by club: ${(["home", "away"] as const).map((side) => `${match[side].name}: ${match.men.filter((m) => m.side === side && played(m)).map((m) => m.name).join(", ")}`).join(". ")}.`,
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

export function buildReportsBrief(day: string, gameweek: number, desks: readonly MatchDesk[]): string {
  const first = desks[0]?.match.fixture.kickoff;
  const when = first === null || first === undefined ? day : londonDayAndDate(first);
  return [`MATCH-DAY REPORT, ${when}, gameweek ${gameweek}. ${desks.length} match${desks.length === 1 ? "" : "es"}, the lead first.`, ...desks.map(matchBlock)].join("\n\n=====\n\n");
}
