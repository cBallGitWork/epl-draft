import { REPORTS } from "../../config";
import { londonDayAndDate } from "../../time";
import { eventLine, manLine } from "./briefLines";
import type { MatchDesk } from "./desk";
import { played, withClub } from "./men";
import { involvedIn, isGoal } from "./timeline";
import { SIDES, type Side } from "../side";
import { howMany } from "../../format";
import { briefOf } from "../briefs/briefOf";

// The facts one match-day report may use and nothing else, one block per match keyed by its fixture code. Each fact is
// handed once and marked with the part it belongs to, so the standfirst, the account and the sections cannot repeat each other.

export function matchBlock(desk: MatchDesk): string {
  const { match, events, counts, standing, facts, opening, described, misses, budget, nominees, lead } = desk;
  const f = match.fixture;
  const club = (side: Side) => {
    const c = match[side];
    return `${c.name}${c.shorts.length === 0 ? "" : ` (or ${c.shorts.join(" or ")})`}${c.manager === null ? "" : `, managed by ${c.manager}`}`;
  };
  const goals = events.filter(isGoal);
  const missed = new Set(misses);
  const decisiveSubs = new Set(match.men.filter((m) => !m.started && involvedIn(goals, m.code) > 0).map((m) => m.code));
  const table = SIDES.flatMap((side) => {
    const club = standing[side];
    return club === null ? [] : [`- ${match[side].name}: ${club.lines.join("; ")}`];
  });
  const [least, most] = budget.account;
  const [sectionLeast, sectionMost] = REPORTS.sectionWords;
  return briefOf([
    `MATCH ${f.code}${lead ? ", THE LEAD" : ""}: ${match.home.name} ${f.homeScore}-${f.awayScore} ${match.away.name}${match.halfTime === null ? "" : `, ${match.halfTime.home}-${match.halfTime.away} at half-time`}.`,
    `The clubs: ${club("home")}; ${club("away")}.`,
    [`THE TABLE, for the standfirst and nowhere else in this match:`, ...table].join("\n"),
    `OPEN THE ACCOUNT ON: ${opening}.`,
    `LENGTH: standfirst ${REPORTS.standfirstWords} words at most; account ${least} to ${most} words; ${howMany(budget.sections, "section")} of ${sectionLeast} to ${sectionMost} words each.`,
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
      ...nominees.slice(0, budget.sections + REPORTS.spareNominees).map((n) => `- ${withClub(match, n.man)}: ${manLine(n.man, counts.get(n.man.code), events)}. STAKE: ${n.stake}.`),
    ].join("\n"),
    `EVERY MAN YOU MAY NAME, by club: ${SIDES.map((side) => `${match[side].name}: ${match.men.filter((m) => m.side === side && played(m)).map((m) => m.name).join(", ")}`).join(". ")}.`,
  ]);
}

export function buildReportsBrief(day: string, gameweek: number, desks: readonly MatchDesk[]): string {
  const first = desks[0]?.match.fixture.kickoff;
  const when = first === null || first === undefined ? day : londonDayAndDate(first);
  return [`MATCH-DAY REPORT, ${when}, gameweek ${gameweek}. ${howMany(desks.length, "match", "matches")}, the lead first.`, ...desks.map(matchBlock)].join("\n\n=====\n\n");
}
