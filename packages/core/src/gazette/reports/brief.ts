import { REPORTS } from "../../config";
import { londonDayAndDate } from "../../time";
import { eventLine, manLine } from "./briefLines";
import type { MatchDesk } from "./desk";
import { played } from "./men";
import type { NextMatch } from "./ahead";

// The facts one match-day report may use and nothing else, one block per match keyed by its fixture code.
// What the writer must not mention is withheld, not forbidden: no possession figure, no expected goals, no source.

const nextLine = (club: string, next: readonly NextMatch[]) =>
  next.length === 0
    ? null
    : `- ${club}: ${next.map((m) => `${m.opponent} ${m.home ? "at home" : "away"}${m.words.length === 0 ? "" : ` (${m.words.join(", ")})`}`).join("; ")}`;

export function matchBlock(desk: MatchDesk, lead: boolean): string {
  const { match, events, counts, standing, facts, ahead, angle, budget, nominees } = desk;
  const f = match.fixture;
  const club = (side: "home" | "away") => {
    const c = match[side];
    return `${c.name}${c.short === null ? "" : ` (you may also say ${c.short})`}${c.manager === null ? "" : `, managed by ${c.manager}`}`;
  };
  const figures = match.figures;
  return [
    `MATCH ${f.code}${lead ? ", THE LEAD" : ""}: ${match.home.name} ${f.homeScore}-${f.awayScore} ${match.away.name}${match.halfTime === null ? "" : `, ${match.halfTime.home}-${match.halfTime.away} at half-time`}.`,
    `The clubs: ${club("home")}; ${club("away")}.${match.referee === null ? "" : ` Referee: ${match.referee}.`}`,
    `ANGLE: ${angle.angle} (${angle.why}).`,
    `LENGTH: ${budget.words[0]} to ${budget.words[1]} words in all, in ${budget.sections} section${budget.sections === 1 ? "" : "s"}.`,
    ["WHERE IT LEAVES THEM:", ...(["home", "away"] as const).flatMap((side) => {
      const s = standing[side];
      return s === null ? [] : [`- ${match[side].name}: ${s.lines.join("; ")}`];
    })].join("\n"),
    ["HOW IT WENT, in order. Each line gives the minute phrases you may use in brackets; use one of them or none, never a figure of your own:",
      ...events.flatMap((event) => {
        const line = eventLine(match, event);
        return line === null ? [] : [`- ${line}`];
      })].join("\n"),
    ["WORKED OUT FOR YOU, true as written; use these rather than doing sums:",
      ...facts.map((fact) => `- ${fact}`),
      ...(figures === null ? [] : [`- Shots: ${match.home.name} ${figures.home.shots} (${figures.home.onTarget} on target), ${match.away.name} ${figures.away.shots} (${figures.away.onTarget} on target). Corners ${figures.home.corners}-${figures.away.corners}.`])].join("\n"),
    ["THE MEN, each with his club. These are the only footballers you may name:",
      ...match.men.filter((m) => played(m) || m.holder?.fielded === true).map((m) => manLine(match, m, counts.get(m.code), events))].join("\n"),
    [`WHO THE SECTIONS COULD BE ABOUT, most newsworthy first; choose ${budget.sections}. The reason is for you, not to print:`,
      ...nominees.slice(0, budget.sections + REPORTS.spareNominees).map((n) => `- ${n.man.name} (${match[n.man.side].name}): ${n.why}`)].join("\n"),
    ahead.home.length + ahead.away.length === 0
      ? null
      : ["WHAT COMES NEXT:", nextLine(match.home.name, ahead.home), nextLine(match.away.name, ahead.away)].filter((l) => l !== null).join("\n"),
  ]
    .filter((block) => block !== null)
    .join("\n\n");
}

export function buildReportsBrief(day: string, gameweek: number, desks: readonly MatchDesk[]): string {
  const first = desks[0]?.match.fixture.kickoff;
  const when = first === null || first === undefined ? day : londonDayAndDate(first);
  return [
    `MATCH-DAY REPORT, ${when}, gameweek ${gameweek}. ${desks.length} match${desks.length === 1 ? "" : "es"}, the lead first.`,
    ...desks.map((desk, i) => matchBlock(desk, i === 0)),
  ].join("\n\n=====\n\n");
}
