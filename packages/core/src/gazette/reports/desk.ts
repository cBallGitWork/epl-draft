import { REPORTS } from "../../config";
import { nextThree, type NextMatch } from "./ahead";
import { derivedFacts } from "./derived";
import { fantasyPanel, type FantasyPanel } from "./fantasy";
import { keyStats, type KeyStat } from "./keyStats";
import { played } from "./men";
import { clubStandings, type ClubStanding } from "./standing";
import { isGoal, manCounts, matchEvents, type ManCounts, type MatchEvent } from "./timeline";
import type { ReportDayInput, ReportMan, ReportMatchInput } from "./types";

// The editor's calls for a match-day, made in code: which match leads, the moment each account opens on, the one goal worth
// describing, who gets a section and why it matters in the league, how long. The model writes prose around these.

export interface Nominee {
  man: ReportMan;
  /** Why the league cares, as data for the writer to put in its own words. */
  stake: string;
}

export interface MatchDesk {
  match: ReportMatchInput;
  events: MatchEvent[];
  counts: Map<number, ManCounts>;
  standing: { home: ClubStanding | null; away: ClubStanding | null };
  facts: string[];
  /** Each club's next match, for the sidebar. */
  next: { home: NextMatch | null; away: NextMatch | null };
  /** What the account opens on: the moment that decided the match. Never the table, which is the standfirst's. */
  opening: string;
  /** The one goal the account describes in full; the others take a clause. */
  described: MatchEvent | null;
  budget: { account: readonly [number, number]; sections: number };
  nominees: Nominee[];
  keyStats: KeyStat[];
  fantasy: FantasyPanel;
  lead: boolean;
}

const LATE = REPORTS.lateMinute;
const BUDGET = REPORTS.budget;
const DECISIONS = ["sent-off", "second-yellow", "ruled-out", "penalty-saved", "penalty-missed"];

/** The moment that decided the match, from the timeline and the worked-out facts, in order of weight. */
function opening(match: ReportMatchInput, events: readonly MatchEvent[], facts: readonly string[]): string {
  const goals = events.filter(isGoal);
  const late = goals.filter((g) => g.at >= LATE);
  const collapse = facts.find((f) => / were \d+-\d+ up /u.test(f));
  if (collapse !== undefined && late.length > 0) return `${collapse}, and the other side scored ${late.length === 1 ? "once" : `${late.length} times`} from the 80th minute on`;
  const winner = facts.find((f) => f.startsWith("the winner came"));
  if (winner !== undefined) return winner;
  const decision = events.find((e) => DECISIONS.includes(e.kind));
  if (decision?.man) return `${decision.kind.replace("-", " ")}: ${decision.man.name} (${match[decision.man.side].name}), ${decision.phrases[0] ?? decision.minute}`;
  const hat = match.men.find((m) => goals.filter((g) => g.kind !== "own-goal" && g.man?.code === m.code).length >= 3);
  if (hat !== undefined) return `${hat.name}'s hat-trick for ${match[hat.side].name}`;
  const first = goals[0];
  return first?.man ? `the first goal: ${first.man.name}, ${first.phrases[0] ?? first.minute}` : "a goalless match: what each side made, and what kept it level";
}

/** The goal worth a full description: from distance, from a keeper's pass, a substitute's, a header, or one in added time. */
function described(events: readonly MatchEvent[]): MatchEvent | null {
  const goals = events.filter((e) => isGoal(e) && e.kind !== "own-goal" && e.shot !== null);
  return (
    goals.find((g) => ["from outside the box", "from long range", "from more than 35 yards"].includes(g.shot?.from ?? "")) ??
    goals.find((g) => g.other?.line === "G") ??
    goals.find((g) => g.man !== null && !g.man.started) ??
    goals.find((g) => g.shot?.foot === "header") ??
    goals.find((g) => g.minute.includes("+")) ??
    null
  );
}

/** "testf's", "Dave's Dons'". */
const of = (team: string) => (team.endsWith("s") ? `${team}'` : `${team}'s`);
const pts = (n: number) => `${n} point${n === 1 ? "" : "s"}`;

