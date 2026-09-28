import { REPORTS } from "../../config";
import { nextThree, type NextMatch } from "./ahead";
import { derivedFacts } from "./derived";
import { keyStats, surname, type KeyStat } from "./keyStats";
import { played } from "./men";
import { clubStandings, type ClubStanding } from "./standing";
import { isGoal, manCounts, matchEvents, type ManCounts, type MatchEvent } from "./timeline";
import type { ReportDayInput, ReportMan, ReportMatchInput } from "./types";

// The editor's calls for a match-day, made in code: which match leads, each one's angle, who gets a section, how long.
// The model writes prose around these; it never chooses them, so five matches do not converge on one shape.

export type Angle = "the table" | "a decision" | "late goals" | "a man" | "a run" | "a set piece" | "the goals";

export interface Nominee {
  man: ReportMan;
  why: string;
}

export interface MatchDesk {
  match: ReportMatchInput;
  events: MatchEvent[];
  counts: Map<number, ManCounts>;
  standing: { home: ClubStanding | null; away: ClubStanding | null };
  facts: string[];
  ahead: { home: NextMatch[]; away: NextMatch[] };
  angle: { angle: Angle; why: string };
  budget: { words: readonly [number, number]; sections: number };
  nominees: Nominee[];
  keyStats: KeyStat[];
}

const BUDGET = REPORTS.budget;
const LATE = REPORTS.lateMinute;

/** Each candidate angle this match can carry, in the order an editor prefers them. */
function angles(desk: Omit<MatchDesk, "angle" | "budget" | "nominees" | "keyStats">): { angle: Angle; why: string }[] {
  const out: { angle: Angle; why: string }[] = [];
  const { events, standing, match } = desk;
  const moved = [standing.home, standing.away].filter((s): s is ClubStanding => s?.moved === true);
  if (moved.length > 0) out.push({ angle: "the table", why: moved.map((s) => `${s.code === match.home.code ? match.home.name : match.away.name}: ${s.lines.join(", ")}`).join("; ") });
  const decisions = events.filter((e) => ["sent-off", "second-yellow", "penalty-goal", "penalty-missed", "penalty-saved", "ruled-out"].includes(e.kind));
  if (decisions.length > 0) out.push({ angle: "a decision", why: decisions.map((e) => `${e.kind.replace("-", " ")} ${e.man === null ? "" : surname(e.man.name)}`.trim()).join(", ") });
  const late = events.filter((e) => isGoal(e) && e.at >= LATE);
  if (late.length >= 2 || desk.facts.some((f) => f.startsWith("the winner came"))) out.push({ angle: "late goals", why: `${late.length} goal${late.length === 1 ? "" : "s"} from the 80th minute on` });
  const involved = match.men.filter((m) => events.filter((e) => isGoal(e) && (e.man?.code === m.code || e.other?.code === m.code)).length >= 2);
  if (involved.length > 0) out.push({ angle: "a man", why: involved.map((m) => surname(m.name)).join(", ") });
  const runs = [standing.home, standing.away].flatMap((s) => s?.lines.filter((l) => /win|defeat|unbeaten/.test(l)) ?? []);
  if (runs.length > 0) out.push({ angle: "a run", why: runs.join("; ") });
  if (events.some((e) => isGoal(e) && ["corner", "set piece", "direct free kick"].includes(e.shot?.situation ?? ""))) out.push({ angle: "a set piece", why: "a goal from a set piece" });
  out.push({ angle: "the goals", why: "the goals in order" });
  return out;
}

/** Who a section could be about, most newsworthy first. A man is never nominated for whom he replaced. */
function nominees(match: ReportMatchInput, events: readonly MatchEvent[], counts: ReadonlyMap<number, ManCounts>): Nominee[] {
  const goals = events.filter(isGoal);
  const scored = (m: ReportMan) => goals.filter((g) => g.kind !== "own-goal" && g.man?.code === m.code).length;
  const made = (m: ReportMan) => goals.filter((g) => g.other?.code === m.code).length;
  const out: Nominee[] = [];
  const add = (man: ReportMan, why: string) => {
    if (!out.some((n) => n.man.code === man.code)) out.push({ man, why });
  };
  for (const m of match.men.filter((x) => scored(x) + made(x) >= 2)) add(m, `${scored(m)} goal(s), ${made(m)} assist(s)`);
  for (const m of match.men.filter((x) => x.injuredOff && x.holder !== null)) add(m, `went off injured; held by ${m.holder!.team}`);
  for (const m of match.men.filter((x) => x.holder === null && played(x) && (scored(x) + made(x) > 0 || (counts.get(x.code)?.shots ?? 0) >= 3 || (counts.get(x.code)?.chancesMade ?? 0) >= 3))) add(m, "nobody in the league holds him");
  for (const m of match.men.filter((x) => x.holder?.fielded === true && !x.started)) add(m, `${m.holder!.team} fielded him and he did not start`);
  for (const m of match.men.filter((x) => (counts.get(x.code)?.deliveries ?? 0) > 0 && made(x) > 0)) add(m, "made a goal from a set piece");
  for (const m of match.men.filter((x) => scored(x) + made(x) === 1)) add(m, scored(m) > 0 ? "scored" : "made a goal");
  return out;
}

/** The day's matches, lead first and then in kick-off order, each with its calls made. */
export function deskDay(input: ReportDayInput): MatchDesk[] {
  const codes = input.matches.flatMap((m) => [m.home.code, m.away.code]);
  const standings = clubStandings(input.season, input.clubs, input.day, codes);
  const drafts = input.matches.map((match) => {
    const events = matchEvents(match);
    const counts = manCounts(events, match.men);
    const base = {
      match,
      events,
      counts,
      standing: { home: standings.get(match.home.code) ?? null, away: standings.get(match.away.code) ?? null },
      facts: derivedFacts(match, events),
      ahead: {
        home: nextThree(input.season, input.clubs, match.home.code, input.day, input.standing),
        away: nextThree(input.season, input.clubs, match.away.code, input.day, input.standing),
      },
    };
    const options = angles(base);
    const held = match.men.reduce((sum, m) => sum + (m.holder !== null ? (m.points ?? 0) : 0), 0);
    const score = (options[0].angle === "the table" ? 100 : 0) + (options.some((o) => o.angle === "a decision") ? 40 : 0) + (options.some((o) => o.angle === "late goals") ? 30 : 0) + held / 10;
    return { base, options, score };
  });
  const leadIndex = drafts.reduce((best, d, i) => (d.score > drafts[best].score ? i : best), 0);
  const order = [drafts[leadIndex], ...drafts.filter((_, i) => i !== leadIndex).sort((a, b) => (a.base.match.fixture.kickoff ?? "").localeCompare(b.base.match.fixture.kickoff ?? ""))];

  const taken = new Set<Angle>();
  return order.map((draft, i) => {
    const angle = draft.options.find((o) => !taken.has(o.angle) || o.angle === "the goals") ?? draft.options.at(-1)!;
    taken.add(angle.angle);
    const dead = !draft.base.events.some((e) => isGoal(e) || ["sent-off", "second-yellow", "woodwork", "penalty-missed", "penalty-saved"].includes(e.kind));
    const size = dead ? BUDGET.dead : i === 0 ? BUDGET.lead : BUDGET.ordinary;
    return {
      ...draft.base,
      angle,
      budget: { words: size.words, sections: size.sections },
      nominees: nominees(draft.base.match, draft.base.events, draft.base.counts),
      keyStats: keyStats(draft.base.match, draft.base.events, draft.base.counts, draft.base.facts, size.stats),
    };
  });
}
