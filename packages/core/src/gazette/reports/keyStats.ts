import { REPORTS } from "../../config";
import { numeral } from "./minutes";
import { played } from "./men";
import { isGoal, type ManCounts, type MatchEvent } from "./timeline";
import type { ReportMan, ReportMatchInput } from "./types";

// The key-stats box: desk-made lines, never written by the model. xG and xA may choose a line; they never print.

export interface KeyStat {
  text: string;
}

const PARTICLES = new Set(["van", "de", "da", "dos", "der", "den", "di", "le", "la", "ter"]);

/** "Jan Paul van Hecke" → "van Hecke"; "Sávio" → "Sávio". */
export function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  const at = parts.findIndex((part, i) => i > 0 && PARTICLES.has(part));
  return at > 0 ? parts.slice(at).join(" ") : (parts.at(-1) ?? name);
}

const count = (n: number, one: string, many = `${one}s`) => `${numeral(n)} ${n === 1 ? one : many}`;

const { mostShots: MOST_SHOTS, chances: CHANCES, expectedAssists: EXPECTED_ASSISTS, saves: SAVES, freeNames: FREE_NAMES } = REPORTS.stats;

export function keyStats(
  match: ReportMatchInput,
  events: readonly MatchEvent[],
  counts: ReadonlyMap<number, ManCounts>,
  facts: readonly string[],
  budget: number,
): KeyStat[] {
  const lines: string[] = [];
  const goals = events.filter(isGoal);
  const scored = (man: ReportMan) => goals.filter((g) => g.kind !== "own-goal" && g.man?.code === man.code).length;
  const made = (man: ReportMan) => goals.filter((g) => g.other?.code === man.code).length;
  const c = (man: ReportMan) => counts.get(man.code);
  const men = match.men.filter(played);
  const tag = (man: ReportMan) => `${match[man.side].short ?? match[man.side].name}, ${man.holder === null ? "free" : man.holder.team}`;

  lines.push(...facts.filter((fact) => fact.includes("clean sheet went")));
  for (const event of events.filter((e) => e.kind === "woodwork" && e.man !== null)) {
    lines.push(`${surname(event.man!.name)} (${tag(event.man!)}) hit ${event.shot?.to === "against the bar" ? "the bar" : "the post"}`);
  }
  const shooter = [...men].sort((a, b) => (c(b)?.shots ?? 0) - (c(a)?.shots ?? 0))[0];
  if (shooter !== undefined && (c(shooter)?.shots ?? 0) >= MOST_SHOTS) {
    const s = c(shooter)!;
    lines.push(`${surname(shooter.name)} (${tag(shooter)}): ${count(s.shots, "shot")}, ${numeral(s.onTarget)} on target, ${count(scored(shooter), "goal")}`);
  }
  for (const man of men.filter((m) => m.line === "F" && m.started && m.minutes >= 60 && (c(m)?.shots ?? 0) === 0)) {
    lines.push(`${surname(man.name)} (${tag(man)}): no shots in ${man.minutes} minutes`);
  }
  for (const man of men.filter((m) => made(m) === 0 && ((c(m)?.chancesMade ?? 0) >= CHANCES || m.expectedAssists >= EXPECTED_ASSISTS))) {
    const chances = c(man)?.chancesMade ?? 0;
    if (chances > 0) lines.push(`${surname(man.name)} (${tag(man)}): made ${count(chances, "chance")}, none taken`);
  }
  for (const man of men.filter((m) => m.saves >= SAVES)) lines.push(`${surname(man.name)} (${tag(man)}): ${count(man.saves, "save")}`);
  for (const event of events.filter((e) => (e.kind === "penalty-won" || e.kind === "penalty-missed" || e.kind === "penalty-saved") && e.man !== null)) {
    const what = event.kind === "penalty-won" ? "won a penalty" : event.kind === "penalty-missed" ? "missed a penalty" : "had a penalty saved";
    lines.push(`${surname(event.man!.name)} (${tag(event.man!)}) ${what}`);
  }
  if (match.figures !== null) {
    const { home, away } = match.figures;
    lines.push(`Shots ${home.shots}-${away.shots} · on target ${home.onTarget}-${away.onTarget} · corners ${home.corners}-${away.corners} · clear chances ${home.clearChances}-${away.clearChances}`);
  }
  const free = men.filter((m) => m.holder === null && scored(m) + made(m) > 0).slice(0, FREE_NAMES);
  if (free.length > 0) {
    const what = (m: ReportMan) => [scored(m) > 0 ? count(scored(m), "goal") : null, made(m) > 0 ? count(made(m), "assist") : null].filter(Boolean).join(", ");
    lines.push(`Nobody holds: ${free.map((m) => `${surname(m.name)} (${what(m)})`).join("; ")}`);
  }
  const top = [...men].filter((m) => m.points !== null).sort((a, b) => (b.points ?? 0) - (a.points ?? 0))[0];
  if (top?.points != null && top.holder !== null) lines.push(`Top points: ${surname(top.name)}, ${top.points} for ${top.holder.team}`);

  // The team line always prints; the rest in priority order to the budget.
  const team = lines.find((line) => line.startsWith("Shots "));
  const rest = lines.filter((line) => line !== team).slice(0, Math.max(0, budget - (team === undefined ? 0 : 1)));
  const ordered = team === undefined ? rest : [...rest.slice(0, 3), team, ...rest.slice(3)];
  return [...new Set(ordered)].map((text) => ({ text }));
}