/** The men a section could be about, each with the league stake that earns it, most newsworthy first. */
function nominees(match: ReportMatchInput, events: readonly MatchEvent[], counts: ReadonlyMap<number, ManCounts>): Nominee[] {
  const goals = events.filter(isGoal);
  const scored = (m: ReportMan) => goals.filter((g) => g.kind !== "own-goal" && g.man?.code === m.code).length;
  const made = (m: ReportMan) => goals.filter((g) => g.other?.code === m.code).length;
  const h2h = (m: ReportMan) => {
    const h = m.holder?.h2h;
    return h == null || h.us === null || h.them === null ? "" : `; ${of(m.holder!.team)} head-to-head this period stands ${h.us}-${h.them} against ${h.opponent}`;
  };
  const out: Nominee[] = [];
  const add = (m: ReportMan, stake: string) => {
    if (!out.some((n) => n.man.code === m.code)) out.push({ man: m, stake });
  };
  const men = match.men.filter(played);
  for (const m of men.filter((x) => x.holder !== null && !x.holder.fielded && (scored(x) + made(x) > 0 || (x.points ?? 0) >= 4))) {
    add(m, `${m.holder!.team} has him on the bench, so ${m.points === null ? "his points" : pts(m.points)} did not count`);
  }
  for (const m of men.filter((x) => x.injuredOff && x.holder !== null)) add(m, `${m.holder!.team} has him; went off injured${m.fitness === null ? "" : `; since: ${m.fitness}`}`);
  const held = men.filter((x) => x.holder?.fielded === true && x.points !== null).sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
  for (const m of held.filter((x) => (x.points ?? 0) >= 5 || scored(x) + made(x) > 0)) add(m, `${m.holder!.team} has him and picked him, ${pts(m.points ?? 0)}${h2h(m)}`);
  // A high pick who gave his manager little is the other side of the week (Craig: "and who didn't do well").
  for (const m of men.filter((x) => x.started && x.holder?.fielded === true && (x.points ?? 99) <= 1 && (x.holder.round ?? 99) <= 3)) {
    add(m, `${m.holder!.team} has him, a round-${m.holder!.round} pick, picked this week, ${pts(m.points ?? 0)}${h2h(m)}`);
  }
  for (const m of men.filter((x) => x.holder === null && scored(x) + made(x) >= 2)) {
    add(m, `a free agent; ${m.goalsSeason} league goal${m.goalsSeason === 1 ? "" : "s"} this season`);
  }
  // When the stakes run short, the men whose figures stand out, so a match never has fewer candidates than sections.
  const stood = (x: ReportMan) => scored(x) + made(x) > 0 || (counts.get(x.code)?.chancesMade ?? 0) >= 3 || (counts.get(x.code)?.shots ?? 0) >= 4 || x.saves >= 5;
  for (const m of men.filter(stood)) add(m, m.holder === null ? "a free agent" : m.holder.fielded ? `${m.holder.team} has him and picked him` : `${m.holder.team} has him on the bench`);
  return out;
}

/** The day's matches, lead first and then in kick-off order, each with its calls made. */
export function deskDay(input: ReportDayInput): MatchDesk[] {
  const codes = input.matches.flatMap((m) => [m.home.code, m.away.code]);
  const standings = clubStandings(input.season, input.clubs, input.day, codes);
  const drafts = input.matches.map((match) => {
    const events = matchEvents(match);
    const standing = { home: standings.get(match.home.code) ?? null, away: standings.get(match.away.code) ?? null };
    const moved = standing.home?.moved === true || standing.away?.moved === true;
    const decided = events.some((e) => DECISIONS.includes(e.kind));
    const late = events.filter((e) => isGoal(e) && e.at >= LATE).length;
    const held = match.men.reduce((sum, m) => sum + (m.holder !== null ? (m.points ?? 0) : 0), 0);
    const score = (moved ? 100 : 0) + (decided ? 40 : 0) + late * 15 + events.filter(isGoal).length * 5 + held / 10;
    return { match, events, facts: derivedFacts(match, events), standing, score };
  });
  const leadIndex = drafts.reduce((best, d, i) => (d.score > drafts[best].score ? i : best), 0);
  const rest = drafts.filter((_, i) => i !== leadIndex).sort((a, b) => (a.match.fixture.kickoff ?? "").localeCompare(b.match.fixture.kickoff ?? ""));

  return [drafts[leadIndex], ...rest].map((d, i) => {
    const { match, events, facts } = d;
    const counts = manCounts(events, match.men);
    const dead = !events.some((e) => isGoal(e) || ["woodwork", ...DECISIONS].includes(e.kind));
    const size = dead ? BUDGET.dead : i === 0 ? BUDGET.lead : BUDGET.ordinary;
    const next = (code: number) => nextThree(input.season, input.clubs, code, input.day, input.standing)[0] ?? null;
    return {
      match,
      events,
      counts,
      standing: d.standing,
      facts,
      next: { home: next(match.home.code), away: next(match.away.code) },
      opening: opening(match, events, facts),
      described: described(events),
      budget: { account: size.account, sections: size.sections },
      nominees: nominees(match, events, counts),
      keyStats: keyStats(match, events, counts, size.stats),
      fantasy: fantasyPanel(match, events),
      lead: i === 0,
    };
  });
}
